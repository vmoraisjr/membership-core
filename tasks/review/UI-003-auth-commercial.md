# UI-003 - Autenticação Comercial — Relatório de Implementação

## Objetivo da task

Transformar login e acesso na primeira impressão comercial do produto: telas de login, convite, criação de senha, acesso negado e sessão expirada, com composição premium, mostrar/ocultar senha, validação inline, loading, erros claros, acessibilidade e responsividade.

## Auditoria prévia

`/login` já era a tela mais madura do app (painel dividido, marca forte, benefícios, `Field`/`Input`/`PasswordInput`/`Button`, overlay de loading). As outras 4 páginas de auth (`/first-access`, `/forgot-password`, `/reset-password`, `/invite`) eram HTML cru (`<input>`/`<button>` sem nenhum componente do design system), sem toggle de senha, e `/first-access` não usava i18n em nenhum texto — tudo confirmado em `docs/frontend-audit.md` §1.1. Também encontrei dois defeitos ativos no login durante a auditoria: um caractere "h" solto após o subtítulo (`{t("auth.login.subtitle")}h`) e um bloco de parágrafo comentado morto.

"Acesso negado" não existe como rota separada — é o componente `features/rbac/components/access-denied.tsx`, reutilizado em ~20 páginas do dashboard; usava cores hardcoded (`amber-200/amber-50/amber-900`) fora do sistema de tokens da UI-001. "Sessão expirada" também não existia como estado tratado: `app/(dashboard)/layout.tsx` já redireciona para `/login?next=/dashboard` quando a sessão é inválida, mas a página de login não distinguia esse caso de uma visita direta.

## Arquivos criados

- `features/auth/components/auth-card.tsx` — shell compartilhado (logo, título, descrição, caixa de mensagem com tom neutro/sucesso/erro, rodapé) para as 4 telas secundárias de auth.
- `features/auth/components/auth-submit-button.tsx` — botão de envio com estado de carregamento (`useFormStatus`), reaproveitando o padrão já usado em `LoginForm`.

## Arquivos modificados

- `app/(auth)/first-access/page.tsx` — reescrita completa com `AuthCard`/`Field`/`PasswordInput`/`AuthSubmitButton`, 100% i18n (antes 0%), toggle de mostrar/ocultar senha adicionado.
- `app/(auth)/forgot-password/page.tsx` — reescrita com `AuthCard`, label de e-mail padronizado (`shared.labels.email`), mensagem de sucesso com tom semântico.
- `app/(auth)/reset-password/page.tsx` — reescrita com `AuthCard`, toggle de senha adicionado aos 2 campos de senha.
- `app/(auth)/invite/page.tsx` — reescrita com `AuthCard`, toggle de senha adicionado aos 2 campos de senha.
- `app/(auth)/login/page.tsx` — corrigido o "h" solto após o subtítulo; removido bloco comentado morto; adicionado estado "sessão expirada" (detectado pela presença do parâmetro `next`, sem qualquer alteração de lógica de sessão/backend); mensagens agora têm tom semântico (erro/sucesso/neutro) em vez de uma única cor genérica.
- `features/rbac/components/access-denied.tsx` — cores hardcoded (`amber-*`) substituídas pelos tokens `--color-warning`/`--color-warning-soft`.
- `messages/pt-BR.json` — chaves novas: `shared.actions.processing`, `auth.login.sessionExpired`, `auth.firstAccess.{titleClinic,titlePlatform,descriptionClinic,descriptionPlatform,submit}`. Reaproveitadas (sem duplicar) as chaves `auth.resetPassword.newPassword/confirmPassword/passwordTooShort/passwordMismatch`, `shared.labels.email` e `shared.actions.updatePassword` nas telas de first-access/reset-password/invite.

## Decisões arquiteturais

- **"Sessão expirada" tratada apenas na camada de apresentação**: a página de login interpreta o parâmetro `next` (já emitido pelo redirect existente em `app/(dashboard)/layout.tsx`) para mostrar a mensagem — nenhuma lógica de expiração de sessão foi criada ou alterada no backend, conforme regra permanente da task.
- **"Acesso negado" tratado como o componente `AccessDenied` existente**, não como uma nova rota — é a implementação real e já amplamente usada desta tela no produto; apenas a cor foi corrigida para o sistema de tokens, sem alterar a API do componente (usado por ~20 arquivos).
- **`AuthCard` colocado em `features/auth/components`**, não em `components/layout`, por ser específico do fluxo de autenticação e seguir o padrão feature-first já usado por `LoginForm`.

## Validação executada

- `pnpm lint` — ✅ sem erros/warnings.
- `pnpm --dir apps/web typecheck` — ✅ sem erros.
- `pnpm --dir apps/web build` — ✅ build de produção concluído, 27 rotas geradas.
- **Verificação em navegador (Playwright, headless Chromium)** contra o servidor de desenvolvimento já ativo:
  - `/login?next=%2Fdashboard` — mensagem "Sua sessão expirou. Entre novamente para continuar." renderiza corretamente, sem o "h" solto; 0 erros de console.
  - `/forgot-password` e `/forgot-password?status=sent` — shell novo renderiza, mensagem de sucesso aparece; 0 erros.
  - `/reset-password?token=abc123&error=invalid_token` — token pré-preenchido, erro em tom vermelho, toggle de senha visível nos 2 campos; 0 erros.
  - `/invite?token=xyz789` — token pré-preenchido, 4 campos com toggle de senha; 0 erros.
  - `/first-access` (sem sessão) — redireciona corretamente para `/login`; 0 erros.
  - Screenshots confirmam visual consistente com a marca Sheep em todas as telas.

## Trabalho remanescente

- Nenhum dentro do escopo desta task. `AccessDenied` pode receber mais polimento visual (ícone/badge) na UI-018 (Estados Globais), que é o escopo mais apropriado para padronizar todos os estados de feedback do app.

## Riscos

- Baixo: mudanças de apresentação isoladas, nenhuma Server Action alterada. O heurístico de "sessão expirada" (baseado no parâmetro `next`) é apenas informativo — não afeta o comportamento real de autenticação/redirecionamento, que continua sendo decidido inteiramente pelo backend existente.

## Próxima task sugerida

`UI-004-clinic-dashboard.md`.
