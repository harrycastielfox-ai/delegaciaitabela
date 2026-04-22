import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { AdminUsersView } from '@/components/AdminUsersView';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Administração de Usuários' },
      { name: 'description', content: 'Gestão administrativa de usuários e aprovações' },
    ],
  }),
});

function AdminUsersPage() {
  return (
    <AppLayout>
      <AdminUsersView />
    </AppLayout>
  );
}
