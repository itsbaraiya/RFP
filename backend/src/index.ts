
// 
// Index
// 

import app from "./app";
import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
}

main();
