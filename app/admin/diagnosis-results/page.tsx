'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Target, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiagnosisSubmission {
  id: string;
  nickname: string;
  personalityType: string | null;
  resultData: unknown;
  diagnosedAt: string;
  source: string | null;
  createdAt: string;
}

export default function DiagnosisResultsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<DiagnosisSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/diagnosis-submissions?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch diagnosis submissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!session) return;
    const role = getUserRole();
    if (role !== 'FULL_ADMIN' && role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }
    fetchSubmissions();
  }, [session, router, fetchSubmissions]);

  const formatResultData = (data: unknown): string => {
    if (data == null) return '-';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return String(data);
      }
    }
    return String(data);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            診断結果一覧
          </h1>
          <p className="text-sm text-slate-600">
            LP等から実施された匿名診断の結果がここに集まります（会員登録前の顧客）
          </p>
        </header>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">
              読み込み中...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">診断結果はまだありません</p>
              <p className="text-sm text-slate-500 mt-1">
                buddybow-diagnosis アプリからデータが送信されると、ここに表示されます
              </p>
              <p className="text-xs text-slate-400 mt-4">
                POST /api/diagnosis/submit に以下の形式で送信してください
              </p>
              <pre className="mt-2 p-4 bg-slate-100 rounded-lg text-left text-xs overflow-x-auto max-w-md mx-auto">
{`{
  "nickname": "ニックネーム",
  "personalityType": "行動タイプ名",
  "diagnosedAt": "2025-03-02T00:00:00.000Z",
  "resultData": { /* 任意 */ },
  "source": "lp"
}`}
              </pre>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">日時</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">名前・ニックネーム</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">行動タイプ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">詳細</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            {new Date(s.diagnosedAt).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            {s.nickname}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {s.personalityType ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-buddybow-orange/10 text-buddybow-orange border border-buddybow-orange/30">
                              {s.personalityType}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.resultData ? (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-buddybow-orange hover:underline">
                                詳細を表示
                              </summary>
                              <pre className="mt-2 p-3 bg-slate-100 rounded text-slate-700 overflow-x-auto max-w-xs whitespace-pre-wrap break-words">
                                {formatResultData(s.resultData)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                  <p className="text-sm text-slate-600">
                    全 {total} 件（{page} / {totalPages} ページ）
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
