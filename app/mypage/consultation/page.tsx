import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageSquare } from 'lucide-react';

export default async function ConsultationPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
            相談
          </h1>
          <p className="text-slate-600 text-sm">
            学習やキャリアについて相談できます
          </p>
        </header>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">相談履歴</h2>
          </div>
          <p className="text-slate-500 text-sm py-4">まだ相談がありません</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

