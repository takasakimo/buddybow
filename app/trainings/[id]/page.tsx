import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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

  // 研修データを取得
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              研修が見つかりません
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-6">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {training.title}
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">研修概要</h2>
          <p className="text-gray-600 whitespace-pre-wrap">
            {training.description}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">モジュール一覧</h2>
          {training.modules.length === 0 ? (
            <p className="text-gray-600">
              この研修にはまだモジュールが登録されていません。
            </p>
          ) : (
            <div className="space-y-4">
              {training.modules.map((module) => (
                <div
                  key={module.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-lg mb-2">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      順序: {module.order}
                    </span>
                    <Link
                      href={`/trainings/${training.id}/modules/${module.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      開始する
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
