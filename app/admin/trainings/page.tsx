import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              研修管理
            </h1>
            <Link
              href="/admin/trainings/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              新規作成
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              研修が登録されていません。新規作成ボタンから研修を作成してください。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trainings.map((training) => (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">
                      {training.title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {training.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      モジュール数: {training.modules.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/trainings/${training.id}/edit`}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      編集
                    </Link>
                    <Link
                      href={`/trainings/${training.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      表示
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
