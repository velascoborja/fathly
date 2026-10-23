import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { expect, test as base, type Page } from "@playwright/test"

import { normalizeDatabaseUrl } from "../../src/lib/database-url"
import { dictionaries } from "../../src/lib/i18n/dictionaries"

loadEnvConfig(process.cwd())

type DragBudget = {
  prisma: PrismaClient
  householdId: string
  userId: string
  ids: Record<"monthly" | "annual" | "itemized", string>
}

const test = base.extend<{ dragBudget: DragBudget }>({
  dragBudget: async ({ context, baseURL }, runFixture) => {
    if (!process.env.DATABASE_URL || !baseURL) throw new Error("Database fixtures require DATABASE_URL and a base URL")
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) }),
    })
    const prefix = `e2e-drag-${randomUUID()}`
    const householdId = `${prefix}-household`
    const userId = `${prefix}-user`
    const ids = { monthly: `${prefix}-monthly`, annual: `${prefix}-annual`, itemized: `${prefix}-itemized` }
    try {
      await prisma.user.create({ data: { id: userId, name: "Drag test" } })
      await prisma.household.create({
        data: {
          id: householdId,
          name: "Drag test budget",
          members: { create: { userId, role: "OWNER" } },
          budgetPlans: {
            create: {
              name: "Drag test plan",
              onboardingCompletedAt: new Date(),
              deposits: { create: { householdId, name: "Ingreso", amountCents: 200_000 } },
              commitments: {
                create: [
                  { id: ids.monthly, householdId, name: "Internet", category: "Suministros", frequency: "MONTHLY", amountCents: 5_000, sortOrder: 3 },
                  { householdId, name: "Agua", category: "Suministros", frequency: "MONTHLY", amountCents: 2_000, sortOrder: 4 },
                  { id: ids.annual, householdId, name: "Seguro hogar", category: "Casa", frequency: "ANNUAL", amountCents: 120_000, sortOrder: 2 },
                  {
                    id: ids.itemized, householdId, name: "Seguro e IBI", category: "Impuestos", frequency: "ANNUAL",
                    amountMode: "ITEMIZED", sortOrder: 1,
                    parts: { create: [{ name: "Seguro", amountCents: 24_000 }, { name: "IBI", amountCents: 12_000, sortOrder: 1 }] },
                  },
                ],
              },
            },
          },
        },
      })
      const sessionToken = randomUUID()
      await prisma.session.create({ data: { userId, sessionToken, expires: new Date(Date.now() + 3_600_000) } })
      await context.addCookies([
        { name: "authjs.session-token", value: sessionToken, url: baseURL, httpOnly: true, sameSite: "Lax" },
        { name: "fathly-locale", value: "es", url: baseURL },
      ])
      await runFixture({ prisma, householdId, userId, ids })
    } finally {
      await prisma.household.deleteMany({ where: { id: householdId } })
      await prisma.user.deleteMany({ where: { id: userId } })
      await prisma.$disconnect()
    }
  },
})

function row(page: Page, id: string) {
  return page.locator(`[data-commitment-id="${id}"]`)
}

function categoryHeader(page: Page, category: string) {
  return page.locator(`[data-category-drop-target="${category}"]`).first()
}

function rowCategory(page: Page, id: string) {
  return row(page, id).locator("xpath=ancestor::tr[@data-category-drop-target][1]")
}

