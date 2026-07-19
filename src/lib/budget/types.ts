import type { Commitment, CommitmentPart } from "@prisma/client"

export type CommitmentWithParts = Commitment & {
  parts: CommitmentPart[]
}
