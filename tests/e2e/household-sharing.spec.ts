import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { expect, test as base, type Page } from "@playwright/test"

import { normalizeDatabaseUrl } from "../../src/lib/database-url"

loadEnvConfig(process.cwd())

type SharingFixture = {
  prisma: PrismaClient
  householdId: string
  ownerId: string
  recipientId: string
  ownerEmail: string
  recipientEmail: string
  recipient: Page
}

const test = base.extend<{ sharing: SharingFixture }>({
  sharing: async ({ context, browser, baseURL }, runFixture, testInfo) => {
    if (!process.env.DATABASE_URL || !baseURL)
      throw new Error("Sharing fixtures require DATABASE_URL and a browser base URL")
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) }),
    })
    const prefix = `e2e-sharing-${randomUUID()}`
    const ownerId = `${prefix}-owner`
    const recipientId = `${prefix}-recipient`
    const householdId = `${prefix}-family`
    const ownerEmail = `${ownerId}@example.com`
    const recipientEmail = `${recipientId}@example.com`
    const recipientContext = await browser.newContext({
      baseURL,
      viewport: testInfo.project.use.viewport,
      isMobile: testInfo.project.use.isMobile,
      hasTouch: testInfo.project.use.hasTouch,
    })
    try {
      await prisma.user.createMany({
        data: [
          { id: ownerId, email: ownerEmail, name: "Owner", emailVerified: new Date() },
          { id: recipientId, email: recipientEmail, name: "Recipient", emailVerified: new Date() },
        ],
      })
      await prisma.household.create({
        data: {
          id: householdId,
          name: "Family budget",
          members: { create: { userId: ownerId, role: "OWNER" } },
          budgetPlans: {
            create: {
              name: "Family plan",
              onboardingCompletedAt: new Date(),
              deposits: { create: { householdId, name: "Shared income", amountCents: 180_000 } },
            },
          },
        },
      })
      for (const [userId, browserContext] of [
        [ownerId, context],
        [recipientId, recipientContext],
      ] as const) {
        const token = randomUUID()
        await prisma.session.create({
          data: { userId, sessionToken: token, expires: new Date(Date.now() + 3_600_000) },
        })
        await browserContext.addCookies([
          { name: "authjs.session-token", value: token, url: baseURL, httpOnly: true, sameSite: "Lax" },
          { name: "fathly-locale", value: "en", url: baseURL },
        ])
      }
      await runFixture({
        prisma,
        householdId,
        ownerId,
        recipientId,
        ownerEmail,
        recipientEmail,
        recipient: await recipientContext.newPage(),
      })
    } finally {
      await recipientContext.close()
      await prisma.household.deleteMany({ where: { id: { startsWith: prefix } } })
      // Also remove any automatically initialized household, so a failing test leaves no fixtures.
      await prisma.household.deleteMany({ where: { members: { some: { userId: { in: [ownerId, recipientId] } } } } })
      await prisma.user.deleteMany({ where: { id: { in: [ownerId, recipientId] } } })
      await prisma.$disconnect()
    }
  },
})

async function invite(page: Page, email: string, role: "EDITOR" | "VIEWER" = "VIEWER") {
  await page.goto("/settings")
  await page.getByLabel("Email address", { exact: true }).fill(email)
  await page.getByLabel("Permission", { exact: true }).selectOption(role)
  await page.getByRole("button", { name: "Create invitation link", exact: true }).click()
  const link = page.getByLabel("Invitation link", { exact: true })
  await expect(link).toHaveValue(/\/invite\/[A-Za-z0-9_-]{43}$/)
  await expect(page.getByRole("button", { name: "Create invitation link", exact: true })).toBeEnabled()
  return link.inputValue()
}

async function addPersonal(sharing: SharingFixture) {
  const id = `${sharing.householdId}-personal`
  await sharing.prisma.household.create({
    data: {
      id,
      name: "Personal budget",
      members: { create: { userId: sharing.recipientId, role: "OWNER" } },
      budgetPlans: {
        create: {
          name: "Personal plan",
          onboardingCompletedAt: new Date(),
          deposits: { create: { householdId: id, name: "Private income", amountCents: 70_000 } },
        },
      },
    },
  })
  return id
}

async function accept(recipient: Page, link: string) {
  await recipient.goto(link)
  await recipient.getByRole("button", { name: "Accept invitation", exact: true }).click()
  await expect(recipient).toHaveURL(/\/dashboard$/)
}

