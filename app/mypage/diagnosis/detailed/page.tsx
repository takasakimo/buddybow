'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Map, Loader2 } from 'lucide-react';
import {
  P256_QUESTIONS,
  DIMENSION_LABELS,
  DIMENSION_ORDER,
  calculateP256Result,
  type P256Result,
  type DimensionId,
} from '@/lib/diagnosis/p256';

const PART_RANGES = [
  { label: 'Part 1', from: 0,  to: 9,  theme: '探索・実行' },
  { label: 'Part 2', from: 10, to: 19, theme: '対人・安定' },
  { label: 'Part 3', from: 20, to: 29, theme: '創造・自律' },
  { label: 'Part 4', from: 30, to: 39, theme: 'ビジネス感覚' },
];

const LEVEL_BAR_W: Record<number, string> = { 5: '25%', 6: '30%', 7: '35%', 8: '40%', 9: '45%', 10: '50%', 11: '55%', 12: '60%', 13: '65%', 14: '70%', 15: '75%', 16: '80%', 17: '85%', 18: '90%', 19: '95%', 20: '100%' };

export default function DetailedDiagnosisPage() {
  const { status } = useSession();
  const router = useRouter();

  const [step, setStep]           = useState<'intro' | 'questions' | 'result'>('intro');
  const [selectedIndexes, setSel] = useState<number[]>([]);
  const [currentQ, setCurrentQ]   = useState(0);
  const [result, setResult]       = useState<P256Result | null>(null);
  const [saveStatus, setSave]     = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const currentPart = PART_RANGES.find((p) => currentQ >= p.from && currentQ <= p.to);

  const handleAnswer = (optionIndex: number) => {
    const newSel = [...selectedIndexes, optionIndex];
    setSel(newSel);

    if (currentQ + 1 >= P256_QUESTIONS.length) {
      const r = calculateP256Result(newSel);
      setResult(r);
      setStep('result');
      save(r);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setSel((prev) => prev.slice(0, -1));
      setCurrentQ((q) => q - 1);
    } else {
      setStep('intro');
    }
  };

  const save = async (r: P256Result) => {
    setSave('sending');
    try {
      const res = await fetch('/api/mypage/diagnosis/detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalityType: r.key,
          label: r.archetype.title,
          totalScore: Math.round(r.dimensionScores.filter((d) => d.level === 'H').length / 8 * 100),
          axisScores: Object.fromEntries(r.dimensionScores.map((d) => [d.dimensionId, d.rawScore])),
          system: 'p256',
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSave(res.ok && data.success ? 'success' : 'error');
    } catch {
      setSave('error');
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
            <ArrowLeft size={16} />
            診断ページに戻る
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">buddybow 256パターン副業適性診断</h1>
          <p className="text-slate-600 text-sm mt-1">
            8つの心理学的特性から、256通りのパーソナリティタイプを判定します
          </p>
        </header>

        {/* ── イントロ ── */}
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-800 mb-1">質問数</p>
                  <p className="text-2xl font-bold text-[#B08968]">40<span className="text-sm font-normal text-slate-500 ml-1">問</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-800 mb-1">パターン数</p>
                  <p className="text-2xl font-bold text-[#B08968]">256<span className="text-sm font-normal text-slate-500 ml-1">通り</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-800 mb-1">所要時間</p>
                  <p className="text-2xl font-bold text-[#B08968]">約5<span className="text-sm font-normal text-slate-500 ml-1">分</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-800 mb-1">診断軸</p>
                  <p className="text-2xl font-bold text-[#B08968]">8<span className="text-sm font-normal text-slate-500 ml-1">軸</span></p>
                </div>
              </div>

              <div className="text-sm text-slate-600 space-y-2 pt-2">
                <p className="font-semibold text-slate-800">診断する8つの特性：</p>
                <div className="grid grid-cols-2 gap-1">
                  {DIMENSION_ORDER.map((dim) => (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B08968] shrink-0" />
                      <span>{DIMENSION_LABELS[dim].ja}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 pt-1">
                ビッグファイブ心理学をベースに、副業・キャリア文脈に最適化した診断です。正直に答えるほど精度が上がります。
              </p>
            </div>

            <button
              onClick={() => setStep('questions')}
              className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all"
              style={{ backgroundColor: '#B08968' }}
            >
              診断をはじめる
              <ChevronRight className="inline w-5 h-5 ml-1" />
            </button>
          </div>
        )}

        {/* ── 質問 ── */}
        {step === 'questions' && (
          <div className="space-y-5">
            {/* プログレス */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-semibold text-[#B08968]">
                  {currentPart?.label} — {currentPart?.theme}
                </span>
                <span>{currentQ + 1} / {P256_QUESTIONS.length}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / P256_QUESTIONS.length) * 100}%`, backgroundColor: '#B08968' }}
                />
              </div>
              {/* パートドット */}
              <div className="flex gap-1.5 mt-2">
                {PART_RANGES.map((p, i) => (
                  <div
                    key={i}
                    className="flex-1 h-0.5 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: currentQ >= p.from ? '#B08968' : '#e2e8f0' }}
                  />
                ))}
              </div>
            </div>

            {/* 次元バッジ */}
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full border border-[#B08968]/40 text-[#B08968] bg-[#FFF8F0]">
                {DIMENSION_LABELS[P256_QUESTIONS[currentQ].dimensionId].ja}
              </span>
              <span className="text-xs text-slate-400">Q{currentQ + 1}</span>
            </div>

            {/* 質問カード */}
            <div className="card p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-6 leading-relaxed">
                {P256_QUESTIONS[currentQ].text}
              </h3>
              <div className="space-y-3">
                {P256_QUESTIONS[currentQ].opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full p-4 text-left rounded-xl border-2 border-slate-200 hover:border-[#B08968] hover:bg-[#FFF8F0] transition-all text-sm text-slate-700"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={14} />
              {currentQ === 0 ? 'はじめに戻る' : '前の質問に戻る'}
            </button>
          </div>
        )}

        {/* ── 結果 ── */}
        {step === 'result' && result && (
          <ResultView result={result} saveStatus={saveStatus} />
        )}
      </div>
    </DashboardLayout>
  );
}

// ── ロードマップ生成コンポーネント ───────────────────────────

function RoadmapGenerator({ result }: { result: P256Result }) {
  const router = useRouter();
  const [goal, setGoal]         = useState('');
  const [firstStep, setFirst]   = useState('');
  const [months, setMonths]     = useState(3);
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setError]    = useState('');

  const generate = async () => {
    if (!goal.trim()) return;
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/mypage/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          firstStep: firstStep.trim() || undefined,
          targetMonths: months,
          diagnosisKey: result.key,
          archetype: result.archetype.title,
          dimensionScores: Object.fromEntries(
            result.dimensionScores.map((d) => [d.dimensionId, { rawScore: d.rawScore, level: d.level }])
          ),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('success');
        setTimeout(() => router.push('/mypage/roadmap'), 1200);
      } else {
        setError(data.error ?? 'ロードマップの生成に失敗しました');
        setStatus('error');
      }
    } catch {
      setError('通信エラーが発生しました');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="card p-6 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
        <p className="font-semibold text-slate-800">ロードマップを作成しました！</p>
        <p className="text-sm text-slate-500">ロードマップページへ移動します...</p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Map className="w-5 h-5 text-[#B08968]" />
        <h3 className="text-base font-bold text-slate-900">このタイプに合ったロードマップを作成する</h3>
      </div>
      <p className="text-xs text-slate-500 -mt-2">
        診断結果（{result.archetype.title}）をAIに渡して、あなた専用のロードマップを自動生成します。
      </p>

      {/* ゴール */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          達成したいゴール <span className="text-red-400">*</span>
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例：副業で月5万円を安定的に稼ぐ / SNS運用代行の案件を獲得する"
          rows={2}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#B08968] resize-none"
        />
      </div>

      {/* 最初の一歩 */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          最初の一歩（任意）
        </label>
        <input
          type="text"
          value={firstStep}
          onChange={(e) => setFirst(e.target.value)}
          placeholder="例：ChatGPTで記事を1本書いてみる（空欄の場合はAIが提案）"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#B08968]"
        />
      </div>

      {/* 期間 */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">ロードマップ期間</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                months === m
                  ? 'bg-[#B08968] text-white border-[#B08968]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#B08968]'
              }`}
            >
              {m}ヶ月
            </button>
          ))}
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        onClick={generate}
        disabled={!goal.trim() || status === 'loading'}
        className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#B08968' }}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AIがロードマップを生成中...（30秒ほどかかります）
          </>
        ) : (
          <>
            <Map className="w-4 h-4" />
            ロードマップを自動生成する
          </>
        )}
      </button>
    </div>
  );
}

