export async function login(
  page,
  { email, password }
) {
  await page.goto("/login");
  await page
    .getByLabel("E-mail")
    .fill(email);
  await page.locator("#password").fill(
    password
  );
  await page
    .getByRole("button", {
      name: "Entrar",
    })
    .click();
}

export async function confirmDialog(
  page,
  confirmTitle,
  actionLabel
) {
  await page
    .getByRole("alertdialog")
    .waitFor();
  await page
    .getByRole("heading", {
      name: confirmTitle,
    })
    .waitFor();
  await page
    .getByRole("button", {
      name: actionLabel,
    })
    .last()
    .click();
}
