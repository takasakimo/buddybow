'use client';

import Sidebar from './Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="pt-4 pl-20 pr-4 pb-8">
        {children}
      </main>
    </div>
  );
}
