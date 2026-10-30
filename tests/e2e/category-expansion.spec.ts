import { expect, test } from "@playwright/test"

for (const locale of ["es", "en"] as const) {
  test(`toggles all expense categories and mixed states in ${locale}`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "fathly-locale", value: locale, url: baseURL! }])
    await page.goto("/demo")
    const collapse = locale === "es" ? "Contraer todas" : "Collapse all"
    const expand = locale === "es" ? "Expandir todas" : "Expand all"
    const individual = locale === "es" ? "Contraer Casa" : "Collapse Casa"
    const button = page.getByRole("button", { name: collapse, exact: true })
    await expect(button).toBeVisible()
    const listId = await button.getAttribute("aria-controls")
    const list = page.locator(`[id="${listId}"]`)
    const groups = list.locator("button[aria-expanded]")
    expect(await groups.count()).toBeGreaterThan(1)

    await button.click()
    await expect(page.getByRole("button", { name: expand, exact: true })).toBeVisible()
    await expect(list.locator('button[aria-expanded="true"]')).toHaveCount(0)
    await expect(list.locator('div[aria-hidden="true"][inert]')).toHaveCount(await groups.count())

    const expandButton = page.getByRole("button", { name: expand, exact: true })
    await expandButton.focus()
    await page.keyboard.press("Enter")
    await expect(list.locator('button[aria-expanded="false"]')).toHaveCount(0)

    await page.getByRole("button", { name: individual, exact: true }).click()
    await expect(expandButton).toBeVisible()
    await expect(list.locator('button[aria-expanded="false"]')).toHaveCount(1)
    await expandButton.click()
    await expect(list.locator('button[aria-expanded="false"]')).toHaveCount(0)
    await expect(page.getByRole("button", { name: collapse, exact: true })).toBeVisible()

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
