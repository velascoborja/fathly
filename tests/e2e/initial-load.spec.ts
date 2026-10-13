import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { normalizeDatabaseUrl } from "../../src/lib/database-url"
import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { expect, test as base } from "@playwright/test"

loadEnvConfig(process.cwd())

const test = base.extend<{ household: { id: string; userId: string; prisma: PrismaClient } }>({
  household: async ({ context, baseURL }, runFixture) => {
    if (!process.env.DATABASE_URL || !baseURL) throw new Error("Database fixtures require DATABASE_URL and a browser base URL")
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) }) })
    const householdId = `e2e-load-${randomUUID()}`
    const userId = `e2e-load-${randomUUID()}`
    const sessionToken = randomUUID()

    try {
      await prisma.user.create({ data: { id: userId, name: "Prueba de carga" } })
      await prisma.household.create({
        data: {
          id: householdId,
          name: "Pruebas de carga",
          members: { create: { userId, role: "OWNER" } },
          budgetPlans: {
            create: {
              name: "Plan de prueba",
              onboardingCompletedAt: new Date(),
              deposits: { create: { householdId, name: "Ingreso prueba", amountCents: 123_000 } },
              commitments: { create: { householdId, name: "Gasto prueba", category: "Casa", amountCents: 25_000 } },
            },
          },
        },
      })
      await prisma.session.create({
        data: { userId, sessionToken, expires: new Date(Date.now() + 3_600_000) },
      })
      await context.addCookies([
        { name: "authjs.session-token", value: sessionToken, url: baseURL, httpOnly: true, sameSite: "Lax" },
        { name: "fathly-locale", value: "es", url: baseURL },
      ])
      await runFixture({ id: householdId, userId, prisma })
    } finally {
      await prisma.household.deleteMany({ where: { members: { some: { userId } } } })
      await prisma.user.deleteMany({ where: { id: userId } })
      await prisma.$disconnect()
    }
  },
})

