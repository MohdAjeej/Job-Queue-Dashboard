import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.job.createMany({
    data: [
      {
        title: 'Generate Monthly Report',
        type: 'report',
        status: 'pending',
      },
      {
        title: 'Send Welcome Email',
        type: 'email',
        status: 'running',
      },
      {
        title: 'Process Payment',
        type: 'payment',
        status: 'completed',
      },
      {
        title: 'Backup Database',
        type: 'backup',
        status: 'completed',
      },
      {
        title: 'Generate Invoice',
        type: 'invoice',
        status: 'failed',
      },
      {
        title: 'Data Export',
        type: 'export',
        status: 'pending',
      },
    ],
  });

  console.log('Seeded 6 jobs successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
