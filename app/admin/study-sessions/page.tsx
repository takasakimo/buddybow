import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function StudySessionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            勉強会管理
          </h1>
          <Link
            href="/admin/study-sessions/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            新規作成
          </Link>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-900">勉強会管理ページ（開発中）</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
