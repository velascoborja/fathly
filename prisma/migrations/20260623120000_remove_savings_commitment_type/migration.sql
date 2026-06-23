UPDATE "Commitment"
SET "type" = 'BILL'
WHERE "type" = 'SAVINGS';

ALTER TYPE "CommitmentType" RENAME TO "CommitmentType_old";
CREATE TYPE "CommitmentType" AS ENUM ('BILL');

ALTER TABLE "Commitment" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Commitment"
  ALTER COLUMN "type" TYPE "CommitmentType"
  USING "type"::text::"CommitmentType";
ALTER TABLE "Commitment" ALTER COLUMN "type" SET DEFAULT 'BILL';

DROP TYPE "CommitmentType_old";
