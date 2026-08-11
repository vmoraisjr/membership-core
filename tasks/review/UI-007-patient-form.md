# UI-007 - Formulário de Paciente — Relatório de Implementação

## Objetivo da task

Formulário claro, seguro e agradável: seções identificação/contato/endereço/complementares; labels permanentes, máscaras, validação inline, resumo de erros, loading, preservação de dados após erro e confirmação ao descartar; campos nome, documento, nascimento, telefone, e-mail, CEP, endereço, cidade e estado; não parecer longo/confuso; erros ao lado do campo; mobile funcional.

## Auditoria prévia

`PatientDialog` já tinha uma base sólida: React Hook Form + Zod, labels sempre visíveis (não placeholder-only), erros inline por campo, e um fluxo de edição com trava (`editingEnabled`) + `ConfirmDialog` antes de salvar. Faltavam, especificamente: os campos ainda estavam todos numa única seção "Identidade do cliente" em vez das 4 seções pedidas; nenhum campo tinha máscara (apesar de `lib/br-formats.ts` já ter `formatBrazilianPhone`/`formatBrazilianZipCode`/`formatBrazilianState` prontos e adotados em `features/clinic`, mas não aqui); não havia resumo de erros; não havia estado de loading no botão de salvar; e fechar o diálogo com dados não salvos não pedia confirmação — os dados eram descartados silenciosamente.

## Arquivos modificados

- `lib/br-formats.ts` — adicionada `formatBrazilianCpf()` (padrão `000.000.000-00`), companheira das funções de CNPJ/telefone/CEP/UF já existentes.
- `features/patients/components/patient-dialog.tsx`:
  - Campos reorganizados em 4 `FormSection` nomeadas: **Identificação** (tipo, nome, documento, nascimento), **Contato** (e-mail, telefone), **Endereço** (CEP, cidade, UF, endereço), **Complementares** (documento do responsável, exibida apenas para dependentes).
  - Máscaras aplicadas em tempo real a documento (CPF), telefone, CEP e UF (`form.setValue` com `shouldValidate`/`shouldDirty`, mantendo compatibilidade com o schema Zod existente, que já normaliza dígitos internamente).
  - Resumo de erros: banner com tom de erro no topo do formulário, listando todas as mensagens de validação ativas, além dos erros que já apareciam ao lado de cada campo.
  - Loading: os dois botões de confirmação de salvar (criar e editar) agora mostram "Processando..." e ficam desabilitados durante `form.formState.isSubmitting`.
  - Confirmação ao descartar: fechar o diálogo (Esc, clique fora, botão X) com o formulário sujo (`isDirty`) agora abre um `AlertDialog` de confirmação em vez de descartar silenciosamente; só fecha de fato após confirmação explícita.
  - Grid do formulário tornado responsivo (`grid-cols-1 sm:grid-cols-2`) para telas estreitas.

## Decisões arquiteturais

- **Bug de assinatura do React Hook Form corrigido durante a verificação**: a implementação inicial lia `form.formState.isDirty` diretamente dentro do handler de fechamento, fora do ciclo de render. O `formState` do RHF é exposto via `Proxy` que só garante atualização confiável de um campo se ele também for lido durante o render do componente (padrão documentado do RHF). Isso causava falha intermitente na confirmação de descarte (`isDirty` não refletia o estado real no momento do fechamento). Corrigido lendo `const isDirty = form.formState.isDirty` no corpo do componente (mesmo padrão já usado para `errors`), e reutilizando essa variável no handler — comportamento confirmado estável em múltiplas execuções após a correção.
- **Máscaras via `form.setValue` em vez de `register`'s `onChange` option**: escolhida por ser o padrão mais explícito e fácil de verificar visualmente; como os campos já são não controlados (registrados por `ref`), `setValue` sincroniza tanto o estado interno quanto o valor exibido no DOM.
- Nenhuma alteração no schema Zod (`patient.schema.ts`) nem nas Server Actions — a validação de negócio (CPF válido, telefone com DDD, CEP de 8 dígitos, UF válida) já existia e continua sendo a fonte da verdade; as máscaras são puramente de apresentação.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 27 rotas geradas.
- `pnpm test:validation` — ✅ todos os 7 cenários passaram, incluindo os 2 específicos de paciente (menor de idade sem vínculo de dependente; dependente sem documento do responsável) — confirma que as máscaras não quebraram a validação de negócio existente.
- **Verificação em navegador (Playwright)**: abri o diálogo de criação, preenchi documento/telefone/CEP/UF com valores crus e confirmei a formatação em tempo real (`123.456.789-01`, `(11) 98765-4321`, `01310-100`, `SP`); testei submissão com CPF inválido e confirmei o resumo de erros no topo; testei fechar o diálogo com nome preenchido (formulário sujo) via tecla Esc e confirmei que o `AlertDialog` "Descartar alterações?" aparece de forma consistente (3 execuções seguidas, 0 erros de console em todas).

## Trabalho remanescente

- Nenhum dentro do escopo desta task.

## Riscos

- Baixo: mudanças de apresentação e máscaras client-side; nenhuma Server Action ou regra de validação de negócio alterada, confirmado pela suíte `test:validation`.

## Próxima task sugerida

`UI-008-plans-catalog.md`.
