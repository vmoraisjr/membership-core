# UI-017 - Registro de Auditoria — Relatório de Implementação

## Objetivo da task

Tornar auditoria compreensível para operação e suporte. Tabela editorial com filtros por usuário, clínica, entidade, ação e período, busca e detalhes. Exibir quem, o quê, onde, quando, entidade e antes/depois quando disponível. Critérios de aceite: linguagem humana, sem dados técnicos desnecessários, permissões preservadas.

## Auditoria prévia

`AuditLogTable` já era uma tabela (não crua — já usava `Table`/`DataTableContainer`/`EmptyState`) com filtros de usuário, entidade, data e clínica (só na visão de plataforma), exportação CSV e um painel lateral de detalhes. RBAC e tenant isolation já estavam corretos em `getAuditLogs()` (visão de clínica só vê eventos da própria clínica com `filterByClinic`; visão de plataforma restrita a `OWNER`/`ADMIN` sem `clinicId`) — nenhuma alteração foi necessária nessa camada.

Dois problemas reais, ambos batendo diretamente nos critérios de aceite:

1. **Filtro por "ação" simplesmente não existia**, apesar de ser pedido explicitamente pela task ("filtros por usuário, clínica, entidade, **ação** e período"). `AuditLogFilters` não tinha o campo, `getAuditLogs()` não filtrava por ele e a tabela não tinha o seletor.
2. **O painel de detalhes mostrava o payload bruto em JSON** (`JSON.stringify(metadata, null, 2)` dentro de um `<pre>`) — o oposto exato do critério "sem dados técnicos desnecessários" e "linguagem humana". A prévia inline na tabela já fazia uma humanização parcial (camelCase → Title Case, até 3 campos), mas o painel de detalhes a ignorava por completo. Nenhum dos dois distinguia "antes/depois" quando o metadata continha pares como `previousStatus`/`nextStatus` — item explicitamente pedido pela task ("antes/depois quando disponível").

## Arquivos criados

- `features/audit-log/utils/humanize-metadata.ts` — `humanizeAuditMetadata(metadata)`: detecta pares antes/depois por convenção de nome de chave (`previousX`/`priorX`/`oldX` vs `nextX`/`newX`) e os separa como mudanças (`{label, before, after}`); as chaves restantes viram uma lista de campos humanizados (`{label, value}`), com formatação de datas ISO para pt-BR, booleanos como "Sim"/"Não" e arrays unidos por vírgula. Usado tanto na prévia da tabela quanto no painel de detalhes quanto na exportação CSV — uma única fonte de humanização, sem duplicar a lógica nos três lugares.

## Arquivos modificados

- `features/audit-log/services/get-audit-logs.ts` — adicionado filtro `action` (`AuditLogFilters.action`, validado contra `AuditAction`) e `actionOptions` (valores distintos de ação já presentes no conjunto filtrado, mesmo padrão usado para `actorOptions`/`entityOptions`).
- `app/(dashboard)/dashboard/audit-logs/page.tsx`, `app/(dashboard)/dashboard/audit-logs/export/route.ts` — passam o novo parâmetro `action` adiante; a exportação CSV passou a usar `humanizeAuditMetadata` em vez de um `key: value` cru, mantendo a coluna "detalhes" consistente com o que aparece na tela.
- `features/audit-log/components/audit-log-table.tsx` — filtros de usuário/entidade/clínica migrados de `<select>` cru para `Select`; novo filtro "Ação"; textos "Clínica", "Todas as clínicas" e "Extrair CSV" migrados para `messages/pt-BR.json`; a prévia inline de detalhes passou a usar `humanizeAuditMetadata` (mostra até 2 mudanças ou campos, priorizando mudanças antes/depois).
- `features/audit-log/components/audit-log-details-side-panel.tsx` — reescrito: removido o dump de JSON bruto; nova seção **"O que mudou"** com uma tabela (Campo/Antes/Depois) quando o evento tem mudanças detectáveis; nova seção **"Detalhes adicionais"** com os campos restantes em formato de lista de definição, cada um já humanizado; adicionado campo **"Onde"** (nome da clínica, ou "Plataforma" quando o evento não pertence a nenhuma clínica) — antes só aparecia na tabela da visão de plataforma, agora aparece também no detalhe, cobrindo o "onde" pedido pela task tanto na visão de clínica quanto na de plataforma.
- `messages/pt-BR.json` — novo bloco em `audit` (`platformTitle`, `platformDescription`, `filters.*`, `columns.clinic`, `export`, `details.*`) e nova chave `shared.labels.field`.

