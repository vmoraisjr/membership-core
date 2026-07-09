# Functional QA Runner

## Objetivo

Padronizar a execucao da bateria tecnica do produto em modo serial, reduzindo
interferencia entre suites que compartilham o mesmo banco funcional.

## Comandos Oficiais

No diretório raiz:

```bash
pnpm qa:web
pnpm qa:web:fast
```

Diretamente no app web:

```bash
pnpm --dir apps/web qa:functional
pnpm --dir apps/web qa:functional:fast
```

## O que o Runner Executa

Em ordem:

1. reset do banco funcional;
2. suites de auth;
3. suites de recovery / first access;
4. audit;
5. billing;
6. contracts;
7. membership;
8. messages;
9. modules;
10. rbac;
11. tenant isolation;
12. clinic bootstrap;
13. users;
14. validation hardening;
15. typecheck;
16. lint;
17. build.

## Flags

Disponíveis ao chamar `tsx scripts/run-functional-qa.ts`:

- `--skip-build`
- `--skip-lint`
- `--skip-typecheck`
- `--reset-between`

## Observação

O runner foi criado para execucao serial porque as suites atuais compartilham a
mesma base funcional. Paralelizar sem isolamento adicional pode gerar falsos
negativos.
