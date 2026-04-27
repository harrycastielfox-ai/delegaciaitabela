import type { ReactNode } from 'react';

type Accent = 'success' | 'warning' | 'destructive' | 'muted' | 'info' | 'primary' | 'purple';

const accentColor: Record<Accent, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  muted: 'var(--muted-foreground)',
  info: 'var(--info)',
  primary: 'var(--primary)',
  purple: 'var(--purple)',
};

interface PanelProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  accent?: Accent;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  icon,
  action,
  accent = 'muted',
  children,
  className = '',
  bodyClassName = 'p-5',
}: PanelProps) {
  const color = accentColor[accent];

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-card/95 shadow-sm transition-all duration-200 hover:shadow-sm ${className}`}
      style={{
        borderColor: `color-mix(in oklab, ${color} 14%, var(--border))`,
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon}
          <h3
            className="truncate text-xs font-extrabold uppercase tracking-[0.15em]"
            style={{ color }}
          >
            {title}
          </h3>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
