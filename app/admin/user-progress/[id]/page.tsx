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

interface Interview {
  id: string;
  interviewDate: Date;
  content: string | null;
  pdfUrl: string | null;
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
  interviews: Interview[];
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
  const [isAddingInterview, setIsAddingInterview] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interviewDate: '',
    content: '',
    pdfFile: null as File | null,
  });
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  useEffect(() => {
    // 全権管理者または担当者のみアクセス可能
    const role = getUserRole();
    if (role !== 'FULL_ADMIN' && role !== 'MANAGER') {
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
        alert(`${training.title}を受講者のマイページに追加しました`);
        fetchUserDetail();
        setSelectedTraining('');
      } else {
        alert('研修の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add progress:', error);
      alert('進捗の追加に失敗しました');
    } finally {
      setIsAddingProgress(false);
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

  const handlePdfUpload = async (file: File): Promise<string | null> => {
    if (!file.type.includes('pdf')) {
      alert('PDFファイルを選択してください');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください');
      return null;
    }

    setIsUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('PDF upload error:', error);
      alert('PDFのアップロードに失敗しました');
      return null;
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleAddInterview = async () => {
    if (!interviewForm.interviewDate) {
      alert('面談日を選択してください');
      return;
    }

    if (!interviewForm.content && !interviewForm.pdfFile) {
      alert('面談内容（テキスト）またはPDFファイルのいずれかは必須です');
      return;
    }

    setIsAddingInterview(true);
    try {
      let pdfUrl: string | null = null;

      // PDFファイルをアップロード
      if (interviewForm.pdfFile) {
        pdfUrl = await handlePdfUpload(interviewForm.pdfFile);
        if (!pdfUrl) {
          setIsAddingInterview(false);
          return;
        }
      }

      const response = await fetch('/api/admin/user-progress/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.id,
          interviewDate: interviewForm.interviewDate,
          content: interviewForm.content.trim() || null,
          pdfUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('面談を追加しました');
        fetchUserDetail();
        setInterviewForm({
          interviewDate: '',
          content: '',
          pdfFile: null,
        });
      } else {
        console.error('Interview creation error:', data);
        alert(data.error || '面談の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add interview:', error);
      alert('面談の追加に失敗しました。コンソールを確認してください。');
    } finally {
      setIsAddingInterview(false);
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

            {/* 研修ショートカット追加 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📚 研修ショートカット追加</h2>

              {/* 研修ショートカットを追加 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  受講者のマイページに研修を追加
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
                      {userDetail.trainings
                        .filter((training) => {
                          // 既に追加されている研修を除外（1つでもモジュールが進捗として追加されている場合）
                          const hasAnyProgress = training.modules.some((m) =>
                            userDetail.moduleProgresses.some((mp) => mp.moduleId === m.id)
                          );
                          return !hasAnyProgress;
                        })
                        .map((training) => (
                          <option key={training.id} value={training.id}>
                            {training.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  {selectedTraining && (
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      {(() => {
                        const training = userDetail.trainings.find((t) => t.id === selectedTraining);
                        if (!training) return null;
                        const totalModules = training.modules.length;
                        return `この研修を受講者のマイページにショートカットとして追加します。全${totalModules}個のモジュールが追加されます。`;
                      })()}
                    </div>
                  )}
                  <button
                    onClick={handleAddProgress}
                    disabled={!selectedTraining || isAddingProgress}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAddingProgress ? '追加中...' : 'ショートカットを追加'}
                  </button>
                </div>
              </div>

              {/* 追加済みの研修一覧 */}
              {(() => {
                const addedTrainings = userDetail.trainings.filter((training) => {
                  // 既に追加されている研修（1つでもモジュールが進捗として追加されている場合）
                  return training.modules.some((m) =>
                    userDetail.moduleProgresses.some((mp) => mp.moduleId === m.id)
                  );
                });

                if (addedTrainings.length === 0) {
                  return null;
                }

                return (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      追加済みの研修
                    </h3>
                    <div className="space-y-2">
                      {addedTrainings.map((training) => {
                        const completedModulesCount = training.modules.filter((m) =>
                          userDetail.moduleProgresses.some((mp) => mp.moduleId === m.id && mp.completed)
                        ).length;
                        const totalModules = training.modules.length;
                        const progress = totalModules > 0 ? (completedModulesCount / totalModules) * 100 : 0;
                        const isCompleted = totalModules > 0 && completedModulesCount === totalModules;

                        return (
                          <div
                            key={training.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  {training.title}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                      <span>進捗率</span>
                                      <span className="font-medium">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${
                                          isCompleted ? 'bg-green-500' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600 min-w-[3rem] text-right">
                                    {completedModulesCount}/{totalModules}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
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

            {/* 面談管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">💬 面談管理</h2>

              {/* 面談を追加 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  面談を追加
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      面談日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={interviewForm.interviewDate}
                      onChange={(e) =>
                        setInterviewForm({ ...interviewForm, interviewDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      面談内容（テキスト）
                    </label>
                    <textarea
                      value={interviewForm.content}
                      onChange={(e) =>
                        setInterviewForm({ ...interviewForm, content: e.target.value })
                      }
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="面談内容を入力..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      PDFファイル
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setInterviewForm({ ...interviewForm, pdfFile: file });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    {interviewForm.pdfFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        選択中: {interviewForm.pdfFile.name} ({(interviewForm.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    テキストまたはPDFファイルのいずれかは必須です。両方入力することも可能です。
                  </div>
                  <button
                    onClick={handleAddInterview}
                    disabled={
                      !interviewForm.interviewDate ||
                      (!interviewForm.content && !interviewForm.pdfFile) ||
                      isAddingInterview ||
                      isUploadingPdf
                    }
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAddingInterview || isUploadingPdf
                      ? isUploadingPdf
                        ? 'PDFアップロード中...'
                        : '追加中...'
                      : '面談を追加'}
                  </button>
                </div>
              </div>

              {/* 既存の面談一覧 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  面談一覧
                </h3>
                {userDetail.interviews.length === 0 ? (
                  <p className="text-gray-500 text-sm">面談がありません</p>
                ) : (
                  <div className="space-y-3">
                    {userDetail.interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {new Date(interview.interviewDate).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                            {interview.content && (
                              <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">
                                {interview.content}
                              </p>
                            )}
                            {interview.pdfUrl && (
                              <a
                                href={interview.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                              >
                                📄 PDFを表示
                              </a>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              作成日: {new Date(interview.createdAt).toLocaleDateString('ja-JP')}
                            </div>
                          </div>
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

