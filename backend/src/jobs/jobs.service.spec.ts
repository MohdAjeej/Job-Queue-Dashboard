import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JobStatus } from './entities/job.entity';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsService],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  afterEach(async () => {
    // Clean up - delete all jobs created during tests
    const jobs = await service.findAll();
    for (const job of jobs) {
      try {
        await service.remove(job.id);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('create', () => {
    it('should create a job with pending status', async () => {
      const createJobDto = {
        title: 'Test Job',
        type: 'test',
      };

      const job = await service.create(createJobDto);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.title).toBe('Test Job');
      expect(job.type).toBe('test');
      expect(job.status).toBe(JobStatus.PENDING);
      expect(job.createdAt).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all jobs sorted by createdAt desc', async () => {
      await service.create({ title: 'Job 1', type: 'test' });
      await service.create({ title: 'Job 2', type: 'test' });

      const jobs = await service.findAll();

      expect(jobs.length).toBeGreaterThanOrEqual(2);
      expect(jobs[0].title).toBe('Job 2'); // Most recent first
    });
  });

  describe('updateStatus - Valid Transitions', () => {
    it('should allow pending -> running', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });

      const updated = await service.updateStatus(job.id, {
        status: JobStatus.RUNNING,
      });

      expect(updated.status).toBe(JobStatus.RUNNING);
    });

    it('should allow pending -> failed', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });

      const updated = await service.updateStatus(job.id, {
        status: JobStatus.FAILED,
      });

      expect(updated.status).toBe(JobStatus.FAILED);
    });

    it('should allow running -> completed', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.RUNNING });

      const updated = await service.updateStatus(job.id, {
        status: JobStatus.COMPLETED,
      });

      expect(updated.status).toBe(JobStatus.COMPLETED);
    });

    it('should allow running -> failed', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.RUNNING });

      const updated = await service.updateStatus(job.id, {
        status: JobStatus.FAILED,
      });

      expect(updated.status).toBe(JobStatus.FAILED);
    });
  });

  describe('updateStatus - Invalid Transitions', () => {
    it('should reject pending -> completed', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });

      await expect(
        service.updateStatus(job.id, { status: JobStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject completed -> running', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.RUNNING });
      await service.updateStatus(job.id, { status: JobStatus.COMPLETED });

      await expect(
        service.updateStatus(job.id, { status: JobStatus.RUNNING }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject completed -> pending', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.RUNNING });
      await service.updateStatus(job.id, { status: JobStatus.COMPLETED });

      await expect(
        service.updateStatus(job.id, { status: JobStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject completed -> failed', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.RUNNING });
      await service.updateStatus(job.id, { status: JobStatus.COMPLETED });

      await expect(
        service.updateStatus(job.id, { status: JobStatus.FAILED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject failed -> running', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.FAILED });

      await expect(
        service.updateStatus(job.id, { status: JobStatus.RUNNING }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject failed -> pending', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.FAILED });

      await expect(
        service.updateStatus(job.id, { status: JobStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject failed -> completed', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });
      await service.updateStatus(job.id, { status: JobStatus.FAILED });

      await expect(
        service.updateStatus(job.id, { status: JobStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus - Non-existent Job', () => {
    it('should throw NotFoundException for non-existent job', async () => {
      await expect(
        service.updateStatus('non-existent-id', { status: JobStatus.RUNNING }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus - Concurrency Safety', () => {
    it('should handle concurrent status updates safely', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });

      // Simulate two concurrent requests trying to transition pending -> running
      const update1 = service.updateStatus(job.id, {
        status: JobStatus.RUNNING,
      });
      const update2 = service.updateStatus(job.id, {
        status: JobStatus.RUNNING,
      });

      // One should succeed, one should fail
      const results = await Promise.allSettled([update1, update2]);

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      // Exactly one should succeed
      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);

      // The failed one should be a ConflictException or BadRequestException
      const rejectedResult = failed[0] as PromiseRejectedResult;
      expect(
        rejectedResult.reason instanceof ConflictException ||
        rejectedResult.reason instanceof BadRequestException,
      ).toBe(true);

      // Verify final state is RUNNING (not corrupted)
      const finalJob = await service.findAll();
      const updatedJob = finalJob.find((j) => j.id === job.id);
      expect(updatedJob?.status).toBe(JobStatus.RUNNING);
    });
  });

  describe('remove', () => {
    it('should delete an existing job', async () => {
      const job = await service.create({ title: 'Test Job', type: 'test' });

      await service.remove(job.id);

      await expect(
        service.updateStatus(job.id, { status: JobStatus.RUNNING }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
