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
    moduleId: string;
  };
}

export default async function ModuleDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const currentModule = await prisma.module.findUnique({
    where: {
      id: params.moduleId,
    },
    include: {
      training: {
        include: {
          modules: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
    },
  });

  if (!currentModule) {
    notFound();
  }

  const training = currentModule.training;
  const currentIndex = training.modules.findIndex(m => m.id === params.moduleId);
  const prevModule = currentIndex > 0 ? training.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < training.modules.length - 1 ? training.modules[currentIndex + 1] : null;

  // 動画URLの変換
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo (限定公開対応)
    // https://vimeo.com/1138786209/32ff031622 形式
    const vimeoPrivateMatch = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
    if (vimeoPrivateMatch) {
      return `https://player.vimeo.com/video/${vimeoPrivateMatch[1]}?h=${vimeoPrivateMatch[2]}`;
    }
    
    // Vimeo (通常)
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  const embedUrl = currentModule.videoUrl ? getEmbedUrl(currentModule.videoUrl) : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="mb-8">
          <Link
            href={`/trainings/${params.id}`}
            className="text-buddybow-orange hover:text-buddybow-orange-dark mb-4 inline-block"
          >
            ← {training.title}に戻る
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-500">
              チャプター {currentIndex + 1} / {training.modules.length}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentModule.title}
          </h1>
        </header>

        {/* サムネイル画像 */}
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

        {/* 動画 */}
        {embedUrl && (
          <div className="mb-8">
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* 説明 */}
        {currentModule.description && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">チャプター内容</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {currentModule.description}
            </p>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex justify-between items-center">
          {prevModule ? (
            <Link
              href={`/trainings/${params.id}/modules/${prevModule.id}`}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← 前のチャプター
            </Link>
          ) : (
            <div></div>
          )}

          {nextModule ? (
            <Link
              href={`/trainings/${params.id}/modules/${nextModule.id}`}
              className="px-6 py-3 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark transition-colors"
            >
              次のチャプター →
            </Link>
          ) : (
            <Link
              href={`/trainings/${params.id}`}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              研修を完了
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
