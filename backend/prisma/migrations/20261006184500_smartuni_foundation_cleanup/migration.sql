-- 1. Clean up MektepAI demo users and restore admin@smartuni.kz role to ADMIN
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='schoolId') THEN
    EXECUTE 'UPDATE "User" SET "schoolId" = NULL WHERE "email" = ''admin@smartuni.kz''';
  END IF;
END $$;
DELETE FROM "User" WHERE "email" LIKE '%@mektepai.kz';

-- 2. Alter UserRole enum back to STUDENT, TEACHER, ADMIN
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@smartuni.kz';
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- 3. Drop all school foreign keys
ALTER TABLE IF EXISTS "AcademicYear" DROP CONSTRAINT IF EXISTS "AcademicYear_schoolId_fkey";
ALTER TABLE IF EXISTS "Building" DROP CONSTRAINT IF EXISTS "Building_schoolId_fkey";
ALTER TABLE IF EXISTS "Class" DROP CONSTRAINT IF EXISTS "Class_academicYearId_fkey";
ALTER TABLE IF EXISTS "Class" DROP CONSTRAINT IF EXISTS "Class_classTeacherId_fkey";
ALTER TABLE IF EXISTS "Class" DROP CONSTRAINT IF EXISTS "Class_schoolId_fkey";
ALTER TABLE IF EXISTS "Floor" DROP CONSTRAINT IF EXISTS "Floor_buildingId_fkey";
ALTER TABLE IF EXISTS "ParentProfile" DROP CONSTRAINT IF EXISTS "ParentProfile_schoolId_fkey";
ALTER TABLE IF EXISTS "ParentProfile" DROP CONSTRAINT IF EXISTS "ParentProfile_userId_fkey";
ALTER TABLE IF EXISTS "ParentStudentRelation" DROP CONSTRAINT IF EXISTS "ParentStudentRelation_parentId_fkey";
ALTER TABLE IF EXISTS "ParentStudentRelation" DROP CONSTRAINT IF EXISTS "ParentStudentRelation_studentId_fkey";
ALTER TABLE IF EXISTS "Room" DROP CONSTRAINT IF EXISTS "Room_floorId_fkey";
ALTER TABLE IF EXISTS "StudentProfile" DROP CONSTRAINT IF EXISTS "StudentProfile_classId_fkey";
ALTER TABLE IF EXISTS "StudentProfile" DROP CONSTRAINT IF EXISTS "StudentProfile_schoolId_fkey";
ALTER TABLE IF EXISTS "Subject" DROP CONSTRAINT IF EXISTS "Subject_schoolId_fkey";
ALTER TABLE IF EXISTS "TeacherProfile" DROP CONSTRAINT IF EXISTS "TeacherProfile_schoolId_fkey";
ALTER TABLE IF EXISTS "Term" DROP CONSTRAINT IF EXISTS "Term_academicYearId_fkey";
ALTER TABLE IF EXISTS "User" DROP CONSTRAINT IF EXISTS "User_schoolId_fkey";

-- 4. Drop school indexes
DROP INDEX IF EXISTS "StudentProfile_classId_idx";
DROP INDEX IF EXISTS "StudentProfile_iin_key";
DROP INDEX IF EXISTS "StudentProfile_joinCode_key";
DROP INDEX IF EXISTS "StudentProfile_schoolId_idx";
DROP INDEX IF EXISTS "Subject_schoolId_idx";
DROP INDEX IF EXISTS "TeacherProfile_employeeId_key";
DROP INDEX IF EXISTS "TeacherProfile_schoolId_idx";
DROP INDEX IF EXISTS "User_schoolId_idx";

-- 5. Alter tables to drop school columns and enforce required university fields
ALTER TABLE "StudentProfile" 
DROP COLUMN IF EXISTS "birthDate",
DROP COLUMN IF EXISTS "classId",
DROP COLUMN IF EXISTS "firstName",
DROP COLUMN IF EXISTS "gender",
DROP COLUMN IF EXISTS "homeAddress",
DROP COLUMN IF EXISTS "iin",
DROP COLUMN IF EXISTS "joinCode",
DROP COLUMN IF EXISTS "lastName",
DROP COLUMN IF EXISTS "patronymic",
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "schoolId",
DROP COLUMN IF EXISTS "streakDays";

ALTER TABLE "StudentProfile"
ALTER COLUMN "universityId" SET NOT NULL,
ALTER COLUMN "facultyId" SET NOT NULL,
ALTER COLUMN "majorId" SET NOT NULL,
ALTER COLUMN "course" SET NOT NULL;

ALTER TABLE "Subject" DROP COLUMN IF EXISTS "schoolId";

ALTER TABLE "TeacherProfile" 
DROP COLUMN IF EXISTS "employeeId",
DROP COLUMN IF EXISTS "firstName",
DROP COLUMN IF EXISTS "isApproved",
DROP COLUMN IF EXISTS "lastName",
DROP COLUMN IF EXISTS "patronymic",
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "qualification",
DROP COLUMN IF EXISTS "schoolId",
DROP COLUMN IF EXISTS "specialization";

ALTER TABLE "TeacherProfile"
ALTER COLUMN "universityId" SET NOT NULL,
ALTER COLUMN "facultyId" SET NOT NULL;

ALTER TABLE "User" DROP COLUMN IF EXISTS "schoolId";

-- 6. Drop school tables
DROP TABLE IF EXISTS "ParentStudentRelation" CASCADE;
DROP TABLE IF EXISTS "ParentProfile" CASCADE;
DROP TABLE IF EXISTS "Room" CASCADE;
DROP TABLE IF EXISTS "Floor" CASCADE;
DROP TABLE IF EXISTS "Building" CASCADE;
DROP TABLE IF EXISTS "Class" CASCADE;
DROP TABLE IF EXISTS "Term" CASCADE;
DROP TABLE IF EXISTS "AcademicYear" CASCADE;
DROP TABLE IF EXISTS "School" CASCADE;

-- 7. Drop school enum
DROP TYPE IF EXISTS "RelationStatus";

