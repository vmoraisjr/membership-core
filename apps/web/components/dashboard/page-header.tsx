type Props = {
  title: string;
  description: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  meta,
  action,
}: Props) {
  return (
    <div className="workspace-header">
      <div className="workspace-header-grid">
        <div className="min-w-0 space-y-3">
          {eyebrow ? (
            <p className="workspace-eyebrow">
              {eyebrow}
            </p>
          ) : null}

          <div className="space-y-2">
            <h1 className="workspace-title">
              {title}
            </h1>

            <p className="workspace-description">
              {description}
            </p>
          </div>

          {meta ? (
            <div className="workspace-meta">
              {meta}
            </div>
          ) : null}
        </div>

        {action ? (
          <div className="flex shrink-0 items-start justify-start xl:justify-end">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
