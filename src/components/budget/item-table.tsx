import type { Commitment, Deposit } from "@prisma/client"
import { Fragment } from "react"

import { DeleteButton } from "@/components/budget/delete-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/budget/format"
import { groupCommitmentsForTable, monthlyAmountCents } from "@/lib/budget/math"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

export function DepositTable({
  deposits,
  dictionary,
  locale,
  onDelete,
}: {
  deposits: Deposit[]
  dictionary: Dictionary
  locale: Locale
  onDelete: (id: string) => Promise<void>
}) {
  return (
    <Card className="fathly-card">
      <CardHeader className="pr-44 max-sm:pr-5">
        <CardTitle>{dictionary.nav.deposits}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary.forms.name}</TableHead>
              <TableHead className="hidden sm:table-cell">{dictionary.forms.notes}</TableHead>
              <TableHead className="text-right">{dictionary.forms.amount}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={4}>
                  {dictionary.dashboard.emptyBody}
                </TableCell>
              </TableRow>
            ) : (
              deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell className="font-medium">{deposit.name}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{deposit.notes}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(deposit.amountCents, locale)}</TableCell>
                  <TableCell>
                    <DeleteButton action={onDelete.bind(null, deposit.id)} label={`Delete ${deposit.name}`} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function CommitmentTable({
  commitments,
  dictionary,
  groupByCategory = false,
  hideFrequency = false,
  locale,
  onDelete,
  showProratedAmount = false,
  title,
}: {
  commitments: Commitment[]
  dictionary: Dictionary
  groupByCategory?: boolean
  hideFrequency?: boolean
  locale: Locale
  onDelete: (id: string) => Promise<void>
  showProratedAmount?: boolean
  title: string
}) {
  const categoryGroups = groupByCategory ? groupCommitmentsForTable(commitments) : []
  const displayAmountCents = (commitment: Commitment) =>
    showProratedAmount ? commitment.amountCents : monthlyAmountCents(commitment)

  return (
    <Card className="fathly-card">
      <CardHeader className="pr-44 max-sm:pr-5">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary.forms.name}</TableHead>
              {!groupByCategory && <TableHead className="hidden sm:table-cell">{dictionary.forms.category}</TableHead>}
              {!hideFrequency && <TableHead className="hidden sm:table-cell">{dictionary.forms.frequency}</TableHead>}
              <TableHead className="text-right">{dictionary.forms.amount}</TableHead>
              {showProratedAmount && <TableHead className="text-right">{dictionary.forms.prorated}</TableHead>}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {commitments.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={1 + Number(!groupByCategory) + Number(!hideFrequency) + 1 + Number(showProratedAmount) + 1}
                >
                  {dictionary.dashboard.emptyBody}
                </TableCell>
              </TableRow>
            ) : groupByCategory
              ? categoryGroups.map((group) => (
                  <Fragment key={group.category}>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableCell className="font-semibold" colSpan={hideFrequency ? 1 : 2}>
                        {group.category}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(
                          showProratedAmount
                            ? group.commitments.reduce((sum, commitment) => sum + displayAmountCents(commitment), 0)
                            : group.totalCents,
                          locale
                        )}
                      </TableCell>
                      {showProratedAmount && <TableCell />}
                      <TableCell />
                    </TableRow>
                    {group.commitments.map((commitment) => (
                      <TableRow key={commitment.id}>
                        <TableCell className="pl-6 font-medium">{commitment.name}</TableCell>
                        {!hideFrequency && (
                          <TableCell className="hidden sm:table-cell">
                            {commitment.frequency === "ANNUAL" ? dictionary.forms.annual : dictionary.forms.monthly}
                          </TableCell>
                        )}
                        <TableCell className="text-right font-mono">
                          {formatCurrency(displayAmountCents(commitment), locale)}
                        </TableCell>
                        {showProratedAmount && (
                          <TableCell className="text-right font-mono">
                            {formatCurrency(monthlyAmountCents(commitment), locale)}
                          </TableCell>
                        )}
                        <TableCell>
                          <DeleteButton action={onDelete.bind(null, commitment.id)} label={`Delete ${commitment.name}`} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))
              : commitments.map((commitment) => (
                  <TableRow key={commitment.id}>
                    <TableCell className="font-medium">{commitment.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{commitment.category}</TableCell>
                    {!hideFrequency && (
                      <TableCell className="hidden sm:table-cell">
                        {commitment.frequency === "ANNUAL" ? dictionary.forms.annual : dictionary.forms.monthly}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono">
                      {formatCurrency(displayAmountCents(commitment), locale)}
                    </TableCell>
                    {showProratedAmount && (
                      <TableCell className="text-right font-mono">
                        {formatCurrency(monthlyAmountCents(commitment), locale)}
                      </TableCell>
                    )}
                    <TableCell>
                      <DeleteButton action={onDelete.bind(null, commitment.id)} label={`Delete ${commitment.name}`} />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
