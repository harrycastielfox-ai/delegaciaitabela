import type { LucideIcon } from 'lucide-react';

type Tone = 'success' | 'info' | 'primary' | 'warning' | 'destructive' | 'purple' | 'muted';

const toneVar: Record<Tone, string> = {
  success: 'var(--success)',
  info: 'var(--info)',
  primary: 'var(--primary)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  purple: 'var(--purple)',
  muted: 'var(--muted-foreground)',
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  className = '',
}: StatCardProps) {
  const color = toneVar[tone];

  return (
    <div
      className={`stat-card stat-card-border h-full min-h-[124px] p-5 ${className}`}
      style={{ ['--stat-color' as never]: color }}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className="block text-[10px] font-extrabold uppercase tracking-[0.16em]"
            style={{ color }}
          >
            {label}
          </span>

          <div className="mt-3 text-4xl font-black leading-none tracking-tight tabular-nums" style={{ color }}>
            {value}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
        </div>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
            borderColor: `color-mix(in oklab, ${color} 28%, transparent)`,
            color,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
