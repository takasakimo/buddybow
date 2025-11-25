import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TrainingForm from '../components/TrainingForm';

export default async function NewTrainingPage() {
  const session = await getServerSession(authOptions);

  // 全権管理者のみアクセス可能
  if (!session || session.user.role !== 'FULL_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            研修作成
          </h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        <TrainingForm />
      </main>
    </div>
  );
}
