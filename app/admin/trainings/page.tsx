import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function AdminTrainingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const trainings = await prisma.training.findMany({
    include: {
      modules: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            研修管理
          </h1>
          <Link
            href="/admin/trainings/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            新規作成
          </Link>
        </header>
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              研修が登録されていません。新規作成ボタンから研修を作成してください。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                {training.imageUrl ? (
                  <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={training.imageUrl}
                      alt={training.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <span className="text-4xl text-gray-400">📚</span>
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {training.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {training.description || '説明なし'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    モジュール数: {training.modules.length}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/trainings/${training.id}/edit`}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-center rounded-lg hover:bg-gray-300"
                    >
                      編集
                    </Link>
                    <Link
                      href={`/trainings/${training.id}`}
                      className="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700"
                    >
                      表示
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
