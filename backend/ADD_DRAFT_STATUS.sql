-- Add DRAFT status to RFPStatus enum
-- Run this SQL command directly in your PostgreSQL database

ALTER TYPE "public"."RFPStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

