import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SummaryCardProps = {
  label: string
  value: string
  detail?: string
}

export function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <Card className="fathly-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-2xl font-bold">{value}</p>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  )
}
