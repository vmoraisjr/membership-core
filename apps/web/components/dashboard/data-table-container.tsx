import {
  ScreenLegend,
  type LegendSection,
} from "./screen-legend";

type Props = {
  title?: string;

  description?: string;

  toolbar?: React.ReactNode;

  /** Sections shown in the discreet "?" legend next to the section title. */
  helpLegend?: LegendSection[];

  children: React.ReactNode;
};

export function DataTableContainer({
  title,
  description,
  toolbar,
  helpLegend,
  children,
}: Props) {
  return (
    <div className="workspace-section">
      {(title || description) && (
        <div className="workspace-section-header">
          <div className="space-y-1">
            {title ? (
              <div className="flex items-center gap-1.5">
                <h2 className="workspace-section-title">
                  {title}
                </h2>
                {helpLegend ? (
                  <ScreenLegend
                    sections={helpLegend}
                  />
                ) : null}
              </div>
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
