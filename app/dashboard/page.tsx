import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudySessionCard from './components/StudySessionCard';
import { Users, Settings, Tag, BarChart3, User, BookOpen, FileText, Bell, GraduationCap } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session.user.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  const role = getUserRole();
  const isAdmin = role === 'FULL_ADMIN' || role === 'MANAGER';
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
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
            ダッシュボード
          </h1>
          <p className="text-slate-600 text-sm">
            {session.user.name}さん、おかえりなさい
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* クイックアクション */}
          {isAdmin ? (
            <>
              <Link
                href="/admin/users"
                className="card card-hover p-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Users className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">ユーザー管理</h3>
                    <p className="text-sm text-slate-600">ユーザーの管理</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/trainings"
                className="card card-hover p-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Settings className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">研修管理</h3>
                    <p className="text-sm text-slate-600">研修の作成・編集</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/categories"
                className="card card-hover p-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Tag className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">カテゴリ管理</h3>
                    <p className="text-sm text-slate-600">カテゴリの管理</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/user-progress"
                className="card card-hover p-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <BarChart3 className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">受講者マイページ管理</h3>
                    <p className="text-sm text-slate-600">ユーザーの進捗を管理</p>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/mypage"
                className="card card-hover p-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <User className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">マイページ</h3>
                    <p className="text-sm text-slate-600">進捗を確認</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/trainings"
                className="card card-hover p-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <BookOpen className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">研修一覧</h3>
                    <p className="text-sm text-slate-600">研修を受講</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/mypage/reports/new"
                className="card card-hover p-6 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <FileText className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">日報作成</h3>
                    <p className="text-sm text-slate-600">今日の記録</p>
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
            <div className="card p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-900">お知らせ</h2>
                </div>
                {isAdmin && (
                  <Link href="/admin/announcements" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    管理 →
                  </Link>
                )}
              </div>
              {announcements.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">お知らせはありません</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="pb-4 border-b border-slate-200 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                            announcement.category === 'news'
                              ? 'bg-blue-100 text-blue-700'
                              : announcement.category === 'event'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {announcement.category === 'news' && 'ニュース'}
                          {announcement.category === 'event' && 'イベント'}
                          {announcement.category === 'update' && 'アップデート'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium mb-1.5 text-slate-900">{announcement.title}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-2">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-slate-500">
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
            <div className="card p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-900">最近の研修</h2>
                </div>
                <Link href="/trainings" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                  すべて見る →
                </Link>
              </div>
              {trainings.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">研修がありません</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trainings.map((training) => (
                    <Link
                      key={training.id}
                      href={`/trainings/${training.id}`}
                      className="card card-hover overflow-hidden group"
                    >
                      {training.imageUrl ? (
                        <div className="relative w-full h-32 bg-slate-100">
                          <Image
                            src={training.imageUrl}
                            alt={training.title}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div className="p-4">
                        {training.category && (
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium mb-2.5">
                            {training.category.name}
                          </span>
                        )}
                        <h3 className="font-semibold line-clamp-1 mb-1 text-slate-900 group-hover:text-slate-700 transition-colors">
                          {training.title}
                        </h3>
                        <p className="text-xs text-slate-500">
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
            <div className="card p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-slate-700" />
                  <h2 className="text-base font-semibold text-slate-900">勉強会</h2>
                </div>
                {isAdmin && (
                  <Link href="/admin/study-sessions" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    管理 →
                  </Link>
                )}
              </div>
              {upcomingStudySessions.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">予定されている勉強会はありません</p>
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
