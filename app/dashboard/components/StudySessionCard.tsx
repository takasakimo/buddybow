'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StudySessionCardProps {
  session: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    zoomId: string | null;
  };
  isParticipating: boolean;
}

export default function StudySessionCard({ session, isParticipating: initialParticipating }: StudySessionCardProps) {
  const router = useRouter();
  const [isParticipating, setIsParticipating] = useState(initialParticipating);
  const [isLoading, setIsLoading] = useState(false);

  const handleParticipate = async () => {
    setIsLoading(true);

    try {
      if (isParticipating) {
        // キャンセル
        const response = await fetch(`/api/study-sessions/${session.id}/participate`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsParticipating(false);
          router.refresh();
        } else {
          const data = await response.json();
          alert(data.error || 'キャンセルに失敗しました');
        }
      } else {
        // 参加申し込み
        const response = await fetch(`/api/study-sessions/${session.id}/participate`, {
          method: 'POST',
        });

        if (response.ok) {
          setIsParticipating(true);
          alert('参加申し込みが完了しました！管理者からZoomパスワードが送られます。');
          router.refresh();
        } else {
          const data = await response.json();
          alert(data.error || '参加申し込みに失敗しました');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 日本時間に変換
  function toJSTString(date: Date, format: 'date' | 'time' = 'time') {
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    
    if (format === 'date') {
      return jstDate.toLocaleDateString('ja-JP', { timeZone: 'UTC' });
    }
    return jstDate.toLocaleTimeString('ja-JP', { 
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="p-4 border border-slate-200 rounded-xl bg-white">
      <h3 className="font-semibold mb-3 text-slate-900 text-sm">{session.title}</h3>
      <div className="text-sm text-slate-600 space-y-2 mb-4">
        <p className="flex items-center gap-1.5">
          <span className="text-slate-400">日時:</span>
          <span>{toJSTString(session.startTime, 'date')}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-slate-400">時間:</span>
          <span>{toJSTString(session.startTime)} - {toJSTString(session.endTime)}</span>
        </p>
        {session.zoomId && (
          <p className="flex items-center gap-1.5">
            <span className="text-slate-400">Zoom ID:</span>
            <span className="font-mono text-xs">{session.zoomId}</span>
          </p>
        )}
      </div>
      <button
        onClick={handleParticipate}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isParticipating
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            : 'bg-buddybow-orange text-white hover:bg-buddybow-orange-dark shadow-sm hover:shadow'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? '処理中...' : isParticipating ? '参加をキャンセル' : '参加する'}
      </button>
    </div>
  );
}
