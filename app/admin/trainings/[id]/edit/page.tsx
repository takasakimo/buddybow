import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrainingForm from '../../components/TrainingForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditTrainingPage({ params }: PageProps) {
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

  const training = await prisma.training.findUnique({
    where: {
      id: params.id,
    },
    include: {
      modules: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!training) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/trainings"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 研修管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            研修編集
          </h1>
        </header>
        <TrainingForm initialData={training} />
      </div>
    </DashboardLayout>
  );
}
