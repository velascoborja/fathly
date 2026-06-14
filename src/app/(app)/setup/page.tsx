import { redirect } from "next/navigation"
import { ArrowRightIcon, CircleDollarSignIcon, LayoutDashboardIcon, ReceiptTextIcon } from "lucide-react"

import { InitialSetupForm } from "@/components/app/initial-setup-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getServerDictionary } from "@/lib/i18n/server"
import { completeInitialSetup } from "@/server/actions"
import { getBudgetData } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function SetupPage() {
  const [data, dictionary] = await Promise.all([getBudgetData(), getServerDictionary()])

  if (data.plan.onboardingCompletedAt) {
    redirect("/dashboard")
  }

  const steps = [
    {
      body: dictionary.setup.stepIncomeBody,
      icon: CircleDollarSignIcon,
      title: dictionary.setup.stepIncome,
    },
    {
      body: dictionary.setup.stepExpensesBody,
      icon: ReceiptTextIcon,
      title: dictionary.setup.stepExpenses,
    },
    {
      body: dictionary.setup.stepDashboardBody,
      icon: LayoutDashboardIcon,
      title: dictionary.setup.stepDashboard,
    },
  ]

  return (
    <section className="flex flex-col gap-5">
      <div className="fathly-hero grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
        <div className="flex flex-col gap-4">
          <Badge className="w-fit" variant="secondary">
            {dictionary.setup.eyebrow}
          </Badge>
          <div className="flex flex-col gap-3">
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
              {dictionary.setup.title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {dictionary.setup.subtitle}
            </p>
          </div>
        </div>

        <Card className="fathly-card bg-card/90">
          <CardContent className="flex flex-col gap-3 p-4">
            {steps.map((step, index) => {
              const Icon = step.icon

              return (
                <div key={step.title} className="flex gap-3 rounded-[20px] border border-border bg-muted/55 p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-bold leading-tight">{step.title}</h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{step.body}</p>
                  </div>
                  {index < steps.length - 1 ? <ArrowRightIcon className="ml-auto hidden shrink-0 text-primary lg:block" /> : null}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <InitialSetupForm action={completeInitialSetup} dictionary={dictionary} />
    </section>
  )
}
