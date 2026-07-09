import {
  expect,
  test,
} from "@playwright/test";

import {
  confirmDialog,
  login,
} from "./helpers.mjs";

const PLATFORM_OWNER = {
  email:
    "owner+workspace@membership-core.local",
  password: "ChangeMe123!",
};

const FIRST_ACCESS_CLINIC = {
  email:
    "first-access@browser-journeys.local",
  password: "TempClinic123!",
};
const FIRST_ACCESS_CLINIC_FINAL_PASSWORD =
  "ClinicFinal123!";

test("platform owner logs in and creates a client company", async ({
  page,
}) => {
  await login(page, PLATFORM_OWNER);

  await expect(page).toHaveURL(
    /\/dashboard$/
  );
  await expect(
    page.getByText(
      "Resumo da plataforma"
    )
  ).toBeVisible();

  await page.goto("/dashboard/clinics");
  await expect(
    page.getByRole("heading", {
      name: "Empresas clientes",
    })
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Nova empresa",
    })
    .click();

  await page
    .getByPlaceholder(
      "Razão social ou nome operacional"
    )
    .fill("Sheep Browser Created");
  await page
    .getByPlaceholder(
      "Nome da empresa na interface"
    )
    .fill("Browser Created");
  await page
    .getByPlaceholder(
      "CNPJ ou documento"
    )
    .fill("12.345.678/0001-95");
  await page
    .getByPlaceholder(
      "contato@clinica.com"
    )
    .fill(
      "created@browser-journeys.local"
    );
  await page
    .getByPlaceholder(
      "(11) 99999-9999"
    )
    .fill("(31) 98888-3333");
  await page
    .getByPlaceholder("00000-000")
    .fill("30110-000");
  await page
    .getByPlaceholder("Cidade")
    .fill("Belo Horizonte");
  await page
    .getByPlaceholder("UF")
    .fill("MG");
  await page
    .getByPlaceholder(
      "Rua, número e complemento"
    )
    .fill("Rua Browser, 50");

  await page
    .getByRole("button", {
      name: "Criar empresa",
    })
    .click();
  await confirmDialog(
    page,
    "Criar clínica?",
    "Criar empresa"
  );

  await expect(
    page.getByText(
      "Sheep Browser Created"
    )
  ).toBeVisible();
});

test("clinic master completes first access and reaches the dashboard", async ({
  page,
}) => {
  await login(page, FIRST_ACCESS_CLINIC);

  await page.waitForURL(
    (url) =>
      /\/first-access$/.test(
        url.toString()
      ) ||
      /\/dashboard$/.test(
        url.toString()
      ) ||
      /error=invalid_credentials/.test(
        url.toString()
      ),
    {
      timeout: 10000,
    }
  );

  if (
    /error=invalid_credentials/.test(
      page.url()
    )
  ) {
    await login(page, {
      email:
        FIRST_ACCESS_CLINIC.email,
      password:
        FIRST_ACCESS_CLINIC_FINAL_PASSWORD,
    });
  }

  if (/\/first-access$/.test(page.url())) {
    await expect(
      page.getByRole("heading", {
        name: "Primeiro acesso da clínica",
      })
    ).toBeVisible();

    await page
      .getByLabel("Nova senha")
      .fill(
        FIRST_ACCESS_CLINIC_FINAL_PASSWORD
      );
    await page
      .getByLabel(
        "Confirmar senha"
      )
      .fill(
        FIRST_ACCESS_CLINIC_FINAL_PASSWORD
      );
    await page
      .getByRole("button", {
        name: "Atualizar senha",
      })
      .click();
  }

  await expect(page).toHaveURL(
    /\/dashboard$/
  );
  await expect(
    page.getByText(
      "Resumo operacional"
    )
  ).toBeVisible();
});

test("forgot password flow returns a neutral success message", async ({
  page,
}) => {
  await page.goto("/forgot-password");

  await page
    .getByLabel("Email")
    .fill(
      "missing-user@browser-journeys.local"
    );
  await page
    .getByRole("button", {
      name: "Criar token de redefinição",
    })
    .click();

  await expect(page).toHaveURL(
    /status=sent/
  );
  await expect(
    page.getByText(
      "Se a conta existir, um token de redefinição foi criado."
    )
  ).toBeVisible();
});
