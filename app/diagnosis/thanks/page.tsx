'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

function ThanksContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const diagnosisId = searchParams.get('diagnosisId');

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/lp" className="flex items-center gap-2 text-[#B08968] hover:opacity-80 transition">
              <ArrowLeft size={20} />
              <span className="text-lg font-bold">buddybow</span>
            </Link>
            <h1 className="text-lg font-semibold text-stone-800">LINE連携</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-md text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-[#E6CCB2] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#B08968]" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-3">
              LINEにレポートを送りました！
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-8">
              LINEを開いて buddybow からのメッセージを確認してください。<br />
              8軸のレーダーチャートと詳細スコアが届いています。
            </p>

            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm mb-8 text-left">
              <p className="text-xs font-semibold text-stone-500 mb-3">次のステップ</p>
              <div className="space-y-3">
                {[
                  'LINEのレポートを確認する',
                  '気になる軸を深掘りする',
                  '無料面談で個別プランを相談する',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#E6CCB2] text-[#B08968] text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-stone-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={diagnosisId ? `/lp/meeting?diagnosisId=${diagnosisId}` : '/lp/meeting'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#B08968] text-white rounded-xl font-bold hover:bg-[#9c7858] transition"
            >
              無料面談を予約する
              <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-stone-400 mt-3">強引な勧誘は一切行いません</p>
          </>
        ) : isCancelled ? (
          <>
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-stone-400" />
            </div>
            <h2 className="text-xl font-bold text-stone-700 mb-3">
              LINE連携をキャンセルしました
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">
              後からいつでも診断結果画面のLINEボタンから連携できます。
            </p>
            <Link
              href="/diagnosis"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#B08968] text-[#B08968] rounded-xl font-bold hover:bg-[#FFF8F0] transition"
            >
              診断ページに戻る
              <ArrowRight size={18} />
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-stone-700 mb-3">
              エラーが発生しました
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">
              LINE連携に失敗しました。<br />
              お手数ですが、もう一度診断ページからやり直してください。
            </p>
            <Link
              href="/diagnosis"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-stone-300 text-stone-600 rounded-xl font-bold hover:bg-stone-50 transition"
            >
              診断ページに戻る
              <ArrowRight size={18} />
            </Link>
          </>
        )}

        <div className="mt-10">
          <Link href="/lp" className="text-sm text-stone-400 hover:text-stone-600 transition">
            トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ThanksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-stone-500">読み込み中...</div>}>
      <ThanksContent />
    </Suspense>
  );
}
