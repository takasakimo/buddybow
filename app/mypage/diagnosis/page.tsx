'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Target, Calendar, ArrowRight } from 'lucide-react';
import { DIMENSION_LABELS, DIMENSION_ORDER } from '@/lib/diagnosis/p256';

interface SkillMap {
  totalScore?: number;
  axisScores?: Record<string, number>;
  system?: string;
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
    if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/mypage/diagnoses');
      if (response.ok) setDiagnoses(await response.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">{status === 'loading' ? '読み込み中...' : 'リダイレクト中...'}</p>
      </div>
    );
  }

  // p256フォーマットの最新診断
  const latest = diagnoses.find((d) => {
    const sm = d.skillMap as SkillMap | null;
    return sm?.system === 'p256' || (d.personalityType && d.personalityType.length === 8 && /^[HL]+$/.test(d.personalityType));
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">診断</h1>
          <p className="text-slate-600 text-sm">8つの心理学的特性から、あなたの副業適性を256パターンで判定します</p>
        </header>

        {/* 診断カード */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">buddybow 256パターン副業適性診断</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            ビッグファイブ心理学をベースにした<strong>40問</strong>の診断で、
            8軸 × H/L = <strong>256通り</strong>のパーソナリティタイプを判定します。
            向いている副業やパーソナライズアドバイスも確認できます。
          </p>
          <Link
            href="/mypage/diagnosis/detailed"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#B08968' }}
          >
            <ArrowRight className="w-5 h-5" />
            {latest ? '再診断する' : '診断を受ける'}
          </Link>
        </div>

        {/* 最新結果 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">最新の診断結果</h2>
          </div>

          {isLoading ? (
            <p className="text-slate-500 text-sm py-4">読み込み中...</p>
          ) : !latest ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-2">診断結果はまだありません</p>
              <p className="text-xs text-slate-400">「診断を受ける」から診断を受けると結果がここに表示されます</p>
            </div>
          ) : (
            <LatestResult diagnosis={latest} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function LatestResult({ diagnosis }: { diagnosis: Diagnosis }) {
  const key = diagnosis.personalityType ?? '';
  const sm = diagnosis.skillMap as SkillMap | null;
  const axisScores = sm?.axisScores ?? {};
  const archetype = diagnosis.comment ?? '';

  return (
    <div className="space-y-5">
      {/* タイプキー + アーキタイプ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 font-mono mb-1">{key}</p>
          <p className="text-xl font-bold text-slate-900">{archetype}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(diagnosis.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* H/Lタグ */}
      {key.length === 8 && (
        <div className="grid grid-cols-2 gap-2">
          {DIMENSION_ORDER.map((dim, i) => {
            const level = key[i] as 'H' | 'L';
            const label = DIMENSION_LABELS[dim];
            return (
              <div
                key={dim}
                className={`px-3 py-2 rounded-lg text-xs flex justify-between items-center ${
                  level === 'H' ? 'bg-[#B08968]/10 text-[#B08968]' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span>{label.ja}</span>
                <span className="font-bold">{label[level === 'H' ? 'Hlabel' : 'Llabel']}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 8軸スコアバー */}
      {Object.keys(axisScores).length > 0 && (
        <div className="space-y-2.5">
          {DIMENSION_ORDER.map((dim, i) => {
            const score = axisScores[dim] ?? 0;
            const level = key[i] as 'H' | 'L' | undefined;
            const pct = ((score - 5) / 15) * 100;
            return (
              <div key={dim}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{DIMENSION_LABELS[dim].ja}</span>
                  <span className="text-slate-400">{score}/20</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: level === 'H' ? '#B08968' : '#cbd5e1' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
