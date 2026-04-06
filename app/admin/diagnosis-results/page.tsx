'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Target, Calendar, User, ChevronLeft, ChevronRight,
  MessageCircle, ChevronDown, ChevronUp, BookOpen, TrendingUp, Lock,
} from 'lucide-react';
import { AXIS_LABELS, type Axis } from '@/lib/diagnosis/ai-questions';
import { ADMIN_ADVICE, type AdminAdvice } from '@/lib/diagnosis/report-content';

// ---- 型定義 ----
interface ResultData {
  type?: 'S' | 'A' | 'B' | 'C';
  label?: string;
  totalScore?: number;
  axisScores?: Record<Axis, number>;
}

interface DiagnosisSubmission {
  id: string;
  nickname: string;
  personalityType: string | null;
  resultData: ResultData | null;
  diagnosedAt: string;
  source: string | null;
  lineUserId: string | null;
  lineReportSentAt: string | null;
  createdAt: string;
}

// ---- タイプ別カラー ----
const TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300' },
  A: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  B: { bg: 'bg-stone-50',  text: 'text-stone-600',  border: 'border-stone-300' },
  C: { bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-300' },
};

// ---- 8軸ミニバー ----
function AxisMiniChart({ axisScores }: { axisScores: Record<Axis, number> }) {
  const axes = Object.keys(AXIS_LABELS) as Axis[];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 min-w-[240px]">
      {axes.map((ax) => (
        <div key={ax}>
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span>{AXIS_LABELS[ax]}</span>
            <span className="font-medium text-slate-600">{axisScores[ax]}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${axisScores[ax]}%`, backgroundColor: '#B08968' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- 管理者専用アドバイスパネル ----
function AdminAdvicePanel({ advice, nickname }: { advice: AdminAdvice; nickname: string }) {
  return (
    <div className="p-5 bg-slate-900 rounded-xl space-y-5">
      {/* 管理者専用バッジ */}
      <div className="flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs font-bold text-red-400 tracking-wide uppercase">
          管理者専用 — 受講者には表示されません
        </span>
      </div>

      {/* 講師アドバイス */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <h4 className="text-sm font-bold text-sky-300">
            講師としての対応アドバイス
          </h4>
          <span className="text-[10px] text-sky-500 ml-1">（{nickname}さん向け）</span>
        </div>
        <ul className="space-y-2">
          {advice.instructorTips.map((tip, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-sky-900 text-sky-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">{tip}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-700" />

      {/* 営業アドバイス */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-emerald-300">
            営業・クロージングアドバイス
          </h4>
          <span className="text-[10px] text-emerald-500 ml-1">（{nickname}さん向け）</span>
        </div>
        <ul className="space-y-2">
          {advice.salesTips.map((tip, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">{tip}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- ソースバッジ ----
function SourceBadge({ source }: { source: string | null }) {
  const label = source === 'line' ? 'LINE' : source === 'lp' ? 'LP' : source ?? '-';
  const style =
    source === 'line'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${style}`}>
      {label}
    </span>
  );
}

// ---- メインページ ----
export default function DiagnosisResultsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<DiagnosisSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">診断結果一覧</h1>
          <p className="text-sm text-slate-600">
            LP等から実施された匿名診断の結果がここに集まります（会員登録前の顧客）
          </p>
        </header>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">読み込み中...</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">診断結果はまだありません</p>
              <p className="text-sm text-slate-500 mt-1">
                LPから診断が実施されると、ここに表示されます
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">日時</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">名前</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">タイプ / スコア</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">8軸スコア</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">LINE</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">流入</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">詳細</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => {
                      const rd = s.resultData;
                      const typeKey = rd?.type;
                      const typeStyle = typeKey ? (TYPE_STYLE[typeKey] ?? TYPE_STYLE.C) : null;
                      const advice = typeKey ? ADMIN_ADVICE[typeKey] : null;
                      const isExpanded = expandedId === s.id;

                      return (
                        <>
                          {/* メイン行 */}
                          <tr
                            key={s.id}
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors align-top"
                          >
                            {/* 日時 */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {new Date(s.diagnosedAt).toLocaleString('ja-JP', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                            {/* 名前 */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {s.nickname}
                              </div>
                            </td>

                            {/* タイプ + スコア */}
                            <td className="px-4 py-3">
                              {typeKey && typeStyle ? (
                                <div className="space-y-1.5">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                                    タイプ {typeKey}
                                  </span>
                                  {rd?.label && (
                                    <p className="text-xs text-slate-500 leading-tight">{rd.label}</p>
                                  )}
                                  {rd?.totalScore != null && (
                                    <p className="text-lg font-bold text-[#B08968] leading-none">
                                      {rd.totalScore}
                                      <span className="text-xs font-normal text-slate-400 ml-0.5">点</span>
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">-</span>
                              )}
                            </td>

                            {/* 8軸スコア */}
                            <td className="px-4 py-3">
                              {rd?.axisScores ? (
                                <AxisMiniChart axisScores={rd.axisScores} />
                              ) : (
                                <span className="text-slate-400 text-sm">-</span>
                              )}
                            </td>

                            {/* LINE連携 */}
                            <td className="px-4 py-3">
                              {s.lineUserId ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-xs font-medium text-green-600">連携済み</span>
                                  </div>
                                  {s.lineReportSentAt && (
                                    <p className="text-[10px] text-slate-400">
                                      送信: {new Date(s.lineReportSentAt).toLocaleString('ja-JP', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">未連携</span>
                              )}
                            </td>

                            {/* 流入元 */}
                            <td className="px-4 py-3">
                              <SourceBadge source={s.source} />
                            </td>

                            {/* 詳細ボタン */}
                            <td className="px-4 py-3">
                              {advice ? (
                                <button
                                  onClick={() => toggleExpand(s.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    isExpanded
                                      ? 'bg-slate-800 text-white border-slate-700'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  <Lock className="w-3 h-3" />
                                  管理者メモ
                                  {isExpanded
                                    ? <ChevronUp className="w-3 h-3" />
                                    : <ChevronDown className="w-3 h-3" />
                                  }
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>

                          {/* 展開パネル行 */}
                          {isExpanded && advice && (
                            <tr key={`${s.id}-detail`} className="border-b border-slate-200 bg-slate-800/5">
                              <td colSpan={7} className="px-4 py-4">
                                <AdminAdvicePanel advice={advice} nickname={s.nickname} />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
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
