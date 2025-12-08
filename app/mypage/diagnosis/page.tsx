'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Target, FileText, Calendar, ExternalLink } from 'lucide-react';

interface Diagnosis {
  id: string;
  personalityType: string | null;
  pdfUrl: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function DiagnosisPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 固定の診断URL（環境変数から取得、デフォルト値）
  const DIAGNOSIS_BASE_URL = process.env.NEXT_PUBLIC_DIAGNOSIS_URL || 'https://buddybow-diagnosis-cb1bweb9y-aims-projects-264acc6a.vercel.app/diagnosis';

  useEffect(() => {
    fetchData();
    
    // ユーザーIDを取得
    fetch('/api/mypage/user-id')
      .then((res) => res.json())
      .then((data) => {
        if (data.userId) {
          setUserId(data.userId);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    // 定期的に診断結果をチェック（30秒ごと）
    const interval = setInterval(() => {
      checkDiagnosisResult();
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [userId]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/mypage/diagnoses');
      if (response.ok) {
        const data = await response.json();
        setDiagnoses(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDiagnosisResult = async () => {
    if (!userId) {
      alert('ユーザーIDが取得できませんでした。ページを再読み込みしてください。');
      return;
    }
    
    try {
      const response = await fetch('/api/mypage/diagnosis/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.checked) {
          // 診断結果を再取得
          await fetchData();
          if (data.diagnoses && data.diagnoses.length > 0) {
            alert('診断結果が見つかりました！');
          } else {
            alert('診断結果はまだ準備できていません。しばらく待ってから再度チェックしてください。');
          }
        } else {
          alert(data.message || '診断結果をチェックしました');
          await fetchData();
        }
      } else {
        alert(data.error || '診断結果のチェックに失敗しました');
      }
    } catch (error) {
      console.error('Failed to check diagnosis result:', error);
      alert('診断結果のチェックに失敗しました。コンソールを確認してください。');
    }
  };

  // 診断URLを生成（ユーザーIDをパラメータとして付与）
  const getDiagnosisUrl = () => {
    if (!userId) return DIAGNOSIS_BASE_URL;
    const url = new URL(DIAGNOSIS_BASE_URL);
    url.searchParams.set('userId', userId);
    return url.toString();
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

        {/* 詳細診断へのリンク */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">buddybow詳細診断</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              buddybow詳細診断を受けると、診断結果が自動的にマイページに保存されます。
              診断完了後、結果が準備でき次第、自動的に表示されます。
            </p>
            <div className="flex items-center gap-3">
              <a
                href={getDiagnosisUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark transition-colors font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                詳細診断を受ける
              </a>
            </div>
          </div>
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
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-4">診断結果はまだありません</p>
              <p className="text-xs text-slate-400">
                上記の「詳細診断を受ける」ボタンから診断を受けてください
              </p>
            </div>
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
