'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  AI_QUESTIONS,
  AI_TYPES,
  AXIS_LABELS,
  calculateAiResult,
  type Axis,
} from '@/lib/diagnosis/ai-questions';
import { REPORT_CONTENT } from '@/lib/diagnosis/report-content';

const PART_LABELS: Record<number, string> = { 0: 'Part 1', 1: 'Part 2', 2: 'Part 3' };
const PART_RANGES = [
  { label: 'Part 1', from: 0, to: 9 },
  { label: 'Part 2', from: 10, to: 19 },
  { label: 'Part 3', from: 20, to: 29 },
];

const TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300' },
  A: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  B: { bg: 'bg-stone-50',  text: 'text-stone-600',  border: 'border-stone-300' },
  C: { bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-300' },
};

function AxisBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{score}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: '#B08968' }}
        />
      </div>
    </div>
  );
}

export default function DetailedDiagnosisPage() {
  const { status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<'questions' | 'result'>('questions');
  const [scores, setScores] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [resultData, setResultData] = useState<ReturnType<typeof calculateAiResult> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const currentPart = PART_RANGES.findIndex((p) => currentQ >= p.from && currentQ <= p.to);

  const handleAnswer = (score: number) => {
    const newScores = [...scores, score];
    setScores(newScores);

    if (currentQ + 1 >= AI_QUESTIONS.length) {
      const result = calculateAiResult(newScores);
      setResultData(result);
      setStep('result');
      saveResult(result);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setScores((prev) => prev.slice(0, -1));
      setCurrentQ((q) => q - 1);
    }
  };

  const saveResult = async (result: ReturnType<typeof calculateAiResult>) => {
    setSaveStatus('sending');
    try {
      const res = await fetch('/api/mypage/diagnosis/detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalityType: result.type,
          label: AI_TYPES[result.type].label,
          totalScore: result.totalScore,
          axisScores: result.axisScores,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSaveStatus(res.ok && data.success ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <Link
            href="/mypage/diagnosis"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm mb-4"
          >
            <ArrowLeft size={18} />
            診断ページに戻る
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">buddybow AI活用診断</h1>
          <p className="text-slate-600 text-sm mt-1">
            30問の質問で、あなたのAI活用タイプを診断します
          </p>
        </header>

        {step === 'questions' && (
          <div className="space-y-6">
            {/* プログレス */}
            <div>
              <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span className="font-medium text-[#B08968]">
                  {PART_LABELS[currentPart] ?? ''}
                </span>
                <span>
                  {currentQ + 1} / {AI_QUESTIONS.length}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQ + 1) / AI_QUESTIONS.length) * 100}%`,
                    backgroundColor: '#B08968',
                  }}
                />
              </div>
            </div>

            {/* 質問カード */}
            <div className="card p-6">
              <p className="text-xs font-semibold text-[#B08968] mb-3">
                Q{currentQ + 1}
              </p>
              <h3 className="text-base font-semibold text-slate-900 mb-6 leading-relaxed">
                {AI_QUESTIONS[currentQ].text}
              </h3>
              <div className="space-y-3">
                {AI_QUESTIONS[currentQ].opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(AI_QUESTIONS[currentQ].scores[i])}
                    className="w-full p-4 text-left rounded-xl border-2 border-slate-200 hover:border-[#B08968] hover:bg-[#FFF8F0] transition-all text-sm text-slate-700"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {currentQ > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={14} />
                前の質問に戻る
              </button>
            )}
          </div>
        )}

        {step === 'result' && resultData && (() => {
          const typeInfo = AI_TYPES[resultData.type];
          const report = REPORT_CONTENT[resultData.type];
          const style = TYPE_STYLE[resultData.type] ?? TYPE_STYLE.C;
          const axes = Object.keys(AXIS_LABELS) as Axis[];

          return (
            <div className="space-y-6">
              {/* タイプ表示 */}
              <div className="card p-6 text-center">
                <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold border ${style.bg} ${style.text} ${style.border} mb-3`}>
                  タイプ {resultData.type}
                </span>
                <h2 className="text-2xl font-bold text-slate-900">{typeInfo.label}</h2>
                <p className="text-sm text-slate-500 mt-1">{typeInfo.desc}</p>
                <p className="text-3xl font-bold text-[#B08968] mt-4">
                  {resultData.totalScore}
                  <span className="text-base font-normal text-slate-400 ml-1">点</span>
                </p>
              </div>

              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800">診断結果をマイページに保存しました</p>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">結果の保存に失敗しました。再度お試しください。</p>
                </div>
              )}

              {/* 8軸スコア */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">8軸スコア詳細</h3>
                <div className="grid grid-cols-1 gap-3">
                  {axes.map((ax) => (
                    <AxisBar key={ax} label={AXIS_LABELS[ax]} score={resultData.axisScores[ax]} />
                  ))}
                </div>
              </div>

              {/* 性格的な傾向 */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">あなたの傾向</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{report.personality}</p>
              </div>

              {/* 向いている副業 */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">向いている副業スタイル</h3>
                <ul className="space-y-2">
                  {report.suitableJobs.map((job, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-[#B08968] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {job}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 成功への挑戦方法 */}
              <div className="card p-6 bg-[#FFF8F0] border-[#B08968]/20">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">成功しやすい挑戦方法</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{report.howToSucceed}</p>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/mypage/diagnosis"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: '#B08968' }}
                >
                  診断結果一覧へ
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
