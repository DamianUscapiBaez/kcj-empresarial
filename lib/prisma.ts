import "server-only";
import { PrismaClient } from "@prisma/client";
const globalPrisma = globalThis as unknown as { kcjPrisma?: PrismaClient };
export const prisma = globalPrisma.kcjPrisma ?? new PrismaClient({log:process.env.NODE_ENV === "development" ? ["error","warn"] : ["error"]});
if (process.env.NODE_ENV !== "production") globalPrisma.kcjPrisma = prisma;
