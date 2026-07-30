import { expect, test } from "@playwright/test"

test("dashboard redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/auth\/signin/)
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible()
})

test("mock demo renders without authentication", async ({ page }) => {
  await page.goto("/demo")
  await expect(page.getByRole("heading", { name: /resumen mensual|monthly summary/i })).toBeVisible()
  await expect(page.getByText(/^demo$/i)).toBeVisible()
  await expect(page.getByTitle(/gasto calculado como suma de partidas|expense calculated as the sum of items/i)).toBeVisible()

  if ((page.viewportSize()?.width ?? 0) < 640) {
    await expect(page.getByText(/^suma$|^sum$/i)).toBeHidden()

    const itemizedRow = page.getByText(/seguro hogar \+ ibi/i).locator("xpath=ancestor::tr[1]")
    const amountCell = itemizedRow.locator("td").last()

    await expect(amountCell).toBeVisible()
    await expect
      .poll(() =>
        amountCell.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth
        })
      )
      .toBe(true)
  } else {
    await expect(page.getByText(/^suma$|^sum$/i)).toBeVisible()
  }

  await expect(page.getByText(/seguro de hogar|home insurance/i)).toHaveCount(0)
  await expect(page.getByText(/^IBI$/i)).toHaveCount(0)
})
