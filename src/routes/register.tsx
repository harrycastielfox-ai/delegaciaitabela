import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { CaseForm } from '@/components/CaseForm';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Novo Inquérito' },
      { name: 'description', content: 'Registrar novo inquérito policial' },
    ],
  }),
});

function RegisterPage() {
  return (
    <AppLayout>
      <CaseForm mode="create" />
    </AppLayout>
  );
}
