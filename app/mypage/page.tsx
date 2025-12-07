import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Target, Trophy, Map, FileText, MessageSquare, Calendar, TrendingUp, CheckCircle2, BookOpen } from 'lucide-react';
import Image from 'next/image';

interface TrainingProgress {
  trainingId: string;
  trainingTitle: string;
  trainingDescription: string | null;
  trainingImageUrl: string | null;
  totalModules: number;
  completedModules: number;
  progress: number;
  assignedAt: Date;
  deadline: Date | null;
}

export default async function MyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id as string);

  // プログレス情報取得
  let userProgress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  // 初回アクセス時はプログレスを作成
  if (!userProgress) {
    userProgress = await prisma.userProgress.create({
      data: {
        userId,
        currentPhase: '診断',
        overallProgress: 0,
      },
    });
  }

  // ユーザーのモジュール進捗を取得
  const moduleProgresses = await prisma.moduleProgress.findMany({
    where: { userId },
    select: {
      moduleId: true,
      completed: true,
      createdAt: true,
      deadline: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // モジュールIDを取得（重複を除去）
  const uniqueModuleIds = Array.from(new Set(moduleProgresses.map((mp) => mp.moduleId)));

  // モジュール情報と研修情報を取得
  const modules = uniqueModuleIds.length > 0
    ? await prisma.module.findMany({
        where: {
          id: {
            in: uniqueModuleIds,
          },
        },
        include: {
          training: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              modules: {
                select: {
                  id: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
      })
    : [];

  // 研修単位でグループ化して進捗率を計算
  const trainingMap: Record<string, TrainingProgress> = {};

  // まず、各研修の基本情報を設定
  modules.forEach((module) => {
    const trainingId = module.training.id;
    if (!trainingMap[trainingId]) {
      // この研修の最初のモジュールの進捗を取得（追加日と期日を取得するため）
      const firstModuleProgress = moduleProgresses.find((mp) => mp.moduleId === module.id);
      trainingMap[trainingId] = {
        trainingId,
        trainingTitle: module.training.title,
        trainingDescription: module.training.description,
        trainingImageUrl: module.training.imageUrl,
        totalModules: module.training.modules.length,
        completedModules: 0,
        progress: 0,
        assignedAt: firstModuleProgress?.createdAt || new Date(),
        deadline: firstModuleProgress?.deadline || null,
      };
    }
  });

  // 完了モジュール数をカウント
  modules.forEach((module) => {
    const trainingId = module.training.id;
    const progress = moduleProgresses.find((mp) => mp.moduleId === module.id);
    if (progress?.completed) {
      const training = trainingMap[trainingId];
      if (training) {
        training.completedModules++;
      }
    }
  });

  // 進捗率を計算
  Object.values(trainingMap).forEach((training) => {
    training.progress = training.totalModules > 0
      ? (training.completedModules / training.totalModules) * 100
      : 0;
  });

  const userTrainings = Object.values(trainingMap);

  // 各種データ取得
  const [roadmaps, interviews, recentReports, consultations, achievements, motivationMessages] = await Promise.all([
    prisma.roadmap.findMany({
      where: { userId },
      include: { milestones: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }),
    prisma.interview.findMany({
      where: { userId },
      orderBy: { interviewDate: 'desc' },
      take: 10,
    }),
    prisma.dailyReport.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.consultation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.motivationMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }),
  ]);

  const activeRoadmap = roadmaps[0];
  const completedMilestones = activeRoadmap?.milestones.filter((m) => m.completed).length || 0;
  const totalMilestones = activeRoadmap?.milestones.length || 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
            マイページ
          </h1>
          <p className="text-slate-600 text-sm">
            学習の進捗と成果を確認できます
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: プログレス管理 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 現在のフェーズ */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">現在のフェーズ</h2>
              </div>
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-600 mb-2.5">
                  <span className="font-medium">{userProgress.currentPhase}</span>
                  <span className="font-semibold text-slate-900">{userProgress.overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${userProgress.overallProgress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['診断', 'ロードマップ作成', '実践', '成長'].map((phase) => (
                  <div
                    key={phase}
                    className={`py-2.5 px-3 rounded-lg text-center text-xs font-medium transition-all ${
                      userProgress.currentPhase === phase
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {phase}
                  </div>
                ))}
              </div>
            </div>

            {/* 達成バッジ */}
            {achievements.length > 0 && (
              <div className="card p-6">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-slate-700" />
                    <h2 className="text-lg font-semibold text-slate-900">達成バッジ</h2>
                  </div>
                  <Link href="/mypage/achievements" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    すべて見る →
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {achievements.slice(0, 8).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex flex-col items-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all cursor-pointer group"
                      title={achievement.description || ''}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs text-slate-700 text-center line-clamp-2 font-medium">
                        {achievement.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ロードマップ進捗 */}
            {activeRoadmap && (
              <div className="card p-6">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-slate-700" />
                    <h2 className="text-lg font-semibold text-slate-900">ロードマップ進捗</h2>
                  </div>
                  <Link href="/mypage/roadmap" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    詳細を見る →
                  </Link>
                </div>
                <h3 className="font-semibold mb-1.5 text-slate-900">{activeRoadmap.title}</h3>
                <p className="text-sm text-slate-600 mb-5 leading-relaxed">{activeRoadmap.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-700 font-medium min-w-[3rem] text-right">
                    {completedMilestones}/{totalMilestones}
                  </span>
                </div>
              </div>
            )}

            {/* 受講中の研修 */}
            <div className="card p-6">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-slate-700" />
                    <h2 className="text-lg font-semibold text-slate-900">受講中の研修</h2>
                  </div>
                  <Link href="/trainings" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    すべて見る →
                  </Link>
                </div>
                {userTrainings.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">受講中の研修はありません</p>
                ) : (
                  <div className="space-y-4">
                    {userTrainings.map((training) => (
                    <Link
                      key={training.trainingId}
                      href={`/trainings/${training.trainingId}`}
                      className="block p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {training.trainingImageUrl ? (
                          <div className="relative w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                            <Image
                              src={training.trainingImageUrl}
                              alt={training.trainingTitle}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1">
                            {training.trainingTitle}
                          </h3>
                          {training.trainingDescription && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                              {training.trainingDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>追加日: {new Date(training.assignedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            {training.deadline && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className={new Date(training.deadline) < new Date() ? 'text-red-600 font-medium' : ''}>
                                  期日: {new Date(training.deadline).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>進捗率</span>
                                <span className="font-medium">{Math.round(training.progress)}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    training.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${training.progress}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-xs text-slate-600 min-w-[3rem] text-right">
                              {training.completedModules}/{training.totalModules}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  </div>
                )}
              </div>

            {/* 最近の活動 */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-900">最近の記録</h2>
                </div>
                <Link href="/mypage/reports" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                  すべて見る →
                </Link>
              </div>
              {recentReports.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">まだ記録がありません</p>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-b-0 last:pb-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {report.type === 'daily' ? (
                          <Calendar className="w-4 h-4 text-slate-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-sm font-medium text-slate-900">
                            {new Date(report.date).toLocaleDateString('ja-JP')}
                          </span>
                          {report.workHours && (
                            <span className="text-xs text-slate-500 font-medium">
                              {report.workHours}時間
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {report.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-6">
            {/* 応援メッセージ */}
            {motivationMessages[0] && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-medium p-6 text-white">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  メッセージ
                </h2>
                <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed mb-4">
                  {motivationMessages[0].message}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(motivationMessages[0].createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}

            {/* クイックアクション */}
            <div className="card p-6">
              <h2 className="text-base font-semibold mb-4 text-slate-900">クイックアクション</h2>
              <div className="space-y-2.5">
                <Link
                  href="/mypage/reports/new"
                  className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 text-center font-medium text-sm transition-all duration-200 shadow-sm hover:shadow"
                >
                  今日の記録をつける
                </Link>
                <Link
                  href="/mypage/consultation"
                  className="block w-full py-3 px-4 bg-white text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-center font-medium text-sm transition-all duration-200 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow"
                >
                  相談する
                </Link>
                <Link
                  href="/mypage/diagnosis"
                  className="block w-full py-3 px-4 bg-white text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-center font-medium text-sm transition-all duration-200 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow"
                >
                  診断を見る
                </Link>
              </div>
            </div>

            {/* 相談履歴 */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-700" />
                  <h2 className="text-base font-semibold text-slate-900">相談履歴</h2>
                </div>
                <Link href="/mypage/consultation" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                  すべて見る →
                </Link>
              </div>
              {consultations.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">まだ相談がありません</p>
              ) : (
                <div className="space-y-3">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="pb-3 border-b border-slate-200 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                            consultation.status === 'answered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : consultation.status === 'closed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {consultation.status === 'answered' && '回答済み'}
                          {consultation.status === 'closed' && '完了'}
                          {consultation.status === 'pending' && '回答待ち'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 line-clamp-1 mb-1">
                        {consultation.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(consultation.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 面談履歴 */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-700" />
                  <h2 className="text-base font-semibold text-slate-900">面談履歴</h2>
                </div>
              </div>
              {interviews.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">まだ面談がありません</p>
              ) : (
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="pb-3 border-b border-slate-200 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 mb-1.5">
                            {new Date(interview.interviewDate).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          {interview.content && (
                            <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                              {interview.content}
                            </p>
                          )}
                          {interview.pdfUrl && (
                            <a
                              href={interview.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-medium transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              PDFを表示
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
