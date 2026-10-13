import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { expect, test } from "@playwright/test"

async function pauseAfterLoadingShell(baseURL: string) {
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  const server = createServer(async (request, response) => {
    try {
      const upstream = await fetch(new URL(request.url ?? "/", baseURL), {
        headers: { "accept-encoding": "identity" },
      })
      response.writeHead(upstream.status, {
        "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "cache-control": "no-store",
      })
      const reader = upstream.body!.getReader()
      let initialHTML = Buffer.alloc(0)
      let paused = false
      for (;;) {
        const chunk = await reader.read()
        if (chunk.done) break
        if (request.url === "/auth/signin" && !paused) {
          initialHTML = Buffer.concat([initialHTML, Buffer.from(chunk.value)])
          const shellEnd = initialHTML.indexOf("</main>")
          if (shellEnd !== -1 && initialHTML.includes('data-slot="skeleton"')) {
            // Split by HTML, since production can coalesce the shell and its replacement.
            response.write(initialHTML.subarray(0, shellEnd + "</main>".length))
            await gate
            response.write(initialHTML.subarray(shellEnd + "</main>".length))
            initialHTML = Buffer.alloc(0)
            paused = true
          }
        } else {
          response.write(chunk.value)
        }
      }
      if (initialHTML.length) response.write(initialHTML)
      response.end()
    } catch {
      response.destroy()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    gate,
    release,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
      server.closeAllConnections()
    }),
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`shows a light skeleton before JavaScript and the completed response (${colorScheme} appearance)`, async ({ page, baseURL }, testInfo) => {
    const proxy = await pauseAfterLoadingShell(baseURL!)
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" })
    await page.route("**/_next/**/*.js", async (route) => {
      await proxy.gate
      await route.continue()
    })

    try {
      await page.goto(`${proxy.url}/auth/signin`, { waitUntil: "commit" })
      const loading = page.getByRole("status", { name: "Cargando Fathly" })
      await expect(loading).toBeVisible()
      await expect(loading).toHaveAttribute("aria-busy", "true")
      await expect(page.getByRole("button", { name: /google/i })).toHaveCount(0)
      expect(await page.locator("html").evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        scheme: getComputedStyle(element).colorScheme,
      }))).toEqual({ background: "rgb(255, 255, 255)", scheme: "light" })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      // WebKit waits for document.fonts.ready until the paused HTML stream ends.
      if (testInfo.project.name !== "webkit") {
        await testInfo.attach("initial-skeleton", {
          body: await page.screenshot(),
          contentType: "image/png",
        })
      }

      if (testInfo.project.name !== "chromium") {
        await page.setViewportSize({ width: 320, height: 700 })
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      }

      proxy.release()
      await expect(page.getByRole("button", { name: /google/i })).toBeVisible()
      await expect(loading).toBeHidden()
      expect(errors).toEqual([])
    } finally {
      proxy.release()
      if (!page.isClosed()) {
        await page.unrouteAll({ behavior: "ignoreErrors" })
        await page.close()
      }
      await proxy.close()
    }
  })
}
