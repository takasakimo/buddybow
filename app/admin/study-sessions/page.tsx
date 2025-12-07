import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DeleteButton from './components/DeleteButton';
import { Users, Calendar, Clock, Video } from 'lucide-react';

// 日本時間に変換するヘルパー関数
function toJSTString(date: Date, format: 'date' | 'time' = 'time') {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  
  if (format === 'date') {
    return jstDate.toLocaleDateString('ja-JP', { timeZone: 'UTC' });
  }
  return jstDate.toLocaleTimeString('ja-JP', { 
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function StudySessionsPage() {
  const session = await getServerSession(authOptions);

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  // 全権管理者のみアクセス可能
  const role = getUserRole();
  if (!session || role !== 'FULL_ADMIN') {
    redirect('/dashboard');
  }

  const studySessions = await prisma.studySession.findMany({
    orderBy: {
      startTime: 'desc',
    },
  });

  // 各勉強会の参加者数を取得
  const sessionsWithCounts = await Promise.all(
    studySessions.map(async (session) => {
      const participantCount = await prisma.studySessionParticipant.count({
        where: {
          studySessionId: session.id,
        },
      });
      return {
        ...session,
        participantCount,
      };
    })
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            勉強会管理
          </h1>
          <Link
            href="/admin/study-sessions/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            新規作成
          </Link>
        </header>

        <div className="bg-white rounded-lg shadow">
          {sessionsWithCounts.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              勉強会がありません
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessionsWithCounts.map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            session.status === 'upcoming'
                              ? 'bg-blue-100 text-blue-800'
                              : session.status === 'ongoing'
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {session.status === 'upcoming' && '予定'}
                          {session.status === 'ongoing' && '開催中'}
                          {session.status === 'completed' && '完了'}
                          {session.status === 'cancelled' && 'キャンセル'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {session.participantCount}名
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        {session.title}
                      </h3>
                      {session.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {toJSTString(session.startTime, 'date')}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {toJSTString(session.startTime)} - {toJSTString(session.endTime)}
                        </p>
                        {session.zoomId && (
                          <p className="flex items-center gap-1.5">
                            <Video className="w-4 h-4" />
                            Zoom ID: {session.zoomId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/admin/study-sessions/${session.id}/participants`}
                        className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded"
                      >
                        参加者
                      </Link>
                      <Link
                        href={`/admin/study-sessions/${session.id}/edit`}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        編集
                      </Link>
                      <DeleteButton id={session.id} title={session.title} />
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
