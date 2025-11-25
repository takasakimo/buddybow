'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UserProgress {
  currentPhase: string;
  overallProgress: number;
}

interface Training {
  id: string;
  title: string;
  modules: { id: string; title: string }[];
}

interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  trainingTitle: string;
  completed: boolean;
  completedAt: Date | null;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  userProgress: UserProgress | null;
  trainings: Training[];
  moduleProgresses: ModuleProgress[];
  roadmaps: { id: string; title: string }[];
  dailyReports: { id: string; date: Date; type: string }[];
  consultations: { id: string; title: string; status: string }[];
  achievements: { id: string; title: string; badgeType: string }[];
}

export default function UserProgressDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [isAddingProgress, setIsAddingProgress] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (params.id) {
      fetchUserDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, router, params.id]);

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`/api/admin/user-progress/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserDetail(data);
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProgress = async () => {
    if (!selectedModule) {
      alert('モジュールを選択してください');
      return;
    }

    setIsAddingProgress(true);
    try {
      const response = await fetch('/api/admin/user-progress/module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.id,
          moduleId: selectedModule,
          completed: true,
        }),
      });

      if (response.ok) {
        alert('研修進捗を追加しました');
        fetchUserDetail();
        setSelectedTraining('');
        setSelectedModule('');
      } else {
        const data = await response.json();
        alert(data.error || '進捗の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add progress:', error);
      alert('進捗の追加に失敗しました');
    } finally {
      setIsAddingProgress(false);
    }
  };

  const handleUpdateProgress = async (moduleId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/admin/user-progress/module', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.id,
          moduleId,
          completed,
        }),
      });

      if (response.ok) {
        fetchUserDetail();
      } else {
        const data = await response.json();
        alert(data.error || '進捗の更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('進捗の更新に失敗しました');
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

  if (!userDetail) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">ユーザー情報が見つかりません</p>
        </div>
      </DashboardLayout>
    );
  }

  const availableModules = selectedTraining
    ? userDetail.trainings
        .find((t) => t.id === selectedTraining)
        ?.modules.filter(
          (m) => !userDetail.moduleProgresses.some((mp) => mp.moduleId === m.id)
        ) || []
    : [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/user-progress"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 受講者マイページ管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userDetail.name} さんのマイページ管理
          </h1>
          <p className="text-gray-600">{userDetail.email}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム */}
          <div className="lg:col-span-2 space-y-6">
            {/* 進捗状況 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 進捗状況</h2>
              {userDetail.userProgress ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{userDetail.userProgress.currentPhase}</span>
                        <span>{userDetail.userProgress.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${userDetail.userProgress.overallProgress}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">進捗情報が設定されていません</p>
              )}
            </div>

            {/* 研修進捗管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📚 研修進捗管理</h2>

              {/* 研修進捗を追加 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  研修進捗を追加
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      研修を選択
                    </label>
                    <select
                      value={selectedTraining}
                      onChange={(e) => {
                        setSelectedTraining(e.target.value);
                        setSelectedModule('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">選択してください</option>
                      {userDetail.trainings.map((training) => (
                        <option key={training.id} value={training.id}>
                          {training.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedTraining && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        モジュールを選択
                      </label>
                      <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">選択してください</option>
                        {availableModules.map((module) => (
                          <option key={module.id} value={module.id}>
                            {module.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={handleAddProgress}
                    disabled={!selectedModule || isAddingProgress}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAddingProgress ? '追加中...' : '進捗を追加'}
                  </button>
                </div>
              </div>

              {/* 既存の進捗一覧 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  進捗一覧
                </h3>
                {userDetail.moduleProgresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">進捗情報がありません</p>
                ) : (
                  <div className="space-y-2">
                    {userDetail.moduleProgresses.map((progress) => (
                      <div
                        key={progress.moduleId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {progress.trainingTitle} - {progress.moduleTitle}
                          </div>
                          {progress.completedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              完了日: {new Date(progress.completedAt).toLocaleDateString('ja-JP')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={progress.completed}
                              onChange={(e) =>
                                handleUpdateProgress(progress.moduleId, e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                              {progress.completed ? '完了' : '未完了'}
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-6">
            {/* マイページ情報サマリー */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">📊 マイページ情報</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">🗺️ ロードマップ</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userDetail.roadmaps.length}件
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">📝 日報</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userDetail.dailyReports.length}件
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">💬 相談</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userDetail.consultations.length}件
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">🏆 達成バッジ</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userDetail.achievements.length}件
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 最近の活動 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">📝 最近の日報</h2>
              {userDetail.dailyReports.length === 0 ? (
                <p className="text-gray-500 text-sm">日報がありません</p>
              ) : (
                <div className="space-y-2">
                  {userDetail.dailyReports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="text-sm text-gray-600 border-b pb-2 last:border-b-0"
                    >
                      {new Date(report.date).toLocaleDateString('ja-JP')} - {report.type}
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

