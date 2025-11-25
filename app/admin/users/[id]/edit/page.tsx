import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserForm from '../../components/UserForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditUserPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(params.id),
    },
    include: {
      assignedAdmin: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/users"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← ユーザー管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            ユーザー編集
          </h1>
        </header>
        <UserForm
          initialData={{
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            assignedAdminId: user.assignedAdminId?.toString() || '',
          }}
        />
      </div>
    </DashboardLayout>
  );
}
