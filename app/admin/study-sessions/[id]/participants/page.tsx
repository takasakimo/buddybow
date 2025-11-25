import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ParticipantsPage({ params }: PageProps) {
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

  const studySession = await prisma.studySession.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!studySession) {
    notFound();
  }

  const participants = await prisma.studySessionParticipant.findMany({
    where: {
      studySessionId: params.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      appliedAt: 'desc',
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/study-sessions"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 勉強会管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            参加者一覧
          </h1>
          <p className="text-gray-600">{studySession.title}</p>
        </header>

        <div className="bg-white rounded-lg shadow">
          {participants.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              参加申し込みはまだありません
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      名前
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      メールアドレス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      申し込み日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {participant.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {participant.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {new Date(participant.appliedAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          {participant.status === 'pending' && '申込済'}
                          {participant.status === 'approved' && '承認済'}
                          {participant.status === 'cancelled' && 'キャンセル'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 参加者にZoomパスワードを送信する際は、各ユーザーのメールアドレス宛に個別に送信してください。
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
