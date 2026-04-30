require("dotenv").config();

const path = require("path");
const fs = require("fs");
const prisma = require("./src/db/prisma");

async function main() {
  console.log("cwd:", process.cwd());
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  const dbPath = path.resolve(process.cwd(), "dev.db");
  console.log("resolved db path:", dbPath);
  console.log("db exists:", fs.existsSync(dbPath));

  const tables = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`
  );

  console.log("tables in runtime db:", tables);

  const booking = await prisma.booking.create({
    data: {
      userTelegramId: "123456",
      username: "anton_test",
      serviceType: "walk",
      startDate: new Date("2026-04-05"),
      endDate: new Date("2026-04-05"),
      walkTime: "18:00",
    },
  });

  console.log("created booking:", booking);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());