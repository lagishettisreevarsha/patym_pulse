import { seedDemoData } from '../src/services/demo/seeder.service';
import { prisma } from '../src/config/db';

async function main() {
  await seedDemoData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
