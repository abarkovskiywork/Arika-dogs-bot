
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path"

console.log("PRISMA DB URL: ", process.env.DATABASE_URL);

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });
