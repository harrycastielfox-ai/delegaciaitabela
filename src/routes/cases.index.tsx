import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AppLayout } from '@/components/AppLayout';
import { CaseListView } from '@/components/CaseListView';

const searchSchema = z.object({
  situation: z.string().optional(),
  priority: z.string().optional(),
  overdue: z.enum(['true', 'false']).optional(),
  noDeadline: z.enum(['true', 'false']).optional(),
  noUpdate: z.enum(['true', 'false']).optional(),
  finalized: z.enum(['true', 'false']).optional(),
});

export const Route = createFileRoute('/cases/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: CasesPage,
  head: () => ({
    meta: [
      { title: 'SIPI - Inquéritos' },
      { name: 'description', content: 'Lista de inquéritos policiais' },
    ],
  }),
});

function CasesPage() {
  return (
    <AppLayout>
      <CaseListView />
    </AppLayout>
  );
}
