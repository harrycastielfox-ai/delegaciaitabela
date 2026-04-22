import { useEffect, useMemo, useState } from 'react';
import { Users, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, type UserRole, type UserStatus } from '@/hooks/use-auth';

type AdminProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
};

const roleOptions: UserRole[] = ['investigador', 'escrivao', 'delegado', 'admin'];

function statusBadge(status: UserStatus) {
  if (status === 'active') return 'badge-low';
  if (status === 'blocked') return 'badge-high';
  return 'badge-medium';
}

export function AdminUsersView() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<AdminProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAllowed = useMemo(
    () => profile?.role === 'admin' || profile?.role === 'delegado',
    [profile?.role],
  );

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as AdminProfileRow[]) ?? []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (
    profileId: string,
    payload: Partial<Pick<AdminProfileRow, 'status' | 'role'>>,
  ) => {
    setSavingId(profileId);
    try {
      const { error } = await supabase.from('profiles').update(payload).eq('id', profileId);
      if (error) throw error;
      await loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      alert('Não foi possível atualizar o usuário.');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    if (isAllowed) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAllowed]);

  if (!isAllowed) {
    return (
      <div className="section-card">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-4 w-4" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Acesso restrito</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Apenas usuários com cargo <strong>delegado</strong> ou <strong>admin</strong> podem acessar esta área.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">Gestão de Usuários</h1>
          </div>
          <p className="text-sm text-muted-foreground">Aprovação de acesso e definição de cargos</p>
        </div>
        <button onClick={loadUsers} className="btn-secondary" disabled={loading}>
          Atualizar
        </button>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Nome</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">E-mail</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Status</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Cargo</th>
              <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="data-table-row">
                <td className="px-4 py-3.5 text-xs font-semibold text-foreground">{u.full_name || 'Sem nome'}</td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{u.email || 'Sem e-mail'}</td>
                <td className="px-4 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${statusBadge(u.status)}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, { role: e.target.value as UserRole })}
                    disabled={savingId === u.id}
                    className="h-9 rounded-md border border-border bg-input px-3 text-xs text-foreground"
                  >
                    {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateUser(u.id, { status: 'active' })}
                      disabled={savingId === u.id}
                      className="btn-secondary py-1.5 text-xs"
                    >
                      Ativar
                    </button>
                    <button
                      onClick={() => updateUser(u.id, { status: 'blocked' })}
                      disabled={savingId === u.id}
                      className="btn-secondary py-1.5 text-xs"
                    >
                      Bloquear
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  Carregando usuários...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
