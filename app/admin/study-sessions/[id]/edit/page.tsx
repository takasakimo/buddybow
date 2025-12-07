import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudySessionForm from '../../components/StudySessionForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditStudySessionPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  // 全権管理者のみアクセス可能
  const role = getUserRole();
  if (!session || role !== 'FULL_ADMIN') {
    redirect('/dashboard');
  }

  const studySession = await prisma.studySession.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!studySession) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/study-sessions"
            className="text-buddybow-orange hover:text-buddybow-orange-dark mb-4 inline-block"
          >
            ← 勉強会管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            勉強会編集
          </h1>
        </header>
        <StudySessionForm
          initialData={{
            id: studySession.id,
            title: studySession.title,
            description: studySession.description,
            startTime: studySession.startTime.toISOString(),
            endTime: studySession.endTime.toISOString(),
            zoomId: studySession.zoomId,
          }}
        />
      </div>
    </DashboardLayout>
  );
}
