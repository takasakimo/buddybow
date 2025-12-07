import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2 } from 'lucide-react';

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

  const userId = typeof session.user.id === 'string' 
    ? parseInt(session.user.id) 
    : session.user.id;

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

  // ユーザーの進捗情報を取得
  const moduleProgresses = await prisma.moduleProgress.findMany({
    where: {
      userId,
      moduleId: {
        in: training.modules.map((m) => m.id),
      },
    },
  });

  // モジュールIDで進捗をマップ
  const progressMap = new Map(moduleProgresses.map((p) => [p.moduleId, p.completed]));

  // 進捗率を計算
  const completedModules = training.modules.filter((m) => progressMap.get(m.id)).length;
  const totalModules = training.modules.length;
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/trainings"
            className="text-buddybow-orange hover:text-buddybow-orange-dark"
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
              <span className="inline-block px-3 py-1 bg-buddybow-beige-light text-buddybow-orange-dark text-sm rounded-full mb-4">
                {training.category.name}
              </span>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {training.title}
            </h1>
            {training.description && (
              <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap mb-6">
                {training.description}
              </p>
            )}
            
            {/* 進捗表示 */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900">進捗状況</h3>
                <span className="text-lg font-bold text-slate-900">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    progressPercentage === 100 ? 'bg-green-500' : 'bg-buddybow-orange'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>
                  完了: {completedModules}/{totalModules} チャプター
                </span>
                {progressPercentage === 100 && (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    完了
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">チャプター一覧</h2>
            {(session.user.role === 'FULL_ADMIN' || session.user.role === 'MANAGER') && (
              <Link
                href={`/admin/trainings/${training.id}/edit`}
                className="px-4 py-2 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark"
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
              {training.modules.map((module, index) => {
                const isCompleted = progressMap.get(module.id) || false;
                return (
                  <div
                    key={module.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 relative">
                          {isCompleted ? (
                            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-buddybow-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {module.title}
                          </h3>
                          {isCompleted && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              完了
                            </p>
                          )}
                        </div>
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
                          className={`px-4 py-2 rounded-lg text-sm ${
                            isCompleted
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-buddybow-orange text-white hover:bg-buddybow-orange-dark'
                          }`}
                        >
                          {isCompleted ? '再開' : '開始'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
