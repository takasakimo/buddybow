"use client";

import React from 'react';
import { MessageCircle, ExternalLink, ArrowLeft, CheckCircle2, Compass, Target } from 'lucide-react';
import Link from 'next/link';

export default function ConsultationPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/lp" className="flex items-center gap-2 text-[#B08968] hover:opacity-80 transition">
              <ArrowLeft size={20} />
              <span className="text-lg font-bold">buddybow</span>
            </Link>
            <h1 className="text-xl font-bold text-stone-800">無料診断</h1>
            <div className="w-24"></div> {/* 中央揃えのためのスペーサー */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="max-w-2xl mx-auto">
          {/* 成功メッセージ */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">無料診断へようこそ</h2>
            <p className="text-stone-600 mb-6">
              公式LINEに登録して、あなたの「行動ブレーキ」を診断しましょう
            </p>
          </div>

          {/* 診断で得られるもの */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 mb-8">
            <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              <Compass className="text-[#B08968]" size={24} />
              無料診断で得られるもの
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-[#FAF9F6] rounded-xl">
                <div className="w-10 h-10 bg-[#B08968] text-white rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">現状の「行動ブレーキ」の特定</h4>
                  <p className="text-sm text-stone-600">なぜ動けないのか？行動心理学に基づき、あなたの思考のクセや心理的バリアを診断します。</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-[#FAF9F6] rounded-xl">
                <div className="w-10 h-10 bg-[#B08968] text-white rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">あなたに合った副業ジャンルの提案</h4>
                  <p className="text-sm text-stone-600">あなたの特性に合わせて、最適な副業ジャンルを提案します。</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-[#FAF9F6] rounded-xl">
                <div className="w-10 h-10 bg-[#B08968] text-white rounded-full flex items-center justify-center shrink-0 font-bold">3</div>
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">90日間のリブートロードマップ案</h4>
                  <p className="text-sm text-stone-600">診断結果に基づき、あなた専用の90日間の行動計画を提案します。</p>
                </div>
              </div>
            </div>
          </div>

          {/* LINE登録への誘導 */}
          <div className="bg-gradient-to-br from-[#06C755] to-[#00B900] rounded-3xl p-8 md:p-12 text-white shadow-xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageCircle size={32} />
                <h3 className="text-2xl md:text-3xl font-bold">公式LINEに登録して無料診断を受ける</h3>
              </div>
              <p className="text-white/90 text-lg mb-6">
                相談の詳細や診断結果、最新の情報をお届けします
              </p>
            </div>
            
            {/* LINE QRコード表示エリア（オプション） */}
            {process.env.NEXT_PUBLIC_LINE_QR_CODE_URL && (
              <div className="mb-6 flex justify-center">
                <div className="bg-white p-4 rounded-2xl">
                  <img
                    src={process.env.NEXT_PUBLIC_LINE_QR_CODE_URL}
                    alt="LINE QRコード"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}
            
            <a
              href={process.env.NEXT_PUBLIC_LINE_URL || "https://lin.ee/YOUR_LINE_ID"}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-5 bg-white text-[#06C755] rounded-xl font-bold text-xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
            >
              <MessageCircle size={24} />
              LINEで友だち追加して診断を受ける
              <ExternalLink size={20} />
            </a>
            
            <p className="text-xs text-white/80 mt-6 text-center">
              ※ LINE登録後、診断フォームが表示されます。診断は無料です。
            </p>
          </div>

          {/* 補足情報 */}
          <div className="mt-8 bg-[#FFF8F0] border border-[#E6CCB2] rounded-2xl p-6">
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Target size={18} className="text-[#B08968]" />
              診断について
            </h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-[#B08968] mt-1">•</span>
                <span>診断は完全無料です。強引な勧誘は一切行いません。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B08968] mt-1">•</span>
                <span>診断結果は、あなたの特性に合わせた個別のロードマップとして提供されます。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B08968] mt-1">•</span>
                <span>ご不明な点がございましたら、LINEからお気軽にお問い合わせください。</span>
              </li>
            </ul>
          </div>

          {/* 戻るボタン */}
          <div className="mt-8 text-center">
            <Link
              href="/lp"
              className="inline-block px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-all"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
