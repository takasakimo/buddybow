import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ダッシュボード
          </h1>
        </header>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg">
            ようこそ、{session.user.name}さん
          </p>
          <p className="mt-2 text-gray-600">
            副業リブートプログラム〜buddybow〜へようこそ
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
