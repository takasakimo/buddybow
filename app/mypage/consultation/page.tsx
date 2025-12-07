import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageSquare } from 'lucide-react';

export default async function ConsultationPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id as string);

  // 相談履歴を取得
  const consultations = await prisma.consultation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-stone-800 mb-2 tracking-tight">
            相談履歴
          </h1>
          <p className="text-stone-600 text-sm">
            過去の相談内容を確認できます
          </p>
        </header>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-stone-700" />
            <h2 className="text-lg font-semibold text-stone-800">相談履歴</h2>
          </div>
          {consultations.length === 0 ? (
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
                      <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
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

