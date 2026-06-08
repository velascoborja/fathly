import type { Commitment, Deposit } from "@prisma/client"

import { DeleteButton } from "@/components/budget/delete-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/budget/format"
import { monthlyAmountCents } from "@/lib/budget/math"
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
      <CardHeader>
        <CardTitle>{dictionary.nav.deposits}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary.forms.name}</TableHead>
              <TableHead>{dictionary.forms.notes}</TableHead>
              <TableHead className="text-right">{dictionary.forms.amount}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => (
              <TableRow key={deposit.id}>
                <TableCell className="font-medium">{deposit.name}</TableCell>
                <TableCell className="text-muted-foreground">{deposit.notes}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(deposit.amountCents, locale)}</TableCell>
                <TableCell>
                  <DeleteButton action={onDelete.bind(null, deposit.id)} label={`Delete ${deposit.name}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function CommitmentTable({
  commitments,
  dictionary,
  locale,
  onDelete,
  title,
}: {
  commitments: Commitment[]
  dictionary: Dictionary
  locale: Locale
  onDelete: (id: string) => Promise<void>
  title: string
}) {
  return (
    <Card className="fathly-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary.forms.name}</TableHead>
              <TableHead>{dictionary.forms.category}</TableHead>
              <TableHead>{dictionary.forms.frequency}</TableHead>
              <TableHead className="text-right">{dictionary.forms.amount}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {commitments.map((commitment) => (
              <TableRow key={commitment.id}>
                <TableCell className="font-medium">{commitment.name}</TableCell>
                <TableCell>{commitment.category}</TableCell>
                <TableCell>{commitment.frequency === "ANNUAL" ? dictionary.forms.annual : dictionary.forms.monthly}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(monthlyAmountCents(commitment), locale)}</TableCell>
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
