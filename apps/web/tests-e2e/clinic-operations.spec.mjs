import {
  expect,
  test,
} from "@playwright/test";

import {
  confirmDialog,
  login,
} from "./helpers.mjs";

const OPERATIONS_CLINIC = {
  email:
    "operations@browser-journeys.local",
  password: "ClinicReady123!",
};

const PLATFORM_OWNER = {
  email:
    "owner+workspace@membership-core.local",
  password: "ChangeMe123!",
};

test("clinic owner manages plan, customer, subscription and support thread", async ({
  page,
}) => {
  const suffix = Date.now();
  const planName =
    `Plano Browser Premium ${suffix}`;
  const patientName =
    `Cliente Browser ${suffix}`;
  const supportSubject =
    `Erro de cobranca browser ${suffix}`;

  await login(page, OPERATIONS_CLINIC);

  await expect(page).toHaveURL(
    /\/dashboard$/
  );
  await expect(
    page.getByText(
      "Resumo operacional"
    )
  ).toBeVisible();

  await page.goto("/dashboard/plans");
  await page
    .getByRole("button", {
      name: "Novo plano",
    })
    .click();
  await page
    .getByPlaceholder("Nome do plano")
    .fill(planName);
  await page
    .getByPlaceholder("Descrição")
    .fill(
      "Plano criado pela automação browser."
    );
  await page
    .getByPlaceholder("Preço mensal")
    .fill("149.9");
  await page
    .getByRole("button", {
      name: "Criar plano",
    })
    .click();
  await confirmDialog(
    page,
    "Criar plano?",
    "Criar plano"
  );
  await expect(
    page.getByText(planName).first()
  ).toBeVisible();

  await page.goto("/dashboard/patients");
  await page
    .getByRole("button", {
      name: "Novo cliente",
    })
    .click();
  await page
    .getByPlaceholder("Nome completo")
    .fill(patientName);
  await page
    .getByPlaceholder("E-mail")
    .fill(
      "cliente.browser@journeys.local"
    );
  await page
    .getByPlaceholder("Telefone")
    .fill("(21) 97777-3333");
  await page
    .locator('input[type="date"]')
    .first()
    .fill("1992-04-15");
  await page
    .locator('input[name="document"]')
    .fill("529.982.247-25");
  await page
    .locator('input[name="zipCode"]')
    .fill("20000-000");
  await page
    .locator('input[name="city"]')
    .fill("Rio de Janeiro");
  await page
    .locator('input[name="state"]')
    .fill("RJ");
  await page
    .locator('input[name="address"]')
    .fill("Rua Cliente Browser, 99");
  await page
    .getByRole("button", {
      name: "Criar paciente",
    })
    .click();
  await confirmDialog(
    page,
    "Criar paciente?",
    "Criar paciente"
  );
  await expect(
    page.getByText(patientName).first()
  ).toBeVisible();

  await page.goto("/dashboard/subscriptions");
  await page
    .getByRole("button", {
      name: "Nova assinatura",
    })
    .click();
  const subscriptionDialog =
    page.getByRole("dialog", {
      name: "Criar assinatura",
    });
  await subscriptionDialog
    .locator("select")
    .nth(0)
    .selectOption({
      label: patientName,
    });
  await subscriptionDialog
    .locator("select")
    .nth(1)
    .selectOption({
      label: planName,
    });
  await subscriptionDialog
    .getByRole("button", {
      name: "Criar assinatura",
    })
    .click();
  await confirmDialog(
    page,
    "Criar assinatura?",
    "Criar assinatura"
  );
  const subscriptionsTable =
    page.getByRole("table");
  await expect(
    subscriptionsTable.getByText(
      patientName
    ).first()
  ).toBeVisible();
  await expect(
    subscriptionsTable.getByText(
      planName
    ).first()
  ).toBeVisible();

  await page.goto("/dashboard/messages");
  await page
    .getByPlaceholder(
      "Ex.: Ajuste de cobrança"
    )
    .fill(supportSubject);
  await page
    .locator("select")
    .first()
    .selectOption("PAYMENT");
  await page
    .getByPlaceholder(
      "Descreva o problema, solicitação ou contexto do chamado."
    )
    .fill(
      "Precisamos revisar uma divergencia de cobranca identificada pela automação."
    );
  await page
    .getByRole("button", {
      name: "Abrir chamado",
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: supportSubject,
    })
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Sair",
    })
    .click();
  await expect(page).toHaveURL(
    /\/login/
  );

  await login(page, PLATFORM_OWNER);
  await expect(page).toHaveURL(
    /\/dashboard$/
  );
  await page.goto("/dashboard/messages");

  await expect(
    page.getByRole("link", {
      name: new RegExp(
        `${supportSubject}.*Operations Co\\.`
      ),
    }).first()
  ).toBeVisible();
});
