import { PrismaClient } from "../src/generated/prisma"; 

import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.password && !u.password.startsWith("$2b$")) {
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hashed },
      });
      console.log(`Updated password for user ${u.email}`);
    }
  }
}

main()
  .then(() => {
    console.log("Done hashing old passwords");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
