import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudySessionForm from '../components/StudySessionForm';

export default async function NewStudySessionPage() {
  const session = await getServerSession(authOptions);

  // 全権管理者のみアクセス可能
  if (!session || session.user.role !== 'FULL_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/study-sessions"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 勉強会管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            勉強会作成
          </h1>
        </header>
        <StudySessionForm />
      </div>
    </DashboardLayout>
  );
}