test.describe("household sharing", () => {
  test.skip(process.env.FATHLY_E2E_DATABASE !== "1", "Enable isolated database fixtures with FATHLY_E2E_DATABASE=1")

  test("creates an additional account from a single household and opens its empty dashboard", async ({ page, sharing }, testInfo) => {
    await page.goto("/dashboard")
    const selector = page.getByLabel("Switch household", { exact: true })
    await selector.selectOption({ label: "Create account" })
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByLabel("Household name", { exact: true })).toBeFocused()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await testInfo.attach("create-account-dialog", { body: await page.screenshot(), contentType: "image/png" })
    await dialog.getByLabel("Household name", { exact: true }).fill("  Holiday budget  ")
    await dialog.getByRole("button", { name: "Create account", exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole("heading", { name: "Monthly summary", exact: true })).toBeVisible()
    await expect(page.getByText("Shared income", { exact: true })).toHaveCount(0)
    const membership = await sharing.prisma.householdMember.findFirstOrThrow({
      where: { userId: sharing.ownerId, household: { name: "Holiday budget" } },
      include: { household: { include: { budgetPlans: true, deposits: true, commitments: true } } },
    })
    expect(membership.role).toBe("OWNER")
    expect(membership.household.budgetPlans).toHaveLength(1)
    expect(membership.household.budgetPlans[0].status).toBe("ACTIVE")
    expect(membership.household.budgetPlans[0].onboardingCompletedAt).not.toBeNull()
    expect(membership.household.deposits).toHaveLength(0)
    expect(membership.household.commitments).toHaveLength(0)
    await expect(selector).toHaveValue(membership.householdId)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await testInfo.attach("new-account-dashboard", { body: await page.screenshot(), contentType: "image/png" })
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(selector).toHaveValue(membership.householdId)
    await page.goto("/setup")
    await expect(page).toHaveURL(/\/dashboard$/)
    await selector.selectOption(sharing.householdId)
    await expect(page.getByText("Shared income", { exact: true })).toBeVisible()
    expect(await sharing.prisma.householdMember.count({ where: { userId: sharing.ownerId } })).toBe(2)
  })

  test("lets a viewer create their own account without changing their shared permissions", async ({ sharing }) => {
    await sharing.prisma.householdMember.create({
      data: { userId: sharing.recipientId, householdId: sharing.householdId, role: "VIEWER" },
    })
    const page = sharing.recipient
    await page.goto("/dashboard")
    await expect(page.getByText("You have read-only access to this household.", { exact: true })).toBeVisible()
    await page.getByLabel("Switch household", { exact: true }).selectOption({ label: "Create account" })
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Household name", { exact: true }).fill("My own budget")
    await dialog.getByRole("button", { name: "Create account", exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByText("You have read-only access to this household.", { exact: true })).toHaveCount(0)
    const memberships = await sharing.prisma.householdMember.findMany({ where: { userId: sharing.recipientId } })
    expect(memberships).toHaveLength(2)
    expect(memberships.find((member) => member.householdId === sharing.householdId)?.role).toBe("VIEWER")
    const ownMembership = memberships.find((member) => member.householdId !== sharing.householdId)!
    expect(ownMembership.role).toBe("OWNER")
    await expect(page.getByLabel("Switch household", { exact: true })).toHaveValue(ownMembership.householdId)
  })

  test("cancels creation and preserves input on failure with immediate pending feedback", async ({ page, sharing }) => {
    await page.goto("/dashboard")
    const selector = page.getByLabel("Switch household", { exact: true })
    await selector.selectOption({ label: "Create account" })
    const dialog = page.getByRole("dialog")
    const name = dialog.getByLabel("Household name", { exact: true })
    await name.fill("Cancelled budget")
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(selector).toHaveValue(sharing.householdId)
    await expect(selector).toBeFocused()
    await selector.selectOption({ label: "Create account" })
    await expect(name).toHaveValue("")
    await name.fill("   ")
    await dialog.getByRole("button", { name: "Create account", exact: true }).click()
    await expect(dialog.getByRole("alert")).toHaveText("Invalid household name.")
    await name.fill("Retry budget")
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    await page.route("**/*", async (route) => {
      if (route.request().method() === "POST" && route.request().headers()["next-action"]) {
        await gate
        await route.abort("failed")
      } else {
        await route.continue()
      }
    })
    try {
      await dialog.getByRole("button", { name: "Create account", exact: true }).click()
      await expect(dialog.locator("form")).toHaveAttribute("aria-busy", "true")
      await expect(dialog.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled()
      await expect(name).toBeDisabled()
      await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled()
      await page.keyboard.press("Escape")
      await expect(dialog).toBeVisible()
    } finally {
      release()
    }
    await expect(dialog.getByRole("alert")).toHaveText("Could not create the account. Please try again.")
    await expect(name).toHaveValue("Retry budget")
    await expect(name).toBeEnabled()
    await expect(selector).toHaveValue(sharing.householdId)
    expect(await sharing.prisma.householdMember.count({ where: { userId: sharing.ownerId } })).toBe(1)
  })

  test("creates only one unshared household across concurrent first visits and later sessions", async ({
    page,
    sharing,
    baseURL,
  }) => {
    const secondTab = await sharing.recipient.context().newPage()
    try {
      await Promise.all([sharing.recipient.goto("/dashboard"), secondTab.goto("/dashboard")])
      await expect(sharing.recipient).toHaveURL(/\/setup$/)
      await expect(secondTab).toHaveURL(/\/setup$/)
      const memberships = await sharing.prisma.householdMember.findMany({ where: { userId: sharing.recipientId } })
      expect(memberships).toHaveLength(1)
      await sharing.recipient
        .context()
        .addCookies([{ name: "fathly-household", value: "missing-household", url: baseURL! }])
      const sessionToken = randomUUID()
      await sharing.prisma.session.create({
        data: { userId: sharing.recipientId, sessionToken, expires: new Date(Date.now() + 3_600_000) },
      })
      await sharing.recipient
        .context()
        .addCookies([
          { name: "authjs.session-token", value: sessionToken, url: baseURL!, httpOnly: true, sameSite: "Lax" },
        ])
      await sharing.recipient.goto("/settings")
      await sharing.recipient.reload()
      await expect(sharing.recipient.getByLabel("Switch household", { exact: true })).toHaveValue(memberships[0].householdId)
      expect(await sharing.prisma.householdMember.findMany({ where: { userId: sharing.recipientId } })).toEqual(
        memberships
      )
      await page.goto("/dashboard")
      await page.reload()
      await expect(page.getByLabel("Switch household", { exact: true })).toHaveValue(sharing.householdId)
      expect(await sharing.prisma.householdMember.count({ where: { userId: sharing.ownerId } })).toBe(1)
    } finally {
      await secondTab.close()
    }
  })

  test("requires explicit acceptance and joins a new user as a viewer without creating another household", async ({
    page,
    browser,
    sharing,
  }, testInfo) => {
    const link = await invite(page, sharing.recipientEmail)
    await expect(page.getByLabel("Invitation link", { exact: true })).toBeVisible()
    await expect
      .poll(() =>
        page
          .getByRole("button", { name: "Copy link", exact: true })
          .evaluate((element) => element.getBoundingClientRect().height)
      )
      .toBeGreaterThanOrEqual(44)
    await page.screenshot({ path: testInfo.outputPath("owner-sharing.png"), fullPage: true })
    const anonymous = await browser.newContext()
    try {
      const anonymousPage = await anonymous.newPage()
      await anonymousPage.goto(link)
      await expect(anonymousPage.getByRole("button", { name: /google/i })).toBeVisible()
      await expect(anonymousPage.getByText("Family budget", { exact: true })).toHaveCount(0)
    } finally {
      await anonymous.close()
    }
    await sharing.recipient.goto(link)
    await expect(sharing.recipient.getByRole("heading", { name: "Family budget", exact: true })).toBeVisible()
    expect(await sharing.prisma.householdMember.count({ where: { userId: sharing.recipientId } })).toBe(0)
    await sharing.recipient.getByRole("button", { name: "Accept invitation", exact: true }).click()
    await expect(sharing.recipient).toHaveURL(/\/dashboard$/)
    await expect(sharing.recipient.getByText("Shared income", { exact: true })).toBeVisible()
    await expect(
      sharing.recipient.getByText("You have read-only access to this household.", { exact: true })
    ).toBeVisible()
    await expect(sharing.recipient.getByRole("button", { name: "Add deposit", exact: true })).toHaveCount(0)
    await expect(sharing.recipient.getByRole("button", { name: "Create checkpoint", exact: true })).toHaveCount(0)
    await expect(
      sharing.recipient.getByRole("main").getByRole("button", { name: "Open actions", exact: true })
    ).toHaveCount(0)
    expect(await sharing.prisma.householdMember.count({ where: { userId: sharing.recipientId } })).toBe(1)
    await sharing.recipient.goto("/settings")
    await expect(sharing.recipient.getByRole("heading", { name: "Settings", exact: true })).toBeVisible()
    await expect(sharing.recipient.getByLabel("Household name", { exact: true })).toBeVisible()
    await expect(sharing.recipient.getByLabel("Household name", { exact: true })).toBeDisabled()
    await expect(sharing.recipient.getByRole("button", { name: "Create invitation link", exact: true })).toHaveCount(0)
    await expect
      .poll(() => sharing.recipient.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)
    await testInfo.attach("viewer-settings", {
      body: await sharing.recipient.screenshot({ path: testInfo.outputPath("sharing.png") }),
      contentType: "image/png",
    })
    const checkpoint = await sharing.prisma.budgetPlan.create({
      data: { householdId: sharing.householdId, name: "Shared snapshot", status: "ARCHIVED" },
    })
    await sharing.recipient.goto("/checkpoints")
    await expect(sharing.recipient.getByText("Shared snapshot", { exact: true })).toBeVisible()
    await expect(sharing.recipient.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0)
    await sharing.recipient.goto(`/checkpoints/${checkpoint.id}`)
    await expect(sharing.recipient.getByRole("heading", { name: "Shared snapshot", exact: true })).toBeVisible()
    await expect(sharing.recipient.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0)
    await sharing.recipient.goto(link)
    await expect(sharing.recipient.getByRole("button", { name: "Go to my budget", exact: true })).toBeVisible()
  })

  test("keeps personal data separate and switches households after joining as an editor", async ({
    page,
    sharing,
  }, testInfo) => {
    const personalId = await addPersonal(sharing)
    const link = await invite(page, sharing.recipientEmail, "EDITOR")
    await sharing.recipient.context().addCookies([{ name: "fathly-household", value: sharing.householdId, url: link }])
    await sharing.recipient.goto("/dashboard")
    await expect(sharing.recipient.getByText("Private income", { exact: true })).toBeVisible()
    await expect(sharing.recipient.getByText("Shared income", { exact: true })).toHaveCount(0)
    await accept(sharing.recipient, link)
    await expect(sharing.recipient.getByText("Private income", { exact: true })).toHaveCount(0)
    await sharing.recipient.getByRole("button", { name: "Add deposit", exact: true }).click()
    const dialog = sharing.recipient.getByRole("dialog")
    await dialog.getByLabel("Name", { exact: true }).fill("Partner income")
    await dialog.getByLabel("Amount", { exact: true }).fill("500")
    await dialog.getByRole("button", { name: "Save", exact: true }).click()
    await expect(dialog).toBeHidden()
    expect(
      await sharing.prisma.deposit.count({ where: { householdId: sharing.householdId, name: "Partner income" } })
    ).toBe(1)
    await sharing.recipient.getByLabel("Switch household", { exact: true }).selectOption(personalId)
    await expect(sharing.recipient.getByText("Private income", { exact: true })).toBeVisible()
    await expect(sharing.recipient.getByText("Shared income", { exact: true })).toHaveCount(0)
    await sharing.recipient.reload()
    await expect(sharing.recipient.getByLabel("Switch household", { exact: true })).toHaveValue(personalId)
    await sharing.recipient.getByLabel("Switch household", { exact: true }).selectOption(sharing.householdId)
    await expect(sharing.recipient.getByText("Partner income", { exact: true })).toBeVisible()
    await expect
      .poll(() => sharing.recipient.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)
    await testInfo.attach("household-selector", {
      body: await sharing.recipient.screenshot({ path: testInfo.outputPath("sharing.png") }),
      contentType: "image/png",
    })
  })

  test("keeps a stale tab's write bound to its original household after switching in another tab", async ({
    page,
    sharing,
  }) => {
    const personalId = await addPersonal(sharing)
    await accept(sharing.recipient, await invite(page, sharing.recipientEmail, "EDITOR"))
    await sharing.recipient.getByRole("button", { name: "Add deposit", exact: true }).click()
    const dialog = sharing.recipient.getByRole("dialog")
    await dialog.getByLabel("Name", { exact: true }).fill("Stale tab income")
    await dialog.getByLabel("Amount", { exact: true }).fill("100")
    const secondTab = await sharing.recipient.context().newPage()
    try {
      await secondTab.goto("/dashboard")
      await secondTab.getByLabel("Switch household", { exact: true }).selectOption(personalId)
      await expect(secondTab.getByText("Private income", { exact: true })).toBeVisible()
      await dialog.getByRole("button", { name: "Save", exact: true }).click()
      await expect(dialog).toBeHidden()
      expect(
        await sharing.prisma.deposit.count({ where: { householdId: sharing.householdId, name: "Stale tab income" } })
      ).toBe(1)
      expect(await sharing.prisma.deposit.count({ where: { householdId: personalId, name: "Stale tab income" } })).toBe(
        0
      )
    } finally {
      await secondTab.close()
    }
  })

  test("rejects a write when permissions change after the editor was opened", async ({ page, sharing }) => {
    await accept(sharing.recipient, await invite(page, sharing.recipientEmail, "EDITOR"))
    await sharing.recipient.getByRole("button", { name: "Add deposit", exact: true }).click()
    const dialog = sharing.recipient.getByRole("dialog")
    await dialog.getByLabel("Name", { exact: true }).fill("Forbidden income")
    await dialog.getByLabel("Amount", { exact: true }).fill("100")
    await sharing.prisma.householdMember.update({
      where: { householdId_userId: { householdId: sharing.householdId, userId: sharing.recipientId } },
      data: { role: "VIEWER" },
    })
    await dialog.getByRole("button", { name: "Save", exact: true }).click()
    await expect(
      sharing.recipient.getByText("You do not have permission to edit this household.", { exact: true })
    ).toBeVisible()
    expect(
      await sharing.prisma.deposit.count({ where: { name: "Forbidden income", householdId: sharing.householdId } })
    ).toBe(0)
  })

  test("rejects wrong accounts, replaced links, cancelled links and expired links", async ({ page, sharing }) => {
    const link = await invite(page, sharing.recipientEmail)
    await page.goto(link)
    await expect(
      page.getByText("This invitation is for another email address. Switch Google accounts to continue.", {
        exact: true,
      })
    ).toBeVisible()
    await page.goto("/settings")
    await page.getByRole("button", { name: "Regenerate link", exact: true }).click()
    const replacementField = page.getByLabel("Invitation link", { exact: true })
    await expect(replacementField).toHaveValue(/\/invite\/[A-Za-z0-9_-]{43}$/)
    const replacement = await replacementField.inputValue()
    expect(replacement).not.toBe(link)
    await sharing.recipient.goto(link)
    await expect(
      sharing.recipient.getByText("This invitation is invalid or its link has been replaced.", { exact: true })
    ).toBeVisible()
    await page.getByRole("button", { name: "Cancel invitation", exact: true }).click()
    await expect(page.getByRole("button", { name: "Cancel invitation", exact: true })).toHaveCount(0)
    await sharing.recipient.goto(replacement)
    await expect(sharing.recipient.getByText("This invitation has been cancelled.", { exact: true })).toBeVisible()
    const expiredLink = await invite(page, sharing.recipientEmail)
    await sharing.prisma.householdInvitation.update({
      where: { householdId_email: { householdId: sharing.householdId, email: sharing.recipientEmail } },
      data: { expiresAt: new Date(0) },
    })
    await sharing.recipient.goto(expiredLink)
    await expect(
      sharing.recipient.getByText("This invitation has expired. Ask the owner for a new link.", { exact: true })
    ).toBeVisible()
    expect(await sharing.prisma.householdMember.count({ where: { userId: sharing.recipientId } })).toBe(0)
  })

  test("accepts the same link concurrently without duplicate memberships", async ({ page, sharing }) => {
    const link = await invite(page, sharing.recipientEmail)
    const secondTab = await sharing.recipient.context().newPage()
    try {
      await Promise.all([sharing.recipient.goto(link), secondTab.goto(link)])
      await Promise.all([
        sharing.recipient.getByRole("button", { name: "Accept invitation", exact: true }).click(),
        secondTab.getByRole("button", { name: "Accept invitation", exact: true }).click(),
      ])
      await expect(sharing.recipient).toHaveURL(/\/dashboard$/)
      await expect(secondTab).toHaveURL(/\/dashboard$/)
      expect(
        await sharing.prisma.householdMember.count({
          where: { householdId: sharing.householdId, userId: sharing.recipientId },
        })
      ).toBe(1)
    } finally {
      await secondTab.close()
    }
  })

  test("preserves the invitation through sign-in when the recipient session expires", async ({ page, sharing }) => {
    const link = await invite(page, sharing.recipientEmail)
    await sharing.recipient.goto(link)
    await expect(sharing.recipient.getByRole("button", { name: "Accept invitation", exact: true })).toBeVisible()
    await sharing.prisma.session.deleteMany({ where: { userId: sharing.recipientId } })
    await sharing.recipient.getByRole("button", { name: "Accept invitation", exact: true }).click()
    await expect(sharing.recipient).toHaveURL(/\/auth\/signin\?callbackUrl=/)
    const path = new URL(link).pathname
    expect(new URL(sharing.recipient.url()).searchParams.get("callbackUrl")).toBe(path)
    await expect(sharing.recipient.locator('input[name="returnTo"]')).toHaveValue(path)
    await expect(sharing.recipient.getByRole("button", { name: /google/i })).toBeVisible()
    expect(await sharing.prisma.householdMember.count({ where: { userId: sharing.recipientId } })).toBe(0)
  })

  test("shows an empty household to viewers without forcing setup", async ({ page, sharing }) => {
    await sharing.prisma.deposit.deleteMany({ where: { householdId: sharing.householdId } })
    await sharing.prisma.budgetPlan.updateMany({
      where: { householdId: sharing.householdId },
      data: { onboardingCompletedAt: null },
    })
    await accept(sharing.recipient, await invite(page, sharing.recipientEmail))
    await expect(
      sharing.recipient.getByText("You have read-only access to this household.", { exact: true })
    ).toBeVisible()
    await sharing.recipient.goto("/setup")
    await expect(sharing.recipient).toHaveURL(/\/dashboard$/)
  })

  test("requires a successor for every shared household before deleting an owner account", async ({
    page,
    sharing,
  }) => {
    const secondHouseholdId = `${sharing.householdId}-second`
    await sharing.prisma.householdMember.create({
      data: { householdId: sharing.householdId, userId: sharing.recipientId, role: "VIEWER" },
    })
    await sharing.prisma.household.create({
      data: {
        id: secondHouseholdId,
        name: "Second shared budget",
        members: {
          create: [
            { userId: sharing.ownerId, role: "OWNER" },
            { userId: sharing.recipientId, role: "EDITOR" },
          ],
        },
        budgetPlans: { create: { name: "Second plan", onboardingCompletedAt: new Date() } },
      },
    })
    await page.goto("/settings")
    await page.getByRole("button", { name: "Delete account", exact: true }).click()
    const dialog = page.getByRole("dialog")
    const confirm = dialog.getByRole("button", { name: "Yes, delete my account", exact: true })
    await expect(confirm).toBeDisabled()
    for (const householdId of [sharing.householdId, secondHouseholdId]) {
      const member = await sharing.prisma.householdMember.findUniqueOrThrow({
        where: { householdId_userId: { householdId, userId: sharing.recipientId } },
      })
      await dialog.locator(`select[id="successor-${householdId}"]`).selectOption(member.id)
    }
    await expect(confirm).toBeEnabled()
    const staleSuccessor = await sharing.prisma.householdMember.findUniqueOrThrow({
      where: { householdId_userId: { householdId: secondHouseholdId, userId: sharing.recipientId } },
    })
    const [, replacementSuccessor] = await sharing.prisma.$transaction([
      sharing.prisma.householdMember.delete({ where: { id: staleSuccessor.id } }),
      sharing.prisma.householdMember.create({
        data: { householdId: secondHouseholdId, userId: sharing.recipientId, role: "EDITOR" },
      }),
    ])
    await confirm.click()
    await expect(page.getByText("Select a valid new owner for each shared household.", { exact: true })).toBeVisible()
    expect(await sharing.prisma.user.count({ where: { id: sharing.ownerId } })).toBe(1)
    const unchangedMember = await sharing.prisma.householdMember.findUniqueOrThrow({
      where: { householdId_userId: { householdId: sharing.householdId, userId: sharing.recipientId } },
    })
    expect(unchangedMember.role).toBe("VIEWER")
    await dialog.locator(`select[id="successor-${secondHouseholdId}"]`).selectOption(replacementSuccessor.id)
    await expect(confirm).toBeEnabled()
    await confirm.click()
    await expect(page).toHaveURL(/\/auth\/signin$/)
    expect(await sharing.prisma.user.findUnique({ where: { id: sharing.ownerId } })).toBeNull()
    for (const householdId of [sharing.householdId, secondHouseholdId]) {
      const member = await sharing.prisma.householdMember.findUniqueOrThrow({
        where: { householdId_userId: { householdId, userId: sharing.recipientId } },
      })
      expect(member.role).toBe("OWNER")
    }
    expect(
      await sharing.prisma.deposit.count({ where: { householdId: sharing.householdId, name: "Shared income" } })
    ).toBe(1)
  })
})
