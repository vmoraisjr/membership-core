"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<
  string,
  string
> = {
  dashboard: "Home",
  clinics: "Empresas",
  plans: "Planos",
  patients: "Clientes",
  subscriptions: "Assinaturas",
  benefits: "Benefícios",
  "benefit-usage":
    "Uso de benefício",
  payments: "Pagamentos",
  billing: "Assinaturas SaaS",
  messages: "Chamados",
  users: "Usuários",
  company: "Empresa",
  "audit-logs": "Auditoria",
};

function getSegmentLabel(
  segment: string
) {
  return (
    SEGMENT_LABELS[segment] ??
    "Detalhes"
  );
}

export function BreadcrumbTrail() {
  const pathname = usePathname();
  const segments = pathname
    .split("/")
    .filter(Boolean);

  if (
    segments.length <= 1 ||
    segments[0] !== "dashboard"
  ) {
    return null;
  }

  const crumbs = segments.map(
    (segment, index) => {
      const href =
        "/" +
        segments
          .slice(0, index + 1)
          .join("/");

      return {
        href,
        label:
          index > 1 &&
          !SEGMENT_LABELS[segment]
            ? "Detalhes"
            : getSegmentLabel(segment),
        isCurrent:
          index ===
          segments.length - 1,
      };
    }
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
    >
      {crumbs.map((crumb, index) => (
        <div
          key={crumb.href}
          className="flex items-center gap-2"
        >
          {crumb.isCurrent ? (
            <span
              aria-current="page"
              className="px-0.5 font-medium text-foreground"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="rounded-md px-0.5 transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}

          {index <
          crumbs.length - 1 ? (
            <span
              aria-hidden="true"
              className="text-muted-foreground/70"
            >
              /
            </span>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
