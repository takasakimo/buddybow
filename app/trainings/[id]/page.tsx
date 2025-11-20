import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TrainingDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const training = await prisma.training.findUnique({
    where: {
      id: params.id,
    },
    include: {
      modules: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!training) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">研修が見つかりません</h1>
            <p className="text-gray-600 mb-4">
              指定された研修は存在しません。
            </p>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = session.user.role === 'admin';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Link
            href={isAdmin ? '/admin/trainings' : '/dashboard'}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← {isAdmin ? '研修管理' : 'ダッシュボード'}に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {training.title}
          </h1>
          {training.description && (
            <p className="text-gray-600">{training.description}</p>
          )}
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">チャプター一覧</h2>
            {isAdmin && (
              <Link
                href={`/admin/trainings/${training.id}/modules/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                チャプター追加
              </Link>
            )}
          </div>

          {training.modules.length === 0 ? (
            <p className="text-gray-600">
              この研修にはまだチャプターが登録されていません。
            </p>
          ) : (
            <div className="space-y-4">
              {training.modules.map((moduleData, index) => (
                <div
                  key={moduleData.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          チャプター {index + 1}
                        </span>
                        <h3 className="font-semibold text-lg">
                          {moduleData.title}
                        </h3>
                      </div>
                      {moduleData.description && (
                        <p className="text-gray-600 text-sm">
                          {moduleData.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <Link
                          href={`/admin/trainings/${training.id}/modules/${moduleData.id}/edit`}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          編集
                        </Link>
                      )}
                      <Link
                        href={`/trainings/${training.id}/modules/${moduleData.id}`}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        開始
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