// ── 結果コンポーネント ─────────────────────────────────────

function ResultView({
  result,
  saveStatus,
}: {
  result: P256Result;
  saveStatus: 'idle' | 'sending' | 'success' | 'error';
}) {
  const hCount = result.dimensionScores.filter((d) => d.level === 'H').length;

  return (
    <div className="space-y-6">
      {/* アーキタイプヘッダー */}
      <div className="card p-6 text-center space-y-2">
        <p className="text-xs text-slate-400 tracking-widest uppercase font-medium">Your Personality Type</p>
        <p className="text-xs font-mono text-slate-400">{result.key}</p>
        <h2 className="text-3xl font-bold text-slate-900">{result.archetype.title}</h2>
        <p className="text-sm text-slate-500">{result.archetype.subtitle}</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-2xl font-bold text-[#B08968]">{hCount}</span>
          <span className="text-sm text-slate-400">/ 8 軸が高スコア</span>
        </div>
      </div>

      {/* 保存ステータス */}
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

      {/* 8軸レーダー（バー形式） */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">8軸パーソナリティプロフィール</h3>
        <div className="space-y-3">
          {result.dimensionScores.map((ds) => {
            const label = DIMENSION_LABELS[ds.dimensionId];
            const levelLabel = label[ds.level === 'H' ? 'Hlabel' : 'Llabel'];
            const pct = ((ds.rawScore - 5) / 15) * 100;
            return (
              <div key={ds.dimensionId}>
                <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                  <span className="font-medium">{label.ja}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ds.level === 'H'
                          ? 'bg-[#B08968]/10 text-[#B08968]'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {levelLabel}
                    </span>
                    <span className="text-slate-400">{ds.rawScore}/20</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: ds.level === 'H' ? '#B08968' : '#cbd5e1',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* パーソナリティ説明 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">あなたのパーソナリティ</h3>
        <div className="space-y-3">
          {result.personalityDescription.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed">{para}</p>
          ))}
        </div>
      </div>

      {/* 向いている副業 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">あなたに向いている副業スタイル</h3>
        <div className="space-y-3">
          {result.suitableJobs.map((job, i) => (
            <div key={job.id} className="flex gap-3">
              <span
                className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: '#B08968' }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{job.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{job.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* アドバイス */}
      <div className="card p-6" style={{ backgroundColor: '#FFF8F0', borderColor: '#B08968' + '33' }}>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">あなたへのパーソナライズアドバイス</h3>
        <div className="space-y-4">
          {result.advice.map((tip, i) => (
            <div key={i} className="flex gap-3">
              <span
                className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: '#B08968' }}
              >
                {i + 1}
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 8軸H/L サマリータグ */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">タイプ詳細（8次元）</h3>
        <div className="grid grid-cols-2 gap-2">
          {result.dimensionScores.map((ds) => (
            <div
              key={ds.dimensionId}
              className={`px-3 py-2 rounded-lg text-xs flex justify-between items-center ${
                ds.level === 'H' ? 'bg-[#B08968]/10 text-[#B08968]' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span>{DIMENSION_LABELS[ds.dimensionId].ja}</span>
              <span className="font-bold">{DIMENSION_LABELS[ds.dimensionId][ds.level === 'H' ? 'Hlabel' : 'Llabel']}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ロードマップ生成 */}
      <RoadmapGenerator result={result} />

      <div className="pt-2 text-center">
        <Link
          href="/mypage/diagnosis"
          className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
        >
          診断結果一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
