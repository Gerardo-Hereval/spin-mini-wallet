import { test, expect } from '@playwright/test'

test('redirects unauthenticated user from /home to /login', async ({ page }) => {
  await page.goto('/home')
  await expect(page).toHaveURL(/\/login/)
})

test('login → home shows balance and movements', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email o teléfono').fill('carlos@spin.mx')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/home/)
  await expect(page.getByText('Saldo disponible')).toBeVisible()
  await expect(page.getByTestId('movement-list')).toBeVisible()
})

test('happy path transfer shows a receipt', async ({ page }) => {
  // Force a success outcome deterministically.
  await page.route('**/api/transactions', async (route) => {
    const headers = { ...route.request().headers(), 'x-mock-outcome': 'success' }
    await route.continue({ headers })
  })
  await page.goto('/login')
  await page.getByLabel('Email o teléfono').fill('carlos@spin.mx')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.getByRole('link', { name: 'Nueva transacción' }).click()
  await page.getByLabel('Monto').fill('10')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByTestId('contact-list').getByRole('button').first().click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByTestId('receipt')).toBeVisible()
})

test('network error shows retry option', async ({ page }) => {
  await page.route('**/api/transactions', async (route) => {
    const headers = { ...route.request().headers(), 'x-mock-outcome': 'network_error' }
    await route.continue({ headers })
  })
  await page.goto('/login')
  await page.getByLabel('Email o teléfono').fill('carlos@spin.mx')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.getByRole('link', { name: 'Nueva transacción' }).click()
  await page.getByLabel('Monto').fill('10')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByTestId('contact-list').getByRole('button').first().click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

test('two transfers in a row are each processed with their own receipt', async ({ page }) => {
  // Force a success outcome deterministically for every transaction call.
  await page.route('**/api/transactions', async (route) => {
    const headers = { ...route.request().headers(), 'x-mock-outcome': 'success' }
    await route.continue({ headers })
  })
  await page.goto('/login')
  await page.getByLabel('Email o teléfono').fill('carlos@spin.mx')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.getByRole('link', { name: 'Nueva transacción' }).click()

  // First transfer of $10.
  await page.getByLabel('Monto').fill('10')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByTestId('contact-list').getByRole('button').first().click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  const firstReceipt = page.getByTestId('receipt')
  await expect(firstReceipt).toBeVisible()
  await expect(firstReceipt).toContainText('$10.00')

  // Start a fresh transfer from the result step.
  await page.getByRole('button', { name: 'Nueva transacción' }).click()

  // Second transfer of $25 — must be independently processed, not a replay of the first receipt.
  await page.getByLabel('Monto').fill('25')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByTestId('contact-list').getByRole('button').first().click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  const secondReceipt = page.getByTestId('receipt')
  await expect(secondReceipt).toBeVisible()
  await expect(secondReceipt).toContainText('$25.00')
  await expect(secondReceipt).not.toContainText('$10.00')
})