test.describe("deferred budget editors", () => {
  test.skip(process.env.FATHLY_E2E_DATABASE !== "1", "Enable isolated database fixtures with FATHLY_E2E_DATABASE=1")

  test("initializes a new user's household once across the layout and page", async ({ page, household }) => {
    await household.prisma.household.delete({ where: { id: household.id } })
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/setup/)
    await expect(page.getByRole("heading", { name: "Asistente inicial de presupuesto" })).toBeVisible()

    const memberships = await household.prisma.householdMember.findMany({ where: { userId: household.userId } })
    expect(memberships).toHaveLength(1)
    expect(await household.prisma.budgetPlan.count({ where: { householdId: memberships[0].householdId } })).toBe(1)
  })

  test("opens immediately while the editor loads, saves income and resets on reopening", async ({ page, household }) => {
    const { id: householdId, prisma } = household
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Resumen mensual" })).toBeVisible()
    await page.waitForLoadState("networkidle")

    let releaseChunks!: () => void
    const gate = new Promise<void>((resolve) => { releaseChunks = resolve })
    await page.route("**/_next/static/chunks/*.js", async (route) => {
      await gate
      await route.continue()
    })

    try {
      await page.getByRole("button", { name: "Añadir ingreso", exact: true }).click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole("status")).toHaveText("Cargando formulario…")
      await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveCount(0)
      releaseChunks()

      const name = dialog.getByLabel("Nombre", { exact: true })
      await expect(name).toBeFocused()
      await page.unrouteAll({ behavior: "wait" })
      await name.fill("Ingreso nuevo")
      await dialog.getByLabel("Importe", { exact: true }).fill("200")
      await dialog.getByRole("button", { name: "Guardar", exact: true }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByText("Ingreso nuevo", { exact: true })).toBeVisible()

      const saved = await prisma.deposit.findFirst({ where: { householdId, name: "Ingreso nuevo" } })
      expect(saved?.amountCents).toBe(20_000)

      await page.getByRole("button", { name: "Añadir ingreso", exact: true }).click()
      await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveValue("")
      await page.keyboard.press("Escape")
      await expect(dialog).toBeHidden()
    } finally {
      releaseChunks()
    }
  })

  test("loads existing expense values and persists edits", async ({ page, household }) => {
    const { id: householdId, prisma } = household
    await page.goto("/dashboard")
    const row = page.getByRole("row").filter({ has: page.getByText("Gasto prueba", { exact: true }) })
    await row.getByRole("button", { name: "Abrir acciones" }).click()
    await page.getByRole("menuitem", { name: "Editar", exact: true }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveValue("Gasto prueba")
    await expect(dialog.getByLabel("Importe", { exact: true })).toHaveValue("250")
    await dialog.getByLabel("Importe", { exact: true }).fill("275")
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click()
    await expect(dialog).toBeHidden()

    await expect.poll(async () => (await prisma.commitment.findFirst({ where: { householdId, name: "Gasto prueba" } }))?.amountCents).toBe(27_500)
  })

  test("loads the checkpoint editor and creates a snapshot", async ({ page, household }) => {
    const { id: householdId, prisma } = household
    await page.goto("/dashboard")
    await page.getByRole("button", { name: "Crear checkpoint", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByLabel("Nombre", { exact: true })).toBeFocused()
    await dialog.getByLabel("Nombre", { exact: true }).fill("Snapshot de prueba")
    await dialog.getByRole("button", { name: "Crear checkpoint", exact: true }).click()
    await expect(dialog).toBeHidden()

    await expect.poll(async () => prisma.budgetPlan.count({ where: { householdId, name: "Snapshot de prueba", status: "ARCHIVED" } })).toBe(1)
    await expect(page.getByRole("heading", { name: "Resumen mensual" })).toBeVisible()
    await expect(page.getByText("Ingreso prueba", { exact: true })).toBeVisible()
  })

  test("edits compact itemized expenses, updates totals and saves the parts", async ({ page, household }, testInfo) => {
    const { id: householdId, prisma } = household
    const expense = await prisma.commitment.findFirstOrThrow({ where: { householdId } })
    await prisma.commitment.update({
      where: { id: expense.id },
      data: {
        amountMode: "ITEMIZED",
        amountCents: null,
        frequency: "ANNUAL",
        parts: { create: [
          { name: "Seguro Hogar", amountCents: 59_500, sortOrder: 0 },
          { name: "IBI", amountCents: 95_000, sortOrder: 1 },
          { name: "VADO", amountCents: 5_000, sortOrder: 2 },
          { name: "Mantenimiento", amountCents: 10_000, sortOrder: 3 },
        ] },
      },
    })
    await page.goto("/dashboard")
    const row = page.getByRole("row").filter({ has: page.getByText("Gasto prueba", { exact: true }) })
    await row.getByRole("button", { name: "Abrir acciones" }).click()
    await page.getByRole("menuitem", { name: "Editar", exact: true }).click()
    const dialog = page.getByRole("dialog")
    const parts = dialog.getByRole("group", { name: "Partidas", exact: true })
    await expect(parts.getByLabel("Nombre de la partida 1", { exact: true })).toHaveValue("Seguro Hogar")
    await expect(parts.getByText("1695€", { exact: true })).toBeVisible()
    await expect(parts.getByText("141,25€", { exact: true })).toBeVisible()

    const name = parts.getByLabel("Nombre de la partida 1", { exact: true })
    const amount = parts.getByLabel("Importe 1", { exact: true })
    const remove = parts.getByRole("button", { name: "Eliminar partida 1", exact: true })
    const nameBox = await name.boundingBox()
    const amountBox = await amount.boundingBox()
    const removeBox = await remove.boundingBox()
    expect(nameBox).not.toBeNull()
    expect(amountBox).not.toBeNull()
    expect(removeBox).not.toBeNull()
    expect(removeBox!.width).toBeGreaterThanOrEqual(44)
    expect(removeBox!.height).toBeGreaterThanOrEqual(44)
    if ((page.viewportSize()?.width ?? 0) < 640) {
      expect(amountBox!.y).toBeGreaterThanOrEqual(nameBox!.y + nameBox!.height)
      expect(removeBox!.x).toBeGreaterThanOrEqual(nameBox!.x + nameBox!.width)
    } else {
      expect(amountBox!.y).toBe(nameBox!.y)
      expect(amountBox!.x).toBeGreaterThanOrEqual(nameBox!.x + nameBox!.width)
    }
    await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await parts.evaluate((element) => {
      const dialog = element.closest('[role="dialog"]')!
      dialog.scrollTop += element.getBoundingClientRect().top - dialog.getBoundingClientRect().top - 20
    })
    await testInfo.attach("itemized-editor", { body: await dialog.screenshot({ path: testInfo.outputPath("itemized-editor.png") }), contentType: "image/png" })
    if (testInfo.project.name === "mobile") {
      const originalViewport = page.viewportSize()!
      await page.setViewportSize({ width: 320, height: 700 })
      await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      const amountBounds = await amount.boundingBox()
      const partsBounds = await parts.boundingBox()
      expect(amountBounds!.x + amountBounds!.width).toBeLessThanOrEqual(partsBounds!.x + partsBounds!.width)
      await expect.poll(() => parts.locator('label[for="commitment-part-0-amount"]').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      await testInfo.attach("itemized-editor-narrow", { body: await dialog.screenshot({ path: testInfo.outputPath("itemized-editor-narrow.png") }), contentType: "image/png" })
      await page.setViewportSize(originalViewport)
    }

    await amount.fill("600.25")
    await expect(parts.getByText("1700,25€", { exact: true })).toBeVisible()
    await expect(parts.getByText("141,69€", { exact: true })).toBeVisible()
    await parts.getByRole("button", { name: "Añadir partida" }).click()
    await expect(parts.getByLabel("Nombre de la partida 5", { exact: true })).toBeFocused()
    await parts.getByLabel("Nombre de la partida 5", { exact: true }).fill("Extra")
    await parts.getByLabel("Importe 5", { exact: true }).fill("12")
    await parts.getByRole("button", { name: "Eliminar partida 5", exact: true }).click()
    await expect(parts.getByText("4 / 20", { exact: true })).toBeVisible()
    await expect(parts.getByLabel("Nombre de la partida 4", { exact: true })).toBeFocused()
    await expect(parts.getByText("1700,25€", { exact: true })).toBeVisible()

    await dialog.getByRole("button", { name: "Eliminar", exact: true }).click()
    await expect(dialog.getByRole("button", { name: "Confirmar borrado", exact: true })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Guardar", exact: true })).toBeHidden()
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click()
    await expect(dialog.getByRole("button", { name: "Guardar", exact: true })).toBeVisible()

    let releaseSave!: () => void
    const gate = new Promise<void>((resolve) => { releaseSave = resolve })
    await page.route("**/dashboard", async (route) => {
      if (route.request().headers()["next-action"]) await gate
      await route.continue()
    })
    try {
      await dialog.getByRole("button", { name: "Guardar", exact: true }).click()
      const saving = dialog.getByRole("button", { name: "Guardando...", exact: true })
      await expect(saving).toBeDisabled()
      await expect(saving).toHaveAttribute("aria-busy", "true")
      await expect(dialog.getByRole("button", { name: "Eliminar", exact: true })).toBeDisabled()
      releaseSave()
      await expect(dialog).toBeHidden()
    } finally {
      releaseSave()
      await page.unrouteAll({ behavior: "wait" })
    }
    const saved = await prisma.commitment.findUniqueOrThrow({ where: { id: expense.id }, include: { parts: { orderBy: { sortOrder: "asc" } } } })
    expect(saved.amountMode).toBe("ITEMIZED")
    expect(saved.amountCents).toBeNull()
    expect(saved.parts.map((part) => part.amountCents)).toEqual([60_025, 95_000, 5_000, 10_000])
  })

  test("keeps item validation and the twenty-part limit in the editor", async ({ page, household }) => {
    expect(household.id).toBeTruthy()
    await page.goto("/dashboard")
    await page.getByRole("button", { name: "Añadir gasto", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Nombre", { exact: true }).fill("Partidas de prueba")
    await dialog.getByRole("combobox").filter({ hasText: "Importe único" }).click()
    await page.getByRole("option", { name: "Suma de partidas" }).click()
    const parts = dialog.getByRole("group", { name: "Partidas", exact: true })
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click()
    await expect(parts.getByLabel("Nombre de la partida 2", { exact: true })).toHaveAttribute("aria-invalid", "true")
    await expect(parts.getByLabel("Importe 1", { exact: true })).toHaveAttribute("aria-invalid", "true")
    await expect(parts.getByRole("alert").first()).toBeVisible()
    await parts.getByRole("button", { name: "Eliminar partida 2", exact: true }).click()
    await expect(parts.getByText("Añade al menos 2 partidas completas.", { exact: true })).toBeVisible()
    for (let count = 1; count < 20; count += 1) {
      await parts.getByRole("button", { name: "Añadir partida" }).click()
    }
    await expect(parts.getByRole("button", { name: "Añadir partida" })).toBeDisabled()
    await expect(parts.getByText("20 / 20", { exact: true })).toBeVisible()
    await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  })

  test("shows an actionable error if the editor cannot be downloaded", async ({ page, household }) => {
    expect(household.id).toBeTruthy()
    await page.goto("/dashboard")
    await page.waitForLoadState("networkidle")
    await page.route("**/_next/static/chunks/*.js", (route) => route.abort())
    await page.getByRole("button", { name: "Añadir ingreso", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("alert")).toContainText("Comprueba tu conexión")
    await page.unroute("**/_next/static/chunks/*.js")
    await Promise.all([
      page.waitForNavigation(),
      dialog.getByRole("button", { name: "Recargar página" }).click(),
    ])
    await page.getByRole("button", { name: "Añadir ingreso", exact: true }).click()
    await expect(dialog.getByLabel("Nombre", { exact: true })).toBeVisible()
  })
})

base("defers the demo chart until it approaches the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 400 })
  await page.goto("/demo")
  await expect(page.getByRole("heading", { name: /resumen mensual|monthly summary/i })).toBeVisible()
  await page.waitForLoadState("networkidle")
  await expect(page.locator(".recharts-surface")).toHaveCount(0)
  await page.getByRole("status", { name: /cargando gráfico|loading chart/i }).scrollIntoViewIfNeeded()
  await expect(page.locator(".recharts-surface")).toBeVisible()
})
