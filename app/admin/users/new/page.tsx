import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserForm from '../components/UserForm';

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  // 全権管理者のみユーザー作成可能
  const role = getUserRole();
  if (!session || role !== 'FULL_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/users"
            className="text-buddybow-orange hover:text-buddybow-orange-dark mb-4 inline-block"
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
