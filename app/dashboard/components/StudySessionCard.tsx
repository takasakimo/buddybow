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
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium mb-2 text-gray-900">{session.title}</h3>
      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <p>📅 {toJSTString(session.startTime, 'date')}</p>
        <p>
          🕐 {toJSTString(session.startTime)} - {toJSTString(session.endTime)}
        </p>
        {session.zoomId && <p>💻 Zoom ID: {session.zoomId}</p>}
      </div>
      <button
        onClick={handleParticipate}
        disabled={isLoading}
        className={`w-full py-2 rounded-lg text-sm transition-colors ${
          isParticipating
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
      >
        {isLoading ? '処理中...' : isParticipating ? '参加をキャンセル' : '参加する'}
      </button>
    </div>
  );
}
