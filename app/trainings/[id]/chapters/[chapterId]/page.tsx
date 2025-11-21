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
    chapterId: string;
  };
}

export default async function ChapterDetailPage({ params }: PageProps) {
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
    notFound();
  }

  const currentModule = training.modules.find((m) => m.id === params.chapterId);

  if (!currentModule) {
    notFound();
  }

  const currentIndex = training.modules.findIndex((m) => m.id === params.chapterId);
  const previousModule = currentIndex > 0 ? training.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < training.modules.length - 1 ? training.modules[currentIndex + 1] : null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/trainings/${params.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← {training.title}に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
            <p className="text-sm opacity-90 mb-2">
              チャプター {currentIndex + 1} / {training.modules.length}
            </p>
            <h1 className="text-3xl font-bold">
              {currentModule.title}
            </h1>
          </div>

          {/* コンテンツ */}
          <div className="p-8">
            {/* 動画 */}
            {currentModule.videoUrl && (
              <div className="mb-8">
                <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <iframe
                    src={currentModule.videoUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* 画像 */}
            {currentModule.imageUrl && (
              <div className="mb-8">
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={currentModule.imageUrl}
                    alt={currentModule.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* 説明 */}
            {currentModule.description && (
              <div className="prose max-w-none mb-8">
                <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {currentModule.description}
                </div>
              </div>
            )}
          </div>

          {/* ナビゲーション */}
          <div className="border-t border-gray-200 p-6 flex justify-between">
            {previousModule ? (
              <Link
                href={`/trainings/${params.id}/chapters/${previousModule.id}`}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← 前のチャプター
              </Link>
            ) : (
              <div />
            )}

            {nextModule ? (
              <Link
                href={`/trainings/${params.id}/chapters/${nextModule.id}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                次のチャプター →
              </Link>
            ) : (
              <Link
                href={`/trainings/${params.id}`}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                研修を完了 ✓
              </Link>
            )}
          </div>
        </div>

        {/* チャプター一覧 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">チャプター一覧</h2>
          <div className="space-y-2">
            {training.modules.map((module, index) => (
              <Link
                key={module.id}
                href={`/trainings/${params.id}/chapters/${module.id}`}
                className={`block p-4 rounded-lg transition-colors ${
                  module.id === currentModule.id
                    ? 'bg-blue-50 border-2 border-blue-600'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      module.id === currentModule.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`font-medium ${
                    module.id === currentModule.id ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {module.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
