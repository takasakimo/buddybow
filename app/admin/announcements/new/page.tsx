import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnnouncementForm from '../components/AnnouncementForm';

export default async function NewAnnouncementPage() {
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/announcements"
            className="text-buddybow-orange hover:text-buddybow-orange-dark mb-4 inline-block"
          >
            ← お知らせ管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            お知らせ作成
          </h1>
        </header>
        <AnnouncementForm />
      </div>
    </DashboardLayout>
  );
}
