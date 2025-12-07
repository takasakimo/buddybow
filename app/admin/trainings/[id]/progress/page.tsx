'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UserProgress {
  userId: number;
  userName: string;
  userEmail: string;
  completedModules: number;
  totalModules: number;
  progress: number;
}

interface TrainingProgress {
  training: {
    id: string;
    title: string;
    totalModules: number;
  };
  userProgresses: UserProgress[];
}

export default function TrainingProgressPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [data, setData] = useState<TrainingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  useEffect(() => {
    // 全権管理者のみアクセス可能
    const role = getUserRole();
    if (role !== 'FULL_ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (params.id) {
      fetchProgress();
    }
  }, [session, router, params.id]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/admin/trainings/${params.id}/progress`);
      if (response.ok) {
        const progressData = await response.json();
        setData(progressData);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">進捗情報が見つかりません</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/trainings"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 研修管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {data.training.title}
          </h1>
          <p className="text-gray-600">
            受講者進捗一覧
          </p>
        </header>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {data.userProgresses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">この研修を受講している受講者がいません</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      受講者数: <span className="font-semibold text-gray-900">{data.userProgresses.length}名</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      チャプター数: <span className="font-semibold text-gray-900">{data.training.totalModules}個</span>
                    </p>
                  </div>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      受講者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      進捗率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      完了数
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.userProgresses.map((userProgress) => (
                    <tr key={userProgress.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userProgress.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userProgress.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>進捗率</span>
                              <span className="font-medium">{Math.round(userProgress.progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  userProgress.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${userProgress.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {userProgress.completedModules}/{userProgress.totalModules}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/admin/user-progress/${userProgress.userId}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          マイページ管理 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

