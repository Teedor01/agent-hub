import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
};

const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Keep this well under Supabase's transaction-pooler connection cap.
    max: 3,
  });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}
