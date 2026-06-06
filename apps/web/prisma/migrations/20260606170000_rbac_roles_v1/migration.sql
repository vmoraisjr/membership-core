-- Rename the existing enum to preserve current values during conversion.
ALTER TYPE "AppUserRole" RENAME TO "AppUserRole_old";

-- Create the new V1 role enum.
CREATE TYPE "AppUserRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'STAFF',
    'FINANCE',
    'READ_ONLY'
);

-- Convert current AppUser roles to the new enum.
ALTER TABLE "AppUser"
ALTER COLUMN "role" TYPE "AppUserRole"
USING (
    CASE "role"::text
        WHEN 'MANAGER' THEN 'OWNER'
        WHEN 'ADMIN' THEN 'ADMIN'
        WHEN 'STAFF' THEN 'STAFF'
        ELSE 'STAFF'
    END
)::"AppUserRole";

-- Convert invite roles if the table already contains records.
ALTER TABLE "UserInvite"
ALTER COLUMN "role" TYPE "AppUserRole"
USING (
    CASE "role"::text
        WHEN 'MANAGER' THEN 'OWNER'
        WHEN 'ADMIN' THEN 'ADMIN'
        WHEN 'STAFF' THEN 'STAFF'
        ELSE 'STAFF'
    END
)::"AppUserRole";

DROP TYPE "AppUserRole_old";
