// Script to add DRAFT status to RFPStatus enum
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addDraftStatus() {
  try {
    console.log("Adding DRAFT status to RFPStatus enum...");
    
    // Use raw SQL to add the enum value
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'DRAFT' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'RFPStatus')
        ) THEN
          ALTER TYPE "public"."RFPStatus" ADD VALUE 'DRAFT';
        END IF;
      END $$;
    `);
    
    console.log("✅ DRAFT status added successfully!");
    console.log("Now run: npx prisma generate");
    
  } catch (error: any) {
    console.error("❌ Error adding DRAFT status:", error.message);
    console.log("\nTry running this SQL directly in your database:");
    console.log('ALTER TYPE "public"."RFPStatus" ADD VALUE IF NOT EXISTS \'DRAFT\';');
  } finally {
    await prisma.$disconnect();
  }
}

addDraftStatus();

