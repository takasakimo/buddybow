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

  if (!session || session.user.role !== 'admin') {
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
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
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
