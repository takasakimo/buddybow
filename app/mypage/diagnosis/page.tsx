'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Target, Calendar, ArrowRight } from 'lucide-react';
import { AXIS_LABELS, AI_TYPES, type Axis } from '@/lib/diagnosis/ai-questions';

const TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300' },
  A: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  B: { bg: 'bg-stone-50',  text: 'text-stone-600',  border: 'border-stone-300' },
  C: { bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-300' },
};

interface SkillMap {
  totalScore?: number;
  axisScores?: Record<Axis, number>;
}

interface Diagnosis {
  id: string;
  personalityType: string | null;
  comment: string | null;
  skillMap: SkillMap | null;
  createdAt: string;
}

export default function DiagnosisPage() {
  const { status } = useSession();
  const router = useRouter();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/mypage/diagnoses');
      if (response.ok) {
        const data = await response.json();
        setDiagnoses(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">
          {status === 'loading' ? '読み込み中...' : 'リダイレクト中...'}
        </p>
      </div>
    );
  }

  // 最新の診断結果（新フォーマット判定: skillMapあり）
  const latestNew = diagnoses.find(
    (d) => d.skillMap && (d.skillMap as SkillMap).axisScores
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
            診断
          </h1>
          <p className="text-slate-600 text-sm">
            あなたのAI活用タイプを診断します
          </p>
        </header>

        {/* 診断へのリンク */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">buddybow AI活用診断</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            30問の質問で、あなたのAI活用タイプ（S / A / B / C）を診断します。
            8つの軸でスコアを算出し、向いている副業や成功のヒントをお伝えします。
          </p>
          <Link
            href="/mypage/diagnosis/detailed"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#B08968' }}
          >
            <ArrowRight className="w-5 h-5" />
            診断を受ける
          </Link>
        </div>

        {/* 最新診断結果 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">診断結果</h2>
          </div>

          {isLoading ? (
            <p className="text-slate-500 text-sm py-4">読み込み中...</p>
          ) : !latestNew ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-2">診断結果はまだありません</p>
              <p className="text-xs text-slate-400">
                「診断を受ける」から診断を受けると、結果がここに表示されます
              </p>
            </div>
          ) : (() => {
            const type = latestNew.personalityType ?? 'C';
            const style = TYPE_STYLE[type] ?? TYPE_STYLE.C;
            const typeInfo = AI_TYPES[type as keyof typeof AI_TYPES];
            const sm = latestNew.skillMap as SkillMap;
            const axes = Object.keys(AXIS_LABELS) as Axis[];

            return (
              <div className="space-y-5">
                {/* ヘッダー */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold border ${style.bg} ${style.text} ${style.border}`}>
                    タイプ {type}
                  </span>
                  {typeInfo && (
                    <span className="text-base font-semibold text-slate-800">{typeInfo.label}</span>
                  )}
                  {sm.totalScore != null && (
                    <span className="text-2xl font-bold text-[#B08968] ml-auto">
                      {sm.totalScore}
                      <span className="text-sm font-normal text-slate-400 ml-0.5">点</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(latestNew.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </div>

                {/* 8軸スコア */}
                {sm.axisScores && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {axes.map((ax) => (
                      <div key={ax}>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{AXIS_LABELS[ax]}</span>
                          <span className="font-medium text-slate-600">{sm.axisScores![ax]}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${sm.axisScores![ax]}%`, backgroundColor: '#B08968' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 再診断 */}
                <div className="pt-2">
                  <Link
                    href="/mypage/diagnosis/detailed"
                    className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                  >
                    再診断する
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </DashboardLayout>
  );
}
