import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function MyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // プログレス情報取得
  let userProgress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  // 初回アクセス時はプログレスを作成
  if (!userProgress) {
    userProgress = await prisma.userProgress.create({
      data: {
        userId: session.user.id,
        currentPhase: '診断',
        overallProgress: 0,
      },
    });
  }

  // 各種データ取得
  const [diagnoses, roadmaps, recentReports, consultations, achievements, motivationMessages] = await Promise.all([
    prisma.diagnosis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }),
    prisma.roadmap.findMany({
      where: { userId: session.user.id },
      include: { milestones: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }),
    prisma.dailyReport.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.consultation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.achievement.findMany({
      where: { userId: session.user.id },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.motivationMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }),
  ]);

  const latestDiagnosis = diagnoses[0];
  const activeRoadmap = roadmaps[0];
  const completedMilestones = activeRoadmap?.milestones.filter(m => m.completed).length || 0;
  const totalMilestones = activeRoadmap?.milestones.length || 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            マイページ
          </h1>
          <p className="text-gray-600">
            あなたの成長を一緒に見守ります 🌱
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: プログレス管理 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 現在のフェーズ */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 現在のフェーズ</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{userProgress.currentPhase}</span>
                    <span>{userProgress.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${userProgress.overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                {['診断', 'ロードマップ作成', '実践', '成長'].map((phase) => (
                  <div
                    key={phase}
                    className={`flex-1 py-2 px-3 rounded text-center ${
                      userProgress.currentPhase === phase
                        ? 'bg-blue-100 text-blue-800 font-semibold'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {phase}
                  </div>
                ))}
              </div>
            </div>

            {/* 達成バッジ */}
            {achievements.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">🏆 達成バッジ</h2>
                  <Link href="/mypage/achievements" className="text-blue-600 text-sm">
                    すべて見る
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {achievements.slice(0, 8).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex flex-col items-center p-3 bg-gray-50 rounded-lg"
                      title={achievement.description || ''}
                    >
                      <span className="text-3xl mb-2">
                        {achievement.badgeType === 'milestone' && '🎯'}
                        {achievement.badgeType === 'streak' && '🔥'}
                        {achievement.badgeType === 'revenue' && '💰'}
                        {achievement.badgeType === 'study' && '📚'}
                      </span>
                      <span className="text-xs text-gray-600 text-center line-clamp-2">
                        {achievement.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ロードマップ進捗 */}
            {activeRoadmap && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">🗺️ ロードマップ進捗</h2>
                  <Link href="/mypage/roadmap" className="text-blue-600 text-sm">
                    詳細を見る
                  </Link>
                </div>
                <h3 className="font-semibold mb-2">{activeRoadmap.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{activeRoadmap.description}</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {completedMilestones}/{totalMilestones}
                  </span>
                </div>
              </div>
            )}

            {/* 最近の活動 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📝 最近の記録</h2>
                <Link href="/mypage/reports" className="text-blue-600 text-sm">
                  すべて見る
                </Link>
              </div>
              {recentReports.length === 0 ? (
                <p className="text-gray-600 text-sm">まだ記録がありません</p>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <span className="text-2xl">
                        {report.type === 'daily' ? '📅' : '📊'}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">
                            {new Date(report.date).toLocaleDateString('ja-JP')}
                          </span>
                          {report.workHours && (
                            <span className="text-xs text-gray-500">
                              {report.workHours}時間
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
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
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  💪 応援メッセージ
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {motivationMessages[0].message}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  {new Date(motivationMessages[0].createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}

            {/* クイックアクション */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">⚡ クイックアクション</h2>
              <div className="space-y-2">
                <Link
                  href="/mypage/reports/new"
                  className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  📝 今日の記録をつける
                </Link>
                <Link
                  href="/mypage/consultation"
                  className="block w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
                >
                  💬 相談する
                </Link>
                <Link
                  href="/mypage/diagnosis"
                  className="block w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center"
                >
                  🔍 診断を見る
                </Link>
              </div>
            </div>

            {/* 相談履歴 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">💬 相談履歴</h2>
                <Link href="/mypage/consultation" className="text-blue-600 text-sm">
                  すべて見る
                </Link>
              </div>
              {consultations.length === 0 ? (
                <p className="text-gray-600 text-sm">まだ相談がありません</p>
              ) : (
                <div className="space-y-3">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="pb-3 border-b last:border-b-0">
                      <div className="flex items-start gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            consultation.status === 'answered'
                              ? 'bg-green-100 text-green-800'
                              : consultation.status === 'closed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {consultation.status === 'answered' && '回答済み'}
                          {consultation.status === 'closed' && '完了'}
                          {consultation.status === 'pending' && '回答待ち'}
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">
                        {consultation.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(consultation.createdAt).toLocaleDateString('ja-JP')}
                      </p>
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
