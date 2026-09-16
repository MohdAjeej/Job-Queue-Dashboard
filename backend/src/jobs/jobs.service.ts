import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { Job, JobStatus } from './entities/job.entity';

@Injectable()
export class JobsService {
  private prisma = new PrismaClient();

  /**
   * Valid status transitions map
   * Each status maps to an array of statuses it can transition to
   */
  private readonly validTransitions: Record<JobStatus, JobStatus[]> = {
    [JobStatus.PENDING]: [JobStatus.RUNNING, JobStatus.FAILED],
    [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
    [JobStatus.COMPLETED]: [],
    [JobStatus.FAILED]: [],
  };

  async create(createJobDto: CreateJobDto): Promise<Job> {
    const job = await this.prisma.job.create({
      data: {
        title: createJobDto.title,
        type: createJobDto.type,
        status: JobStatus.PENDING,
      },
    });

    return job as Job;
  }

  async findAll(): Promise<Job[]> {
    const jobs = await this.prisma.job.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jobs as Job[];
  }

  async updateStatus(
    id: string,
    updateJobStatusDto: UpdateJobStatusDto,
  ): Promise<Job> {
    const newStatus = updateJobStatusDto.status;

    // First, get the current job to check its current status
    const currentJob = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!currentJob) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const currentStatus = currentJob.status as JobStatus;

    // Validate the transition
    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    /**
     * CONCURRENCY-SAFE UPDATE
     * 
     * This uses Prisma's atomic update with a WHERE condition.
     * The update will only succeed if the job's current status matches
     * what we expect. If another request has already changed the status,
     * this update will affect 0 rows and we'll detect the conflict.
     * 
     * This prevents the race condition where two simultaneous requests
     * try to transition the same job (e.g., both trying pending -> running).
     * Only one will succeed; the other will find that the status has changed.
     */
    try {
      const updatedJob = await this.prisma.job.updateMany({
        where: {
          id,
          status: currentStatus, // Only update if status hasn't changed
        },
        data: {
          status: newStatus,
        },
      });

      // If count is 0, the job's status was changed by another request
      if (updatedJob.count === 0) {
        throw new ConflictException(
          `Job status has been modified by another request. Please refresh and try again.`,
        );
      }

      // Fetch and return the updated job
      const job = await this.prisma.job.findUnique({
        where: { id },
      });

      return job as Job;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to update job status');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.job.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
  }

  /**
   * Validates if a status transition is allowed
   */
  private isValidTransition(
    currentStatus: JobStatus,
    newStatus: JobStatus,
  ): boolean {
    const allowedTransitions = this.validTransitions[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Cleanup method for testing
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
