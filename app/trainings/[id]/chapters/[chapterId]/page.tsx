import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ChapterSidebar from './components/ChapterSidebar';
import CompleteButton from './components/CompleteButton';

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

  // ユーザーの進捗を取得
  const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
  
  const moduleProgress = await prisma.moduleProgress.findMany({
    where: {
      userId: userId,
      moduleId: {
        in: training.modules.map(m => m.id),
      },
    },
  });

  const progressMap = new Map(moduleProgress.map(p => [p.moduleId, p.completed]));

  const currentIndex = training.modules.findIndex((m) => m.id === params.chapterId);
  const previousModule = currentIndex > 0 ? training.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < training.modules.length - 1 ? training.modules[currentIndex + 1] : null;

  const isCompleted = progressMap.get(currentModule.id) || false;

  return (
    <DashboardLayout>
      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* 左サイドバー - チャプター一覧 */}
        <ChapterSidebar
          training={training}
          currentModuleId={currentModule.id}
          progressMap={progressMap}
        />

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0">
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
              {isCompleted && (
                <div className="mt-3 inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  <span>✓</span>
                  <span>完了済み</span>
                </div>
              )}
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
            <div className="border-t border-gray-200 p-6 flex justify-between items-center">
              <div>
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
              </div>

              <div className="flex gap-3">
                <CompleteButton
                  moduleId={currentModule.id}
                  isCompleted={isCompleted}
                />

                {nextModule && (
                  <Link
                    href={`/trainings/${params.id}/chapters/${nextModule.id}`}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    次のチャプター →
                  </Link>
                )}

                {!nextModule && (
                  <Link
                    href={`/trainings/${params.id}`}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    研修を完了 ✓
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
