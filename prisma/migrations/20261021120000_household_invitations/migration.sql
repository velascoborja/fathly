BEGIN;

-- Some databases received an earlier invitation prototype outside this history.
-- Only replace it when empty; never discard existing invitations.
DO $$
BEGIN
  IF to_regclass('"HouseholdInvitation"') IS NOT NULL THEN
    LOCK TABLE "HouseholdInvitation" IN ACCESS EXCLUSIVE MODE;
    IF EXISTS (SELECT 1 FROM "HouseholdInvitation") THEN
      RAISE EXCEPTION 'Existing invitations require migration before upgrading household access';
    END IF;
    DROP TABLE "HouseholdInvitation";
    DROP TYPE IF EXISTS "InvitationStatus";
    DROP TYPE IF EXISTS "InvitationDeliveryStatus";
  END IF;
END $$;

ALTER TYPE "HouseholdRole" RENAME TO "HouseholdRole_old";
CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
ALTER TABLE "HouseholdMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "HouseholdMember" ALTER COLUMN "role" TYPE "HouseholdRole"
  USING (CASE WHEN "role"::text = 'MEMBER' THEN 'EDITOR' ELSE "role"::text END)::"HouseholdRole";
ALTER TABLE "HouseholdMember" ALTER COLUMN "role" SET DEFAULT 'EDITOR';
DROP TYPE "HouseholdRole_old";

CREATE TABLE "HouseholdInvitation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'VIEWER',
    "tokenHash" TEXT NOT NULL,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HouseholdInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HouseholdInvitation_tokenHash_key" ON "HouseholdInvitation"("tokenHash");
CREATE UNIQUE INDEX "HouseholdInvitation_householdId_email_key" ON "HouseholdInvitation"("householdId", "email");
ALTER TABLE "HouseholdInvitation" ADD CONSTRAINT "HouseholdInvitation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvitation" ADD CONSTRAINT "HouseholdInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
