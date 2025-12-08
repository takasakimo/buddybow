'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Target, FileText, Calendar, Link as LinkIcon, Plus, Loader2 } from 'lucide-react';

interface Diagnosis {
  id: string;
  personalityType: string | null;
  pdfUrl: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DiagnosisUrl {
  id: string;
  url: string;
  status: string;
  errorMessage: string | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
}

export default function DiagnosisPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [diagnosisUrls, setDiagnosisUrls] = useState<DiagnosisUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosisUrl, setDiagnosisUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
    
    // 定期的に診断結果をチェック（30秒ごと）
    const interval = setInterval(() => {
      // pending状態のURLがある場合のみチェック
      const hasPendingUrls = diagnosisUrls.some((url) => url.status === 'pending' || url.status === 'processing');
      if (hasPendingUrls) {
        fetchData();
      }
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [diagnosisUrls]);

  const fetchData = async () => {
    try {
      const [diagnosesRes, urlsRes] = await Promise.all([
        fetch('/api/mypage/diagnoses'),
        fetch('/api/mypage/diagnosis-url'),
      ]);

      if (diagnosesRes.ok) {
        const data = await diagnosesRes.json();
        setDiagnoses(data);
      }

      if (urlsRes.ok) {
        const data = await urlsRes.json();
        setDiagnosisUrls(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisUrl.trim()) {
      alert('診断URLを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mypage/diagnosis-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: diagnosisUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || '診断URLを登録しました。診断結果が準備でき次第、自動的にマイページに保存されます。');
        setDiagnosisUrl('');
        setShowForm(false);
        fetchData();
      } else {
        alert(data.error || '診断URLの登録に失敗しました');
      }
    } catch (error) {
      console.error('Failed to submit diagnosis URL:', error);
      alert('診断URLの登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
            診断
          </h1>
          <p className="text-slate-600 text-sm">
            あなたのスキルや適性を診断します
          </p>
        </header>

        {/* 診断URL登録フォーム */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">診断URL登録</h2>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                診断URLを追加
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  buddybow詳細診断のURL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={diagnosisUrl}
                  onChange={(e) => setDiagnosisUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-buddybow-beige-accent rounded-lg focus:ring-2 focus:ring-buddybow-orange focus:border-transparent"
                  placeholder="https://..."
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  buddybow詳細診断のURLを貼り付けてください。診断結果が準備でき次第、自動的にマイページに保存されます。
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !diagnosisUrl.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    '登録する'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setDiagnosisUrl('');
                  }}
                  className="px-6 py-2.5 bg-white text-slate-700 rounded-lg border border-buddybow-beige-accent hover:bg-buddybow-beige-light transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {/* 登録済みの診断URL一覧 */}
          {diagnosisUrls.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-3">登録済みの診断URL</h3>
              <div className="space-y-2">
                {diagnosisUrls.map((url) => (
                  <div
                    key={url.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-buddybow-orange hover:text-buddybow-orange-dark break-all"
                        >
                          {url.url}
                        </a>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              url.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : url.status === 'processing'
                                ? 'bg-blue-100 text-blue-700'
                                : url.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {url.status === 'completed' && '完了'}
                            {url.status === 'processing' && '処理中'}
                            {url.status === 'failed' && '失敗'}
                            {url.status === 'pending' && '待機中'}
                          </span>
                          {url.lastCheckedAt && (
                            <span>
                              最終確認: {new Date(url.lastCheckedAt).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </div>
                        {url.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">{url.errorMessage}</p>
                        )}
                      </div>
                      {url.status === 'pending' && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/mypage/diagnosis-url/check', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ diagnosisUrlId: url.id }),
                              });
                              if (response.ok) {
                                alert('診断結果をチェックしました');
                                fetchData();
                              } else {
                                const data = await response.json();
                                alert(data.error || '診断結果のチェックに失敗しました');
                              }
                            } catch (error) {
                              console.error('Failed to check diagnosis:', error);
                              alert('診断結果のチェックに失敗しました');
                            }
                          }}
                          className="mt-2 px-3 py-1.5 text-xs bg-buddybow-orange text-white rounded hover:bg-buddybow-orange-dark transition-colors"
                        >
                          結果をチェック
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 診断結果 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">診断結果</h2>
          </div>
          {isLoading ? (
            <p className="text-slate-500 text-sm py-4">読み込み中...</p>
          ) : diagnoses.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">診断結果はまだありません</p>
          ) : (
            <div className="space-y-4">
              {diagnoses.map((diagnosis) => (
                <div
                  key={diagnosis.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(diagnosis.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {diagnosis.comment && (
                    <div className="text-sm text-slate-900 mb-3 whitespace-pre-wrap leading-relaxed">
                      {diagnosis.comment}
                    </div>
                  )}
                  {diagnosis.pdfUrl && (
                    <a
                      href={diagnosis.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      PDFを表示
                    </a>
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

