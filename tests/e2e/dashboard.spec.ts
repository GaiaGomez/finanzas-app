import { test, expect } from "@playwright/test";

/**
 * E2E tests for the unauthenticated dashboard experience.
 *
 * All tests run against a real dev server with no logged-in user,
 * so they exercise the empty-state paths and navigation shell.
 */

test.describe("Dashboard — carga inicial y navegación", () => {
  test("carga la página con el título correcto", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveTitle("Fynt");
  });

  test("muestra los 5 tabs de navegación", async ({ page }) => {
    await page.goto("/dashboard");
    for (const label of ["Fijos", "Variables", "Deudas", "Ahorro", "Resumen"]) {
      await expect(
        page.getByRole("button", { name: label, exact: true }),
      ).toBeVisible();
    }
  });

  test("muestra el tab Fijos activo por defecto con el botón agregar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("button", { name: "+ Agregar gasto fijo" }),
    ).toBeVisible();
  });

  test("navegar al tab Ahorro muestra el estado vacío", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Ahorro", exact: true }).click();
    await expect(
      page.getByText("Aún no tienes metas de ahorro"),
    ).toBeVisible();
  });

  test("el menú contextual muestra opciones de auth para usuarios no logueados", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Menú" }).click();
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();
  });

  test("el header muestra el periodo actual y los controles de navegación", async ({ page }) => {
    await page.goto("/dashboard");
    // The period label is an <h1> rendered by DashboardHeader
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text).toMatch(/\d{4}/); // contains a 4-digit year
  });
});

test.describe("Dashboard — apertura de modales", () => {
  test("el botón '+ Ingreso' abre el modal de ingreso", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "+ Ingreso" }).click();
    await expect(page.getByText("Registrar ingreso")).toBeVisible();
    await expect(page.getByPlaceholder("Monto")).toBeVisible();
  });
});

test.describe("Dashboard — demo login", () => {
  test("muestra el botón 'Abrir demo' en el menú cuando las credenciales demo están configuradas", async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_DEMO_EMAIL, "Credenciales demo no configuradas");
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Menú" }).click();
    await expect(page.getByRole("button", { name: "Abrir demo" })).toBeVisible();
  });
});
