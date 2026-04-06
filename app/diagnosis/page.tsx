'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Sparkles, Clock, ChevronRight } from 'lucide-react';
import {
  AI_QUESTIONS,
  AXIS_LABELS,
  AI_TYPES,
  calculateAiResult,
  type Axis,
  type DiagnosisResult,
} from '@/lib/diagnosis/ai-questions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://buddybow.vercel.app';

function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') gtag('event', name, params ?? {});
  }
}

// ---- Radar Chart (blurred in results) ----
const RADAR_AXES: Axis[] = [
  'exploration', 'automation', 'continuity', 'affinity',
  'problemFind', 'creativity', 'processing', 'collaboration',
];

function RadarChart({ scores }: { scores: Record<Axis, number> }) {
  const cx = 120, cy = 120, r = 90;

  const toPoint = (i: number, val: number) => {
    const angle = (-90 + i * 45) * (Math.PI / 180);
    const radius = (val / 100) * r;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridPoints = (pct: number) =>
    RADAR_AXES.map((_, i) => {
      const angle = (-90 + i * 45) * (Math.PI / 180);
      return { x: cx + pct * r * Math.cos(angle), y: cy + pct * r * Math.sin(angle) };
    });

  const dataPoints = RADAR_AXES.map((ax, i) => toPoint(i, scores[ax]));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[220px]">
      {[0.25, 0.5, 0.75, 1.0].map((pct) => (
        <polygon
          key={pct}
          points={gridPoints(pct).map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth="1"
        />
      ))}
      {RADAR_AXES.map((_, i) => {
        const end = gridPoints(1.0)[i];
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e7e5e4" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill="#B08968" fillOpacity="0.25" stroke="#B08968" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#B08968" />
      ))}
    </svg>
  );
}

// ---- 8-axis bar graph ----
function AxisBars({ scores }: { scores: Record<Axis, number> }) {
  return (
    <div className="space-y-3">
      {RADAR_AXES.map((ax) => (
        <div key={ax}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-stone-600">{AXIS_LABELS[ax]}</span>
            <span className="font-medium text-stone-500">{scores[ax]}</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B08968] rounded-full transition-all duration-700"
              style={{ width: `${scores[ax]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Main content ----
function DiagnosisContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'lp';

  const [step, setStep] = useState<'nickname' | 'questions' | 'result'>('nickname');
  const [nickname, setNickname] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);

  // Section entry tracking
  useEffect(() => {
    if (step !== 'questions') return;
    if (currentQ === 10) trackEvent('section_enter', { section: 2 });
    if (currentQ === 20) trackEvent('section_enter', { section: 3 });
  }, [currentQ, step]);

  const remaining = AI_QUESTIONS.length - currentQ;
  const remainingSecs = remaining * 8;
  const remainingMin = Math.floor(remainingSecs / 60);
  const remainingSec = remainingSecs % 60;
  const section = currentQ < 10 ? 1 : currentQ < 20 ? 2 : 3;

  const handleStart = () => {
    setStep('questions');
    trackEvent('quiz_start');
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQ + 1 >= AI_QUESTIONS.length) {
      const r = calculateAiResult(newAnswers);
      setResult(r);
      setStep('result');
      trackEvent('quiz_complete', { type: r.type, score: r.totalScore });
      submitResult(r, newAnswers);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleBack = () => {
    setCurrentQ(currentQ - 1);
    setAnswers(answers.slice(0, -1));
  };

  const submitResult = async (r: DiagnosisResult, ans: number[]) => {
    setSubmitStatus('sending');
    try {
      const answersForApi = AI_QUESTIONS.map((q, i) => ({
        questionId: q.id,
        questionText: q.text,
        axis: q.axis,
        selectedIndex: ans[i] ?? null,
        selectedText: ans[i] != null ? q.opts[ans[i]] : null,
        score: ans[i] != null ? q.scores[ans[i]] : null,
      }));

      const res = await fetch('/api/diagnosis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          personalityType: `${r.type}（${AI_TYPES[r.type].label}）`,
          diagnosedAt: new Date().toISOString(),
          resultData: {
            type: r.type,
            label: AI_TYPES[r.type].label,
            totalScore: r.totalScore,
            axisScores: r.axisScores,
            answerCount: ans.length,
            answers: answersForApi,
          },
          source: from === 'consultation' || from === 'line' ? 'line' : from,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        setSubmitStatus('success');
        setDiagnosisId(data.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('buddybow_last_diagnosis_id', data.id);
        }
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
  };

  const shareText = result
    ? `【AI活用スタイル診断】私は「${AI_TYPES[result.type].label}」でした！総合スコア: ${result.totalScore}点`
    : '';
  const shareUrl = `${SITE_URL}/diagnosis`;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/lp"
              className="flex items-center gap-2 text-[#B08968] hover:opacity-80 transition"
            >
              <ArrowLeft size={20} />
              <span className="text-lg font-bold">buddybow</span>
            </Link>
            <h1 className="text-lg font-semibold text-stone-800">AI活用スタイル診断</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-xl">

        {/* ── STEP 1: Nickname ── */}
        {step === 'nickname' && (
          <div>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-[#E6CCB2] rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-[#B08968]" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-3">
                AI活用スタイル診断
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                30の質問に答えると、あなたのAI活用スタイルが<br />8つの軸で可視化されます。
              </p>
              <p className="text-stone-500 text-xs mt-3">所要時間: 約4分</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                ニックネーム（結果表示用）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && handleStart()}
                placeholder="例: たろう"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#B08968] focus:border-transparent outline-none text-stone-800"
                maxLength={20}
              />
              <p className="text-xs text-stone-500 mt-2">本名不要。ニックネームやイニシャルでOK</p>

              <button
                onClick={handleStart}
                disabled={!nickname.trim()}
                className="mt-6 w-full py-4 bg-[#B08968] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#9c7858] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                診断を始める
                <ArrowRight size={20} />
              </button>
            </div>

            {/* 8-axis preview */}
            <div className="mt-8 grid grid-cols-4 gap-2">
              {(Object.values(AXIS_LABELS) as string[]).map((label) => (
                <div
                  key={label}
                  className="bg-white rounded-xl py-3 px-2 border border-stone-100 shadow-sm text-center"
                >
                  <p className="text-xs text-stone-500 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Questions ── */}
        {step === 'questions' && (
          <div>
            {/* Section badge + timer */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#B08968] bg-[#FFF8F0] px-3 py-1 rounded-full border border-[#E6CCB2]">
                Part {section} / 3
              </span>
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Clock size={12} />
                残り約 {remainingMin > 0 ? `${remainingMin}分` : ''}{remainingSec}秒
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-stone-500 mb-2">
                <span>Q{currentQ + 1} / {AI_QUESTIONS.length}</span>
                <span>{Math.round(((currentQ + 1) / AI_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B08968] rounded-full transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / AI_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
              <p className="text-xs text-stone-400 mb-3">
                {AXIS_LABELS[AI_QUESTIONS[currentQ].axis]}
              </p>
              <h3 className="text-lg font-semibold text-stone-800 mb-6 leading-relaxed flex items-start" style={{ minHeight: '4.5em' }}>
                {AI_QUESTIONS[currentQ].text}
              </h3>
              <div className="space-y-3">
                {AI_QUESTIONS[currentQ].opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full p-4 text-left rounded-xl border-2 border-stone-200 hover:border-[#B08968] hover:bg-[#FFF8F0] transition-all font-medium text-stone-700"
                    style={{ minHeight: '48px' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {currentQ > 0 && (
              <button
                onClick={handleBack}
                className="mt-4 text-sm text-stone-400 hover:text-stone-600 transition flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                前の質問に戻る
              </button>
            )}
          </div>
        )}

        {/* ── STEP 3: Result ── */}
        {step === 'result' && result && (
          <div>
            {/* Type header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#E6CCB2] rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#B08968]" />
              </div>
              <p className="text-sm text-stone-500 mb-2">{nickname}さんの診断結果</p>
              <div className="inline-block bg-[#B08968] text-white text-sm font-bold px-4 py-1 rounded-full mb-3">
                タイプ {result.type}
              </div>
              <h2 className="text-2xl font-bold text-stone-800">
                {AI_TYPES[result.type].label}
              </h2>
            </div>

            {/* Score + description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-4">
              <div className="text-center mb-4">
                <p className="text-xs text-stone-500 mb-1">総合スコア</p>
                <p className="text-5xl font-bold text-[#B08968]">
                  {result.totalScore}
                  <span className="text-xl text-stone-400 ml-1">点</span>
                </p>
              </div>
              <p className="text-stone-700 leading-relaxed text-sm text-center">
                {AI_TYPES[result.type].desc}
              </p>
            </div>

            {/* 8-axis bars (free) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">8軸スコア</h3>
              <AxisBars scores={result.axisScores} />
            </div>

            {/* Radar chart (blurred → LINE OAuth CTA) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">レーダーチャート</h3>
              <div className="relative flex justify-center">
                <div style={{ filter: 'blur(6px)', pointerEvents: 'none', opacity: 0.7 }}>
                  <RadarChart scores={result.axisScores} />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <p className="text-xs text-stone-600 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    LINE連携で詳細レポートが届きます
                  </p>
                  {diagnosisId ? (
                    <a
                      href={`/api/auth/line?diagnosisId=${diagnosisId}`}
                      onClick={() => trackEvent('line_click', { context: 'radar_unlock' })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:opacity-90 transition"
                      style={{ backgroundColor: '#06C755' }}
                    >
                      LINEで受け取る
                      <ChevronRight size={16} />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white opacity-60 cursor-wait"
                      style={{ backgroundColor: '#06C755' }}>
                      送信中...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex gap-3 mb-6">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('share_click', { platform: 'x' })}
                className="flex-1 py-3 rounded-xl border-2 border-stone-200 text-stone-600 text-sm font-medium text-center hover:border-stone-400 transition"
              >
                𝕏 でシェア
              </a>
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('share_click', { platform: 'line' })}
                className="flex-1 py-3 rounded-xl border-2 border-stone-200 text-stone-600 text-sm font-medium text-center hover:border-stone-400 transition"
              >
                LINE でシェア
              </a>
            </div>

            {submitStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">
                  結果の送信に失敗しました。通信環境を確認して再度お試しください。
                </p>
              </div>
            )}

            {/* Next step CTA */}
            <div className="bg-[#FFF8F0] border border-[#E6CCB2] rounded-2xl p-6 text-center">
              <p className="text-sm text-stone-600 mb-4">
                診断結果を踏まえた個別プランと無料面談のご案内はこちら
              </p>
              <Link
                href={diagnosisId ? `/lp/meeting?diagnosisId=${diagnosisId}` : '/lp/meeting'}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  diagnosisId
                    ? 'bg-[#B08968] text-white hover:bg-[#9c7858]'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed pointer-events-none'
                }`}
              >
                次のステップへ
                <ArrowRight size={18} />
              </Link>
              <p className="text-xs text-stone-500 mt-4">強引な勧誘は一切行いません</p>
            </div>

            <div className="mt-8 text-center">
              <Link href="/lp" className="text-sm text-stone-500 hover:text-stone-700 transition">
                トップページに戻る
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DiagnosisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-stone-500">
          読み込み中...
        </div>
      }
    >
      <DiagnosisContent />
    </Suspense>
  );
}
