import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
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
      category: true,
    },
  });

  if (!training) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/trainings"
            className="text-blue-600 hover:text-blue-800"
          >
            ← 研修一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {training.imageUrl && (
            <div className="relative w-full h-96 bg-gray-100">
              <Image
                src={training.imageUrl}
                alt={training.title}
                fill
                className="object-contain"
              />
            </div>
          )}

          <div className="p-8">
            {training.category && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-4">
                {training.category.name}
              </span>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {training.title}
            </h1>
            {training.description && (
              <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
                {training.description}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">チャプター一覧</h2>
            {(session.user.role === 'FULL_ADMIN' || session.user.role === 'MANAGER') && (
              <Link
                href={`/admin/trainings/${training.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                チャプター追加
              </Link>
            )}
          </div>

          {training.modules.length === 0 ? (
            <p className="text-gray-900 text-center py-8">
              チャプターがまだありません
            </p>
          ) : (
            <div className="space-y-3">
              {training.modules.map((module, index) => (
                <div
                  key={module.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        序章: {module.title}
                      </h3>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {(session.user.role === 'FULL_ADMIN' || session.user.role === 'MANAGER') && (
                        <Link
                          href={`/admin/trainings/${training.id}/edit`}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          編集
                        </Link>
                      )}
                      <Link
                        href={`/trainings/${training.id}/chapters/${module.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
