"use client";

import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, ArrowLeft, CheckCircle2, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type TimeSlot = {
  time: string;
  available: boolean;
};

type DaySchedule = {
  date: Date;
  dateStr: string;
  dayName: string;
  slots: TimeSlot[];
};

export default function ConsultationPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'form' | 'confirm'>('select');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1週間分の日付を生成
  const generateWeekSchedule = (): DaySchedule[] => {
    const today = new Date();
    const week: DaySchedule[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayName = dayNames[date.getDay()];
      
      // 10:00~21:00の60分刻みの時間枠を生成
      const slots: TimeSlot[] = [];
      for (let hour = 10; hour < 21; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        // 簡単な例：過去の日付や今日の過去の時間は予約不可
        const isPast = i === 0 && hour < today.getHours();
        slots.push({
          time: timeStr,
          available: !isPast,
        });
      }
      
      week.push({
        date,
        dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
        dayName,
        slots,
      });
    }
    
    return week;
  };

  const weekSchedule = generateWeekSchedule();

  const handleTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate?.toISOString(),
          time: selectedTime,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '予約の送信に失敗しました');
      }

      setStep('confirm');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予約の送信に失敗しました';
      setError(errorMessage || '予約の送信に失敗しました。しばらくしてから再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('select');
    } else if (step === 'confirm') {
      setStep('form');
    }
  };

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
            <h1 className="text-xl font-bold text-stone-800">無料相談予約</h1>
            <div className="w-24"></div> {/* 中央揃えのためのスペーサー */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {step === 'select' && (
          <div className="space-y-8">
            {/* 説明セクション */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <h2 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-3">
                <Calendar className="text-[#B08968]" size={28} />
                予約可能な日時を選択
              </h2>
              <p className="text-stone-600 mb-6">
                1週間先まで予約可能です。ご希望の日時を選択してください。
              </p>
              <div className="bg-[#FFF8F0] border border-[#E6CCB2] rounded-2xl p-4">
                <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#B08968]" />
                  無料相談で得られるもの
                </h3>
                <ul className="space-y-1 text-sm text-stone-600 ml-6">
                  <li>• 現状の「行動ブレーキ」の特定</li>
                  <li>• あなたに合った副業ジャンルの提案</li>
                  <li>• 90日間のリブートロードマップ案</li>
                </ul>
              </div>
            </div>

            {/* 1週間分のスケジュール */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <h3 className="text-xl font-bold text-stone-800 mb-6">予約可能な日時</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekSchedule.map((day, dayIdx) => (
                  <div key={dayIdx} className="space-y-3">
                    {/* 日付ヘッダー */}
                    <div className="text-center">
                      <div className="text-sm text-stone-500 mb-1">{day.dayName}</div>
                      <div className={`text-lg font-bold ${
                        day.date.toDateString() === new Date().toDateString()
                          ? 'text-[#B08968]'
                          : 'text-stone-800'
                      }`}>
                        {day.dateStr}
                      </div>
                    </div>

                    {/* 時間枠 */}
                    <div className="space-y-2">
                      {day.slots.map((slot, slotIdx) => (
                        <button
                          key={slotIdx}
                          onClick={() => slot.available && handleTimeSelect(day.date, slot.time)}
                          disabled={!slot.available}
                          className={`w-full py-2 px-3 text-sm rounded-lg transition-all ${
                            slot.available
                              ? 'bg-[#FAF9F6] border border-stone-200 hover:bg-[#B08968] hover:text-white hover:border-[#B08968] text-stone-700 font-medium'
                              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <div className="mb-6">
                <button
                  onClick={handleBack}
                  className="text-[#B08968] hover:text-[#9c7858] flex items-center gap-2 mb-4"
                >
                  <ArrowLeft size={18} />
                  <span>日時選択に戻る</span>
                </button>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">予約情報の入力</h2>
                <div className="flex items-center gap-4 text-stone-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#B08968]" />
                    <span>{selectedDate?.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-[#B08968]" />
                    <span>{selectedTime}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                    <User size={18} className="text-[#B08968]" />
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B08968] focus:border-transparent"
                    placeholder="山田 太郎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                    <Mail size={18} className="text-[#B08968]" />
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B08968] focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                    <Phone size={18} className="text-[#B08968]" />
                    電話番号 <span className="text-stone-400 text-xs">(任意)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B08968] focus:border-transparent"
                    placeholder="090-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    ご質問・ご要望 <span className="text-stone-400 text-xs">(任意)</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B08968] focus:border-transparent"
                    placeholder="事前に知っておきたいことなどがあればご記入ください"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#B08968] text-white rounded-xl font-bold text-lg hover:bg-[#9c7858] transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? '送信中...' : '予約を確定する'}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">予約が完了しました</h2>
                <p className="text-stone-600 mb-6">
                  ご予約ありがとうございます。確認メールを送信いたしました。
                </p>
              </div>

              <div className="bg-[#FAF9F6] rounded-2xl p-6 mb-6 text-left">
                <h3 className="font-bold text-stone-800 mb-4">予約内容</h3>
                <div className="space-y-2 text-stone-600">
                  <div className="flex justify-between">
                    <span>日時:</span>
                    <span className="font-medium">
                      {selectedDate?.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} {selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>お名前:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>メールアドレス:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                </div>
              </div>

              {/* LINE登録への誘導 */}
              <div className="bg-gradient-to-br from-[#06C755] to-[#00B900] rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MessageCircle size={24} />
                  <h3 className="text-xl font-bold">公式LINEに登録して最新情報を受け取る</h3>
                </div>
                <p className="text-white/90 text-sm mb-4">
                  相談の詳細や当日のリマインダー、最新の情報をお届けします
                </p>
                
                {/* LINE QRコード表示エリア（オプション） */}
                {process.env.NEXT_PUBLIC_LINE_QR_CODE_URL && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={process.env.NEXT_PUBLIC_LINE_QR_CODE_URL}
                      alt="LINE QRコード"
                      className="w-48 h-48 bg-white p-2 rounded-lg"
                    />
                  </div>
                )}
                
                <a
                  href={process.env.NEXT_PUBLIC_LINE_URL || "https://lin.ee/YOUR_LINE_ID"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-white text-[#06C755] rounded-xl font-bold text-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  LINEで友だち追加
                  <ExternalLink size={18} />
                </a>
                <p className="text-xs text-white/80 mt-3">
                  ※ LINE登録は任意です。登録しなくても予約は有効です。
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/lp"
                  className="block w-full py-4 bg-[#B08968] text-white rounded-xl font-bold text-lg hover:bg-[#9c7858] transition-all"
                >
                  トップページに戻る
                </Link>
                <p className="text-xs text-stone-500">
                  ※ 予約の変更・キャンセルは、確認メール内のリンクからお願いいたします。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

