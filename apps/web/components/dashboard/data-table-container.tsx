type Props = {
  title?: string;

  description?: string;

  toolbar?: React.ReactNode;

  children: React.ReactNode;
};

export function DataTableContainer({
  title,
  description,
  toolbar,
  children,
}: Props) {
  return (
    <div className="workspace-section">
      {(title || description) && (
        <div className="workspace-section-header">
          <div className="space-y-1">
            {title ? (
              <h2 className="workspace-section-title">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="workspace-section-description">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {toolbar ? (
        <div className="workspace-toolbar">
          {toolbar}
        </div>
      ) : null}

      <div className="min-w-0">{children}</div>
    </div>
  );
}
