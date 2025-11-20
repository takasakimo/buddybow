import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ModuleForm from '../components/ModuleForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function NewModulePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
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
    redirect('/admin/trainings');
  }

  const nextOrder = training.modules.length + 1;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            チャプター追加
          </h1>
          <p className="text-gray-600">
            研修: {training.title}
          </p>
        </header>
        <ModuleForm trainingId={params.id} nextOrder={nextOrder} />
      </div>
    </DashboardLayout>
  );
}
