import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnnouncementForm from '../components/AnnouncementForm';

export default async function NewAnnouncementPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/announcements"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
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
