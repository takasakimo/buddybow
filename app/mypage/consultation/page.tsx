'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageSquare, Plus, Send } from 'lucide-react';

interface Consultation {
  id: string;
  title: string;
  content: string;
  status: string;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
}

export default function ConsultationPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const response = await fetch('/api/mypage/consultations');
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      }
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mypage/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('相談を送信しました。担当管理者に通知が送られました。');
        setFormData({ title: '', content: '' });
        setShowForm(false);
        fetchConsultations();
      } else {
        const data = await response.json();
        alert(data.error || '相談の送信に失敗しました');
      }
    } catch (error) {
      console.error('Failed to submit consultation:', error);
      alert('相談の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-stone-800 mb-2 tracking-tight">
                相談
              </h1>
              <p className="text-stone-600 text-sm">
                学習やキャリアについて相談できます
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                新しい相談を作成
              </button>
            )}
          </div>
        </header>

        {showForm && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-stone-800">新しい相談を作成</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', content: '' });
                }}
                className="text-stone-600 hover:text-stone-800"
              >
                キャンセル
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-buddybow-beige-accent rounded-lg focus:ring-2 focus:ring-buddybow-orange focus:border-transparent"
                  placeholder="相談のタイトルを入力"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-buddybow-beige-accent rounded-lg focus:ring-2 focus:ring-buddybow-orange focus:border-transparent"
                  placeholder="相談内容を詳しく入力してください"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? '送信中...' : '送信する'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', content: '' });
                  }}
                  className="px-6 py-2.5 bg-white text-stone-700 rounded-lg border border-buddybow-beige-accent hover:bg-buddybow-beige-light transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-stone-700" />
            <h2 className="text-lg font-semibold text-stone-800">相談履歴</h2>
          </div>
          {isLoading ? (
            <p className="text-stone-500 text-sm py-4">読み込み中...</p>
          ) : consultations.length === 0 ? (
            <p className="text-stone-500 text-sm py-4">まだ相談がありません</p>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-4 bg-buddybow-beige-light rounded-xl border border-buddybow-beige-accent"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-stone-800 mb-2">
                        {consultation.title}
                      </h3>
                      <p className="text-sm text-stone-600 whitespace-pre-wrap mb-3">
                        {consultation.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>
                          {new Date(consultation.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full font-medium ${
                            consultation.status === 'answered'
                              ? 'bg-green-100 text-green-700'
                              : consultation.status === 'closed'
                              ? 'bg-stone-100 text-stone-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {consultation.status === 'answered' && '回答済み'}
                          {consultation.status === 'closed' && '完了'}
                          {consultation.status === 'pending' && '回答待ち'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {consultation.answer && (
                    <div className="mt-4 pt-4 border-t border-buddybow-beige-accent">
                      <h4 className="text-sm font-semibold text-stone-800 mb-2">回答</h4>
                      <p className="text-sm text-stone-600 whitespace-pre-wrap">
                        {consultation.answer}
                      </p>
                      {consultation.answeredAt && (
                        <p className="text-xs text-stone-500 mt-2">
                          回答日: {new Date(consultation.answeredAt).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

