import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Target, FileText, Calendar } from 'lucide-react';

export default async function DiagnosisPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id as string);

  // 診断結果を取得
  const diagnoses = await prisma.diagnosis.findMany({
    where: { userId },
    select: {
      id: true,
      personalityType: true,
      pdfUrl: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

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

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">診断結果</h2>
          </div>
          {diagnoses.length === 0 ? (
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

