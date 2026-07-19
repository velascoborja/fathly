CREATE TYPE "CommitmentAmountMode" AS ENUM ('FIXED', 'ITEMIZED');

ALTER TABLE "Commitment"
ADD COLUMN "amountMode" "CommitmentAmountMode" NOT NULL DEFAULT 'FIXED',
ALTER COLUMN "amountCents" DROP NOT NULL;

ALTER TABLE "Commitment"
ADD CONSTRAINT "Commitment_amount_mode_amount_check"
CHECK (
  ("amountMode" = 'FIXED' AND "amountCents" IS NOT NULL)
  OR
  ("amountMode" = 'ITEMIZED' AND "amountCents" IS NULL)
);

CREATE TABLE "CommitmentPart" (
  "id" TEXT NOT NULL,
  "commitmentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommitmentPart_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommitmentPart_commitmentId_sortOrder_idx"
ON "CommitmentPart"("commitmentId", "sortOrder");

ALTER TABLE "CommitmentPart"
ADD CONSTRAINT "CommitmentPart_commitmentId_fkey"
FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
