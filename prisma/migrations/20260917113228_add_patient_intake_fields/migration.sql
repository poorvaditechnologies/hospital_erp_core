-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gender" "Gender";
