import { prisma } from './config/db';

async function testConnection() {
  try {
    console.log('Testing connection to PostgreSQL using Prisma client...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Connection successful! Query result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
