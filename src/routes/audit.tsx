import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { AuditView } from '@/components/AuditView';

export const Route = createFileRoute('/audit')({
  component: AuditPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Auditoria' },
      { name: 'description', content: 'Log de auditoria do sistema' },
    ],
  }),
});

function AuditPage() {
  return (
    <AppLayout>
      <AuditView />
    </AppLayout>
  );
}
