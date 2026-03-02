'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Sparkles, Target } from 'lucide-react';
import {
  DIAGNOSIS_QUESTIONS,
  PERSONALITY_TYPES,
  calculateResult,
  type AnswerKey,
} from '@/lib/diagnosis/questions';

function DiagnosisContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'lp';

  const [step, setStep] = useState<'nickname' | 'questions' | 'result'>('nickname');
  const [nickname, setNickname] = useState('');
  const [answers, setAnswers] = useState<AnswerKey[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [resultType, setResultType] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleNextQuestion = (answer: AnswerKey) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    if (currentQ + 1 >= DIAGNOSIS_QUESTIONS.length) {
      const type = calculateResult(newAnswers);
      setResultType(type);
      setStep('result');
      submitResult(type, newAnswers);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const submitResult = async (type: string, ans: AnswerKey[]) => {
    setSubmitStatus('sending');
    try {
      const res = await fetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/diagnosis/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          personalityType: type,
          diagnosedAt: new Date().toISOString(),
          resultData: {
            type,
            description: PERSONALITY_TYPES[type]?.description,
            answerCount: ans.length,
          },
          source: from === 'consultation' || from === 'line' ? 'line' : from,
        }),
      });
      if (res.ok) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch (e) {
      console.error('Submit error:', e);
      setSubmitStatus('error');
    }
  };

  const result = resultType ? PERSONALITY_TYPES[resultType] : null;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
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
            <h1 className="text-lg font-semibold text-stone-800">行動タイプ診断</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-xl">
        {step === 'nickname' && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-[#E6CCB2] rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-[#B08968]" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-2">
                あなたの行動パターンを診断
              </h2>
              <p className="text-stone-600 text-sm">
                8つの質問に答えると、あなたの「動き方」の傾向がわかります
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                ニックネーム（結果表示用）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例: たろう"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#B08968] focus:border-transparent outline-none text-stone-800"
                maxLength={20}
              />
              <p className="text-xs text-stone-500 mt-2">
                本名不要。ニックネームやイニシャルでOKです
              </p>

              <button
                onClick={() => setStep('questions')}
                disabled={!nickname.trim()}
                className="mt-6 w-full py-4 bg-[#B08968] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#9c7858] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                診断を始める
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 'questions' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-stone-500 mb-2">
                <span>質問 {currentQ + 1} / {DIAGNOSIS_QUESTIONS.length}</span>
                <span>{Math.round(((currentQ + 1) / DIAGNOSIS_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B08968] rounded-full transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / DIAGNOSIS_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800 mb-6">
                {DIAGNOSIS_QUESTIONS[currentQ].text}
              </h3>
              <div className="space-y-3">
                {DIAGNOSIS_QUESTIONS[currentQ].options.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleNextQuestion(opt.key)}
                    className="w-full p-4 text-left rounded-xl border-2 border-stone-200 hover:border-[#B08968] hover:bg-[#FFF8F0] transition-all font-medium text-stone-700"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#E6CCB2] rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#B08968]" />
              </div>
              <p className="text-sm text-stone-500 mb-1">{nickname}さんの結果</p>
              <h2 className="text-2xl font-bold text-stone-800">{result.name}</h2>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 mb-6">
              <p className="text-stone-700 leading-relaxed">{result.description}</p>
            </div>

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">
                  結果の送信に失敗しました。通信環境を確認して、ページを再読み込みして再度お試しください。
                </p>
              </div>
            )}

            <div className="bg-[#FFF8F0] border border-[#E6CCB2] rounded-2xl p-6 text-center">
              <p className="text-sm text-stone-600 mb-4">
                もっと詳しい傾向や、あなたに合った進め方を知りたい方は
              </p>
              <Link
                href="/consultation"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#B08968] text-white rounded-xl font-medium hover:bg-[#9c7858] transition-all"
              >
                次のステップへ
                <ArrowRight size={18} />
              </Link>
              <p className="text-xs text-stone-500 mt-4">
                強引な勧誘は一切行いません
              </p>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/lp"
                className="text-sm text-stone-500 hover:text-stone-700 transition"
              >
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
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">読み込み中...</div>}>
      <DiagnosisContent />
    </Suspense>
  );
}
