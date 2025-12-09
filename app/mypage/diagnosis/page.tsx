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

  // 固定の診断URL（環境変数から取得、デフォルト値）
  const DIAGNOSIS_BASE_URL = process.env.NEXT_PUBLIC_DIAGNOSIS_URL || 'https://buddybow-diagnosis-cb1bweb9y-aims-projects-264acc6a.vercel.app/diagnosis';

  useEffect(() => {
    fetchData();
  }, []);

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
              buddybow詳細診断を受けると、診断結果が管理者によってマイページに追加されます。
              診断完了後、管理者が結果を追加次第、こちらに表示されます。
            </p>
            <div className="flex items-center gap-3">
              <a
                href={DIAGNOSIS_BASE_URL}
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
                上記の「詳細診断を受ける」ボタンから診断を受けた後、管理者が結果を追加します
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
