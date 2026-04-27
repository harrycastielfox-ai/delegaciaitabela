import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

export function AppLayout({ children, fluid = false }: { children: ReactNode; fluid?: boolean }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-[260px] flex-1 overflow-auto">
        <div className={fluid ? 'w-full px-3 py-3 md:px-4 md:py-4 xl:px-5' : 'mx-auto max-w-[1400px] px-8 py-8'}>
          {children}
        </div>
      </main>
    </div>
  );
}