test.describe("expense category drag", () => {
  test.skip(process.env.FATHLY_E2E_DATABASE !== "1", "Enable isolated database fixtures with FATHLY_E2E_DATABASE=1")

  test.describe("desktop", () => {
    test.skip(({ isMobile }) => isMobile, "Native drag is desktop only")

    test("moves a monthly expense onto a category header and persists only its category", async ({ page, dragBudget }, testInfo) => {
      const { prisma, ids } = dragBudget
      const before = await prisma.commitment.findUniqueOrThrow({ where: { id: ids.monthly }, include: { parts: true } })
      await page.goto("/dashboard")
      await expect(row(page, ids.monthly)).toHaveAttribute("draggable", "true")
      await row(page, ids.monthly).locator("td").first().dragTo(categoryHeader(page, "Casa"))

      await expect(rowCategory(page, ids.monthly)).toHaveAttribute("data-category-drop-target", "Casa")
      await expect(categoryHeader(page, "Casa")).toContainText(/150\s*€/)
      await expect(categoryHeader(page, "Suministros")).toContainText(/20\s*€/)
      const after = await prisma.commitment.findUniqueOrThrow({ where: { id: ids.monthly }, include: { parts: true } })
      expect(after).toEqual({ ...before, category: "Casa", updatedAt: after.updatedAt })

      await page.reload()
      await expect(rowCategory(page, ids.monthly)).toHaveAttribute("data-category-drop-target", "Casa")
      await expect(page.getByText(/^200\s*€$/).first()).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath("category-moved-desktop.png"), fullPage: true })
    })

    for (const kind of ["annual", "itemized"] as const) {
      test(`moves an ${kind} expense into a collapsed category without changing its amounts or parts`, async ({ page, dragBudget }) => {
        const { prisma, ids } = dragBudget
        const before = await prisma.commitment.findUniqueOrThrow({ where: { id: ids[kind] }, include: { parts: { orderBy: { sortOrder: "asc" } } } })
        await page.goto("/dashboard")
        await expect(row(page, ids[kind])).toHaveAttribute("draggable", "true")
        await page.getByRole("button", { name: "Contraer Suministros", exact: true }).click()
        await expect(page.locator('[data-category-drop-target="Suministros"]').nth(1).locator("[aria-hidden]").first()).toHaveCSS("grid-template-rows", "0px")
        await row(page, ids[kind]).locator("td").first().dragTo(categoryHeader(page, "Suministros"))

        const expectedTotal = kind === "annual" ? /170\s*€/ : /100\s*€/
        await expect(categoryHeader(page, "Suministros")).toContainText(expectedTotal)
        await expect(page.getByRole("button", { name: "Expandir Suministros", exact: true })).toBeVisible()
        await expect(categoryHeader(page, before.category)).toHaveCount(0)
        const after = await prisma.commitment.findUniqueOrThrow({ where: { id: ids[kind] }, include: { parts: { orderBy: { sortOrder: "asc" } } } })
        expect(after).toEqual({ ...before, category: "Suministros", updatedAt: after.updatedAt })

        await page.reload()
        await expect(rowCategory(page, ids[kind])).toHaveAttribute("data-category-drop-target", "Suministros")
        await expect(page.getByText(/^200\s*€$/).first()).toBeVisible()
      })
    }

    test("accepts a drop on a category's expense rows", async ({ page, dragBudget }) => {
      await page.goto("/dashboard")
      await expect(row(page, dragBudget.ids.monthly)).toHaveAttribute("draggable", "true")
      await row(page, dragBudget.ids.monthly).locator("td").first().dragTo(row(page, dragBudget.ids.annual).locator("td").first())
      await expect(rowCategory(page, dragBudget.ids.monthly)).toHaveAttribute("data-category-drop-target", "Casa")
    })

    test("ignores the original category, outside drops, cancellation and external drag data", async ({ page, dragBudget }, testInfo) => {
      await page.goto("/dashboard")
      const source = row(page, dragBudget.ids.monthly)
      await expect(source).toHaveAttribute("draggable", "true")
      let writes = 0
      page.on("request", (request) => {
        if (request.method() === "POST" && request.headers()["next-action"]) writes++
      })
      await source.locator("td").first().dragTo(categoryHeader(page, "Suministros"))
      await source.locator("td").first().dragTo(page.getByRole("heading", { name: "Resumen mensual", exact: true }))

      await source.scrollIntoViewIfNeeded()
      const bounds = await source.locator("td").first().boundingBox()
      if (!bounds) throw new Error("Expense is not visible")
      await page.mouse.move(bounds.x + 15, bounds.y + bounds.height / 2)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 40, bounds.y + bounds.height / 2, { steps: 5 })
      await expect(source).toHaveAttribute("data-dragging", "true")
      const destination = categoryHeader(page, "Casa")
      const targetBounds = await destination.boundingBox()
      if (!targetBounds) throw new Error("Category is not visible")
      await page.mouse.move(targetBounds.x + 50, targetBounds.y + targetBounds.height / 2, { steps: 10 })
      await page.mouse.move(targetBounds.x + 55, targetBounds.y + targetBounds.height / 2)
      await expect(destination).toHaveAttribute("data-drop-active", "true")
      await expect(destination).toHaveCSS("outline-width", "2px")
      await page.screenshot({ path: testInfo.outputPath("category-drag-highlight.png"), fullPage: true })
      await page.keyboard.press("Escape")
      await page.mouse.up()
      await expect(source).not.toHaveAttribute("data-dragging", "true")
      await expect(page.locator('[data-drop-active="true"]')).toHaveCount(0)

      const externalData = await page.evaluateHandle(() => {
        const data = new DataTransfer()
        data.setData("application/x-fathly-commitment", "external-expense")
        return data
      })
      await categoryHeader(page, "Casa").dispatchEvent("drop", { dataTransfer: externalData })
      await externalData.dispose()
      expect(writes).toBe(0)
      expect((await dragBudget.prisma.commitment.findUniqueOrThrow({ where: { id: dragBudget.ids.monthly } })).category).toBe("Suministros")
    })

    test("blocks another movement while saving and leaves the row in place when permissions were revoked", async ({ page, dragBudget }) => {
      await page.goto("/dashboard")
      const source = row(page, dragBudget.ids.monthly)
      await expect(source).toHaveAttribute("draggable", "true")
      await dragBudget.prisma.householdMember.update({
        where: { householdId_userId: { householdId: dragBudget.householdId, userId: dragBudget.userId } },
        data: { role: "VIEWER" },
      })
      let release!: () => void
      const gate = new Promise<void>((resolve) => { release = resolve })
      await page.route("**/dashboard", async (route) => {
        if (route.request().method() === "POST") await gate
        await route.continue()
      })
      try {
        await source.locator("td").first().dragTo(categoryHeader(page, "Casa"))
        await expect(page.getByText(dictionaries.es.actions.movingCommitment, { exact: true })).toBeVisible()
        await expect(page.locator('[data-commitment-id][draggable="true"]')).toHaveCount(0)
        release()
        await expect(page.getByText(dictionaries.es.sharing.forbidden, { exact: true })).toBeVisible()
        await expect(rowCategory(page, dragBudget.ids.monthly)).toHaveAttribute("data-category-drop-target", "Suministros")
        expect((await dragBudget.prisma.commitment.findUniqueOrThrow({ where: { id: dragBudget.ids.monthly } })).category).toBe("Suministros")
      } finally {
        release()
        await page.unrouteAll({ behavior: "wait" })
      }
    })

    test("prevents dragging from the actions menu and preserves editing and the context menu", async ({ page, dragBudget }) => {
      await page.goto("/dashboard")
      const source = row(page, dragBudget.ids.monthly)
      await expect(source).toHaveAttribute("draggable", "true")
      const menu = source.getByRole("button", { name: "Abrir acciones", exact: true })
      await menu.scrollIntoViewIfNeeded()
      const bounds = await menu.boundingBox()
      if (!bounds) throw new Error("Actions menu is not visible")
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      await page.mouse.down()
      await page.mouse.move(bounds.x - 100, bounds.y - 80, { steps: 5 })
      await expect(source).not.toHaveAttribute("data-dragging", "true")
      await page.mouse.up()
      await page.keyboard.press("Escape")
      await expect(page.getByRole("menuitem", { name: "Editar", exact: true })).toHaveCount(0)
      await menu.click()
      await page.getByRole("menuitem", { name: "Editar", exact: true }).click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await page.keyboard.press("Escape")
      await source.click({ button: "right" })
      await expect(page.getByRole("menuitem", { name: "Editar", exact: true })).toBeVisible()
    })
  })

  test("keeps viewer expenses read-only", async ({ page, dragBudget }) => {
    await dragBudget.prisma.householdMember.update({
      where: { householdId_userId: { householdId: dragBudget.householdId, userId: dragBudget.userId } },
      data: { role: "VIEWER" },
    })
    await page.goto("/dashboard")
    await expect(row(page, dragBudget.ids.monthly)).toHaveAttribute("draggable", "false")
    await expect(page.getByText(dictionaries.es.sharing.readOnly, { exact: true })).toBeVisible()
    await expect(page.getByText(dictionaries.es.actions.moveCommitmentHint, { exact: true })).toHaveCount(0)
    await expect(row(page, dragBudget.ids.monthly).getByRole("button", { name: "Abrir acciones", exact: true })).toHaveCount(0)
  })

  test("keeps category editing available on touch devices without draggable rows or horizontal overflow", async ({ page, dragBudget, isMobile }, testInfo) => {
    test.skip(!isMobile, "Touch fallback")
    await page.goto("/dashboard")
    const source = row(page, dragBudget.ids.monthly)
    await expect(source).toHaveAttribute("draggable", "false")
    await expect(page.getByText(dictionaries.es.actions.moveCommitmentHint, { exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("category-edit-mobile.png"), fullPage: true })
    await source.getByRole("button", { name: "Abrir acciones", exact: true }).click()
    await page.getByRole("menuitem", { name: "Editar", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveValue("Internet")
    await dialog.getByRole("combobox").filter({ hasText: "Suministros" }).click()
    await page.getByRole("option", { name: "Casa", exact: true }).click()
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click()
    await expect(dialog).toBeHidden()
    expect((await dragBudget.prisma.commitment.findUniqueOrThrow({ where: { id: dragBudget.ids.monthly } })).category).toBe("Casa")
  })
})
