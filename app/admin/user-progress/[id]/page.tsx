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

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date;
  completed: boolean;
  completedAt: Date | null;
  order: number;
}

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  targetMonths: number;
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  createdAt: Date;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  userProgress: UserProgress | null;
  trainings: Training[];
  moduleProgresses: ModuleProgress[];
  roadmaps: Roadmap[];
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
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [isAddingRoadmap, setIsAddingRoadmap] = useState(false);
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    description: '',
    targetMonths: '6',
    startDate: '',
    endDate: '',
  });

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
    if (!selectedTraining) {
      alert('研修を選択してください');
      return;
    }

    const training = userDetail?.trainings.find((t) => t.id === selectedTraining);
    if (!training || training.modules.length === 0) {
      alert('この研修にはモジュールがありません');
      return;
    }

    setIsAddingProgress(true);
    try {
      // 選択された研修の全モジュールを完了として追加
      const promises = training.modules.map((module) =>
        fetch('/api/admin/user-progress/module', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: params.id,
            moduleId: module.id,
            completed: true,
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.ok);

      if (allSuccess) {
        alert(`${training.title}の全モジュール（${training.modules.length}件）の進捗を追加しました`);
        fetchUserDetail();
        setSelectedTraining('');
      } else {
        alert('一部の進捗の追加に失敗しました');
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

  const handleAddRoadmap = async () => {
    if (!roadmapForm.title || !roadmapForm.startDate || !roadmapForm.endDate) {
      alert('タイトル、開始日、終了日は必須です');
      return;
    }

    if (!roadmapForm.targetMonths || parseInt(roadmapForm.targetMonths) < 1) {
      alert('目標期間は1ヶ月以上を指定してください');
      return;
    }

    const startDate = new Date(roadmapForm.startDate);
    const endDate = new Date(roadmapForm.endDate);
    
    if (endDate <= startDate) {
      alert('終了日は開始日より後である必要があります');
      return;
    }

    setIsAddingRoadmap(true);
    try {
      const response = await fetch('/api/admin/user-progress/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.id,
          title: roadmapForm.title.trim(),
          description: roadmapForm.description.trim() || null,
          targetMonths: parseInt(roadmapForm.targetMonths),
          startDate: roadmapForm.startDate,
          endDate: roadmapForm.endDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('ロードマップを追加しました');
        fetchUserDetail();
        setRoadmapForm({
          title: '',
          description: '',
          targetMonths: '6',
          startDate: '',
          endDate: '',
        });
      } else {
        console.error('Roadmap creation error:', data);
        alert(data.error || 'ロードマップの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add roadmap:', error);
      alert('ロードマップの追加に失敗しました。コンソールを確認してください。');
    } finally {
      setIsAddingRoadmap(false);
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
                      onChange={(e) => setSelectedTraining(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">選択してください</option>
                      {userDetail.trainings.map((training) => {
                        const completedModulesCount = training.modules.filter((m) =>
                          userDetail.moduleProgresses.some((mp) => mp.moduleId === m.id && mp.completed)
                        ).length;
                        const totalModules = training.modules.length;
                        const isCompleted = totalModules > 0 && completedModulesCount === totalModules;
                        return (
                          <option key={training.id} value={training.id}>
                            {training.title} {isCompleted ? '(完了済み)' : `(${completedModulesCount}/${totalModules})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {selectedTraining && (
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      {(() => {
                        const training = userDetail.trainings.find((t) => t.id === selectedTraining);
                        if (!training) return null;
                        const totalModules = training.modules.length;
                        return `この研修には${totalModules}個のモジュールがあります。全モジュールを完了として追加します。`;
                      })()}
                    </div>
                  )}
                  <button
                    onClick={handleAddProgress}
                    disabled={!selectedTraining || isAddingProgress}
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

            {/* ロードマップ管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🗺️ ロードマップ管理</h2>

              {/* ロードマップを追加 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  ロードマップを追加
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      タイトル <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={roadmapForm.title}
                      onChange={(e) =>
                        setRoadmapForm({ ...roadmapForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="例: 3ヶ月で副業を始める"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      説明
                    </label>
                    <textarea
                      value={roadmapForm.description}
                      onChange={(e) =>
                        setRoadmapForm({ ...roadmapForm, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="ロードマップの説明を入力..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        目標期間（ヶ月） <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={roadmapForm.targetMonths}
                        onChange={(e) =>
                          setRoadmapForm({ ...roadmapForm, targetMonths: e.target.value })
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        開始日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={roadmapForm.startDate}
                        onChange={(e) =>
                          setRoadmapForm({ ...roadmapForm, startDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      終了日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={roadmapForm.endDate}
                      onChange={(e) =>
                        setRoadmapForm({ ...roadmapForm, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <button
                    onClick={handleAddRoadmap}
                    disabled={
                      !roadmapForm.title ||
                      !roadmapForm.startDate ||
                      !roadmapForm.endDate ||
                      isAddingRoadmap
                    }
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAddingRoadmap ? '追加中...' : 'ロードマップを追加'}
                  </button>
                </div>
              </div>

              {/* 既存のロードマップ一覧 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  ロードマップ一覧
                </h3>
                {userDetail.roadmaps.length === 0 ? (
                  <p className="text-gray-500 text-sm">ロードマップがありません</p>
                ) : (
                  <div className="space-y-4">
                    {userDetail.roadmaps.map((roadmap) => (
                      <div
                        key={roadmap.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                              {roadmap.title}
                            </h4>
                            {roadmap.description && (
                              <p className="text-xs text-gray-600 mb-2">
                                {roadmap.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                期間: {new Date(roadmap.startDate).toLocaleDateString('ja-JP')} 〜{' '}
                                {new Date(roadmap.endDate).toLocaleDateString('ja-JP')}
                              </span>
                              <span>目標: {roadmap.targetMonths}ヶ月</span>
                              <span>
                                マイルストーン: {roadmap.milestones.length}件
                              </span>
                            </div>
                          </div>
                        </div>
                        {roadmap.milestones.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">
                              マイルストーン:
                            </div>
                            <div className="space-y-1">
                              {roadmap.milestones.map((milestone) => (
                                <div
                                  key={milestone.id}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      milestone.completed
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                    }`}
                                  />
                                  <span
                                    className={
                                      milestone.completed
                                        ? 'text-gray-500 line-through'
                                        : 'text-gray-700'
                                    }
                                  >
                                    {milestone.title} (
                                    {new Date(milestone.targetDate).toLocaleDateString('ja-JP')})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

