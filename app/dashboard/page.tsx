import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudySessionCard from './components/StudySessionCard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'admin';
  const userId = typeof session.user.id === 'string' 
    ? parseInt(session.user.id) 
    : session.user.id;

  // データ取得
  const [trainings, announcements, upcomingStudySessions, myParticipations] = await Promise.all([
    prisma.training.findMany({
      include: {
        modules: true,
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    }),
    prisma.announcement.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 5,
    }),
    prisma.studySession.findMany({
      where: {
        status: 'upcoming',
        startTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 3,
    }),
    prisma.studySessionParticipant.findMany({
      where: {
        userId,
      },
      select: {
        studySessionId: true,
      },
    }),
  ]);

  const participatingSessionIds = new Set(myParticipations.map(p => p.studySessionId));

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ダッシュボード
          </h1>
          <p className="text-gray-600">
            こんにちは、{session.user.name}さん
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* クイックアクション */}
          {isAdmin ? (
            <>
              <Link
                href="/admin/users"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                    👥
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ユーザー管理</h3>
                    <p className="text-sm text-gray-600">ユーザーの管理</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/trainings"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">研修管理</h3>
                    <p className="text-sm text-gray-600">研修の作成・編集</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/categories"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                    🏷️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">カテゴリ管理</h3>
                    <p className="text-sm text-gray-600">カテゴリの管理</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/user-progress"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                    📊
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">受講者マイページ管理</h3>
                    <p className="text-sm text-gray-600">ユーザーの進捗を管理</p>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/mypage"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">マイページ</h3>
                    <p className="text-sm text-gray-600">進捗を確認</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/trainings"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                    📚
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">研修一覧</h3>
                    <p className="text-sm text-gray-600">研修を受講</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/mypage/reports/new"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                    📝
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">日報作成</h3>
                    <p className="text-sm text-gray-600">今日の記録</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム */}
          <div className="lg:col-span-2 space-y-6">
            {/* お知らせ */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                  📢 お知らせ
                </h2>
                {isAdmin && (
                  <Link href="/admin/announcements" className="text-blue-600 text-sm">
                    管理
                  </Link>
                )}
              </div>
              {announcements.length === 0 ? (
                <p className="text-gray-600 text-sm">お知らせはありません</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="pb-3 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 px-2 py-1 text-xs rounded ${
                            announcement.category === 'news'
                              ? 'bg-blue-100 text-blue-800'
                              : announcement.category === 'event'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {announcement.category === 'news' && 'ニュース'}
                          {announcement.category === 'event' && 'イベント'}
                          {announcement.category === 'update' && 'アップデート'}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 text-gray-900">{announcement.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(announcement.publishedAt).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 最近の研修 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">📚 最近の研修</h2>
                <Link href="/trainings" className="text-blue-600 text-sm">
                  すべて見る
                </Link>
              </div>
              {trainings.length === 0 ? (
                <p className="text-gray-600 text-sm">研修がありません</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trainings.map((training) => (
                    <Link
                      key={training.id}
                      href={`/trainings/${training.id}`}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {training.imageUrl ? (
                        <div className="relative w-full h-32 bg-gray-100">
                          <Image
                            src={training.imageUrl}
                            alt={training.title}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                      <div className="p-4">
                        {training.category && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mb-2">
                            {training.category.name}
                          </span>
                        )}
                        <h3 className="font-semibold line-clamp-1 mb-1 text-gray-900">
                          {training.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          チャプター数: {training.modules.length}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-6">
            {/* 勉強会 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">🎓 勉強会</h2>
                {isAdmin && (
                  <Link href="/admin/study-sessions" className="text-blue-600 text-sm">
                    管理
                  </Link>
                )}
              </div>
              {upcomingStudySessions.length === 0 ? (
                <p className="text-gray-600 text-sm">予定されている勉強会はありません</p>
              ) : (
                <div className="space-y-3">
                  {upcomingStudySessions.map((session) => (
                    <StudySessionCard
                      key={session.id}
                      session={session}
                      isParticipating={participatingSessionIds.has(session.id)}
                    />
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
