# UI-043 - Bug: Status de Pagamento "Atrasado" Deve Ser Automático

## Objetivo da task

Verificar se o status "atrasado" (`PaymentStatus.OVERDUE`) de uma fatura é
calculado automaticamente a partir da data de vencimento, ou se depende
de uma ação manual — e corrigir se for manual.

## Auditoria prévia

Não investigada em profundidade ainda — primeiro passo da task é ler os
services de billing (`features/billing/services/*.ts`,
`features/clinic/utils/clinic-status.ts`) para entender onde o status
`OVERDUE` é hoje atribuído: no momento da leitura (calculado on-the-fly
comparando `dueDate` com a data atual), em um job agendado, ou só quando
alguém aciona manualmente.

## Escopo

- Mapear todos os pontos onde `PaymentStatus`/`ClinicSubscriptionStatus`
  transicionam para "atrasado" hoje.
- Se já for calculado automaticamente na leitura (comparação de data),
  documentar isso no relatório e fechar sem mudança de código — o QA pode
  estar reportando uma percepção, não um bug real.
- Se depender de ação manual, implementar o cálculo automático (na leitura
  ou via job, dependendo do que já existe de infraestrutura no projeto —
  não introduzir um novo sistema de jobs se não houver um).

## Critérios de aceite

- Comportamento documentado (automático confirmado, ou corrigido).
- `pnpm --dir apps/web typecheck`, `pnpm lint`, `pnpm build` sem erros.
- `pnpm test:billing` sem regressão (adicionar teste novo se a lógica
  mudar).

## Restrições

- Não inventar infraestrutura de cron/job nova sem necessidade — verificar
  primeiro se o cálculo na leitura já resolve.
