import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ModuleForm from '../../components/ModuleForm';

interface PageProps {
  params: {
    id: string;
    moduleId: string;
  };
}

export default async function EditModulePage({ params }: PageProps) {
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

  const moduleData = await prisma.module.findUnique({
    where: {
      id: params.moduleId,
    },
    include: {
      training: true,
    },
  });

  if (!moduleData) {
    notFound();
  }

  const training = await prisma.training.findUnique({
    where: {
      id: params.id,
    },
    include: {
      modules: true,
    },
  });

  if (!training) {
    notFound();
  }

  const nextOrder = training.modules.length + 1;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href={`/trainings/${params.id}`}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← {training.title}に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            チャプター編集
          </h1>
          <p className="text-gray-600">
            研修: {training.title}
          </p>
        </header>
        <ModuleForm trainingId={params.id} nextOrder={nextOrder} initialData={moduleData} />
      </div>
    </DashboardLayout>
  );
}
