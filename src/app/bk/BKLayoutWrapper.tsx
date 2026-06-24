'use client';

import { usePathname } from 'next/navigation';

export default function BKLayoutWrapper({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCetak = pathname?.includes('/cetak');

  if (isCetak) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {sidebar}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
