import { useEffect, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, FileText, PlusCircle, Bell, History, Shield, ChevronRight, User, LogOut } from 'lucide-react';
import { buildCaseAlerts, listCases } from '@/lib/cases-repository';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard, description: 'Painel de controle' },
  { to: '/cases' as const, label: 'Inquéritos', icon: FileText, description: 'Gestão de casos' },
  { to: '/register' as const, label: 'Novo Caso', icon: PlusCircle, description: 'Registrar inquérito' },
  { to: '/alerts' as const, label: 'Alertas', icon: Bell, description: 'Notificações ativas', showBadge: true },
  { to: '/audit' as const, label: 'Auditoria', icon: History, description: 'Log de alterações' },
];

function SidebarUserArea() {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || 'Usuário';
  const emailShort = user?.email || '';

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-sidebar-foreground">{displayName}</p>
          <p className="truncate text-[10px] text-muted-foreground">{emailShort}</p>
        </div>
        <button onClick={() => signOut()} title="Sair do sistema">
          <LogOut className="h-3.5 w-3.5 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
        </button>
      </div>
      <p className="mt-2 px-3 text-[9px] text-muted-foreground/50">v2.0.0 · SIPI © 2025</p>
    </div>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const loadAlertCount = async () => {
      try {
        const cases = await listCases();
        setAlertCount(buildCaseAlerts(cases).length);
      } catch (err) {
        console.error('Erro ao carregar contador de alertas na sidebar:', err);
      }
    };

    loadAlertCount();
  }, [location.pathname]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-[72px] items-center gap-3.5 border-b border-sidebar-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-tight text-sidebar-foreground">SIPI</h1>
          <p className="text-[10px] font-medium text-muted-foreground">Inquéritos Policiais</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Módulos</p>
        {navItems.map(({ to, label, icon: Icon, description, showBadge }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
              <span className="flex-1">{label}</span>
              {showBadge && alertCount > 0 && (
                <span className="alert-badge">{alertCount}</span>
              )}
              {!showBadge && (
                <ChevronRight className={`h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50 ${isActive ? 'opacity-50' : ''}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <SidebarUserArea />
    </aside>
  );
}
