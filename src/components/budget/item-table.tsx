import type { Commitment, Deposit } from "@prisma/client"
import { Fragment } from "react"

import { AnnualProratedIndicator } from "@/components/budget/annual-prorated-indicator"
import { ItemizedAmountIndicator } from "@/components/budget/itemized-amount-indicator"
import { BudgetRowActions, BudgetRowContextMenu } from "@/components/budget/budget-row-actions"
import { CollapsibleCategoryGroup } from "@/components/budget/collapsible-category-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/budget/format"
import { getCommitmentIconOption } from "@/lib/budget/commitment-icons"
import { getDepositIconOption } from "@/lib/budget/deposit-icons"
import { commitmentAmountCents, groupCommitmentsForTable, monthlyAmountCents } from "@/lib/budget/math"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import type { CommitmentWithParts } from "@/lib/budget/types"

type Dictionary = (typeof dictionaries)[Locale]

export function DepositTable({
  deposits,
  dictionary,
  locale,
  onDelete,
  onUpdate,
}: {
  deposits: Deposit[]
  dictionary: Dictionary
  locale: Locale
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, formData: FormData) => Promise<void>
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
                <BudgetRowContextMenu
                  deleteAction={onDelete.bind(null, deposit.id)}
                  dictionary={dictionary}
                  item={deposit}
                  key={deposit.id}
                  kind="deposit"
                  updateAction={onUpdate.bind(null, deposit.id)}
                >
                  <TableRow className="hover:[&>td]:bg-muted/35">
                    <TableCell className="font-medium">
                      <DepositName deposit={deposit} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{deposit.notes}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(deposit.amountCents, locale)}</TableCell>
                    <TableCell>
                      <BudgetRowActions
                        deleteAction={onDelete.bind(null, deposit.id)}
                        dictionary={dictionary}
                        item={deposit}
                        kind="deposit"
                        updateAction={onUpdate.bind(null, deposit.id)}
                      />
                    </TableCell>
                  </TableRow>
                </BudgetRowContextMenu>
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
  hideFrequency = true,
  locale,
  onDelete,
  onUpdate,
  showProratedAmount = false,
  title,
}: {
  commitments: CommitmentWithParts[]
  dictionary: Dictionary
  groupByCategory?: boolean
  hideFrequency?: boolean
  locale: Locale
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, formData: FormData) => Promise<void>
  showProratedAmount?: boolean
  title: string
}) {
  const categoryGroups = groupByCategory ? groupCommitmentsForTable(commitments) : []
  const categoryOptions = getCategoryOptions(commitments)
  const displayAmountCents = (commitment: CommitmentWithParts) =>
    showProratedAmount ? commitmentAmountCents(commitment) : monthlyAmountCents(commitment)

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
                    <CollapsibleCategoryGroup
                      actionColumn
                      category={group.category}
                      collapseLabel={dictionary.actions.collapseCategory}
                      expandLabel={dictionary.actions.expandCategory}
                      extraTrailingCells={Number(showProratedAmount)}
                      leadingColSpan={hideFrequency ? 1 : 2}
                      total={formatCurrency(
                        showProratedAmount
                          ? group.commitments.reduce((sum, commitment) => sum + displayAmountCents(commitment), 0)
                          : group.totalCents,
                        locale
                      )}
                      totalLabel={dictionary.dashboard.categoryTotal}
                    >
                      {group.commitments.map((commitment, index) => (
                        <BudgetRowContextMenu
                          deleteAction={onDelete.bind(null, commitment.id)}
                          categoryOptions={categoryOptions}
                          dictionary={dictionary}
                          item={commitment}
                          key={commitment.id}
                          kind="commitment"
                          updateAction={onUpdate.bind(null, commitment.id)}
                        >
                          <TableRow
                            className={
                              index === group.commitments.length - 1
                                ? "border-b-0 hover:[&>td]:bg-muted/35"
                                : "hover:[&>td]:bg-muted/35"
                            }
                          >
                            <TableCell className="pl-6 font-medium">
                              <CommitmentName commitment={commitment} dictionary={dictionary} />
                            </TableCell>
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
                              <BudgetRowActions
                                deleteAction={onDelete.bind(null, commitment.id)}
                                categoryOptions={categoryOptions}
                                dictionary={dictionary}
                                item={commitment}
                                kind="commitment"
                                updateAction={onUpdate.bind(null, commitment.id)}
                              />
                            </TableCell>
                          </TableRow>
                        </BudgetRowContextMenu>
                      ))}
                    </CollapsibleCategoryGroup>
                  </Fragment>
                ))
              : commitments.map((commitment) => (
                  <BudgetRowContextMenu
                    deleteAction={onDelete.bind(null, commitment.id)}
                    categoryOptions={categoryOptions}
                    dictionary={dictionary}
                    item={commitment}
                    key={commitment.id}
                    kind="commitment"
                    updateAction={onUpdate.bind(null, commitment.id)}
                  >
                    <TableRow className="hover:[&>td]:bg-muted/35">
                      <TableCell className="font-medium">
                        <CommitmentName commitment={commitment} dictionary={dictionary} />
                      </TableCell>
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
                        <BudgetRowActions
                          deleteAction={onDelete.bind(null, commitment.id)}
                          categoryOptions={categoryOptions}
                          dictionary={dictionary}
                          item={commitment}
                          kind="commitment"
                          updateAction={onUpdate.bind(null, commitment.id)}
                        />
                      </TableCell>
                    </TableRow>
                  </BudgetRowContextMenu>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function getCategoryOptions(commitments: Pick<Commitment, "category">[]) {
  return Array.from(new Set(commitments.map((commitment) => commitment.category).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  )
}

function CommitmentName({
  commitment,
  dictionary,
}: {
  commitment: Pick<Commitment, "amountMode" | "frequency" | "icon" | "name">
  dictionary: Dictionary
}) {
  const option = getCommitmentIconOption(commitment.icon)
  const Icon = option.icon

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${option.swatch}`}>
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate">{commitment.name}</span>
        <AnnualProratedIndicator
          accessibleLabel={dictionary.forms.annualProratedIndicator}
          frequency={commitment.frequency}
          label={dictionary.forms.annual}
        />
        <ItemizedAmountIndicator
          accessibleLabel={dictionary.forms.itemizedAmountIndicator}
          amountMode={commitment.amountMode}
          label={dictionary.forms.itemized}
        />
      </span>
    </span>
  )
}

function DepositName({ deposit }: { deposit: Pick<Deposit, "icon" | "name"> }) {
  const option = getDepositIconOption(deposit.icon)
  const Icon = option.icon

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${option.swatch}`}>
        <Icon className="size-4" />
      </span>
      <span className="truncate">{deposit.name}</span>
    </span>
  )
}