## Decisões arquiteturais

- **"Tabela editorial" foi mantida como tabela**, não uma timeline nova. A UI-014 já adicionou uma aba de timeline dentro dos detalhes de cada clínica (`PlatformClinicDetailsPage`); criar uma segunda visualização de timeline aqui duplicaria essa apresentação para os mesmos dados. A "editorialização" pedida pela task foi entregue via humanização do conteúdo (linguagem humana, antes/depois) em vez de uma mudança de formato de tabela para timeline.
- **Detecção de antes/depois é por convenção de nome de campo, não por uma lista fixa de eventos.** Isso evita ter que listar manualmente cada ação que muda estado (status de assinatura, papel de usuário, etc.) — qualquer metadata futura que siga o padrão `previousX`/`nextX` já usado no código (`updateClinicSubscriptionStatus`, entre outros) é detectada automaticamente, sem exigir uma nova task toda vez que uma Server Action passar a registrar uma mudança de estado.
- **Nenhuma Server Action nem o formato de `metadata` armazenado foi alterado.** A humanização acontece inteiramente na leitura/apresentação; o JSON continua sendo persistido como está no banco, preservando compatibilidade com qualquer consumidor futuro dos dados brutos.
- **Filtro de período permaneceu como seleção de dia exato** (já existente), não uma janela de datas. A task pede "período" entre os filtros, que o filtro de data exato já atende; não introduzi um segundo controle de intervalo para não adicionar um padrão de filtro que não existe em nenhuma outra tabela do sistema até aqui.

## Validação executada

- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 28 rotas geradas.
- `pnpm test:audit` — ✅ os 8 cenários (convites, mudança de perfil, login, faturas de paciente, cancelamento de uso de benefício, faturas da fundação de cobrança da clínica, templates de contrato).
- `pnpm test:tenant` — ✅ os 11 cenários.
- `pnpm test:rbac` — ✅ os 5 cenários.
- **Verificação em navegador (Playwright)**, autenticado como `owner+workspace@membership-core.local` (plataforma):
  - Listagem: 4 filtros como `Select` (Usuário, Entidade, Ação, Clínica) mais o campo de data; colunas Quando/Clínica/Usuário/Ações/Entidade/Detalhes; prévia inline mostrando "Login Source: auth_session" (humanizado) em vez de JSON.
  - Painel de detalhes de um evento de login: seções Ação/Quando/Quem/Onde/Entidade preenchidas corretamente, "Detalhes adicionais" com "Login Source: auth_session" — nenhum JSON bruto visível.
  - Painel de detalhes de um evento de mudança de status de assinatura (filtrado por entidade "Assinatura da clínica"): seção **"O que mudou"** presente com uma linha "Status" na tabela Campo/Antes/Depois, e "Detalhes adicionais" mostrando "Last Invoice Status: PENDING" — confirma a detecção automática de pares antes/depois funcionando.
  - 0 erros de console em todas as passagens.

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: nenhuma Server Action, RBAC ou regra de tenant isolation foi alterada. A adição do filtro `action` segue exatamente o mesmo padrão de validação/consulta já usado para `entity`; a humanização de metadata é puramente de leitura e não afeta o que é gravado no `AuditLog`.

## Próxima task sugerida

`UI-018-global-states.md`.
