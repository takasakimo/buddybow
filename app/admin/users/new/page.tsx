import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserForm from '../components/UserForm';

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
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
            ユーザー作成
          </h1>
        </header>
        <UserForm />
      </div>
    </DashboardLayout>
  );
}
