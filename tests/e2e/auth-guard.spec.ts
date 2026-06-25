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
})
