import { Activity, Filter, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  updatedAt?: string;
  loading?: boolean;
  onRefresh?: () => void;
  showActions?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  updatedAt,
  loading = false,
  onRefresh,
  showActions = true,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/15 shadow-[0_0_20px_rgba(17,205,122,0.25)]">
            <Activity className="h-4 w-4 text-primary" />
            <span className="absolute inline-flex h-9 w-9 animate-ping rounded-full border border-primary/20" />
          </span>

          <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
        </div>

        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {showActions ? (
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/30"
          >
            <Sparkles className="h-4 w-4" />
            Novo Inquérito
          </Link>

          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground"
            title="Filtros rápidos em breve"
          >
            <Filter className="h-4 w-4" />
            Filtros Rápidos
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizado: {updatedAt || '---'}
          </button>
        </div>
      ) : null}
    </header>
  );
}
