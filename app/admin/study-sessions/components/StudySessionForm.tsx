'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StudySessionFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    zoomId: string | null;
  };
}

export default function StudySessionForm({ initialData }: StudySessionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  
  const getJSTDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
  };
  
  const [date, setDate] = useState(
    initialData 
      ? getJSTDate(initialData.startTime).toISOString().split('T')[0]
      : ''
  );
  const [startTime, setStartTime] = useState(
    initialData 
      ? getJSTDate(initialData.startTime).toISOString().split('T')[1].slice(0, 5)
      : ''
  );
  const [endTime, setEndTime] = useState(
    initialData 
      ? getJSTDate(initialData.endTime).toISOString().split('T')[1].slice(0, 5)
      : ''
  );
  const [zoomId, setZoomId] = useState(initialData?.zoomId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const startDateTime = new Date(`${date}T${startTime}:00+09:00`);
      const endDateTime = new Date(`${date}T${endTime}:00+09:00`);

      if (endDateTime <= startDateTime) {
        setError('終了時刻は開始時刻より後にしてください');
        setIsSubmitting(false);
        return;
      }

      const url = initialData
        ? `/api/admin/study-sessions/${initialData.id}`
        : '/api/admin/study-sessions';
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          zoomId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      router.push('/admin/study-sessions');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
          タイトル *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="例: AI活用勉強会"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-2">
          開催日 *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          autoComplete="off"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-900 mb-2">
            開始時刻 * (日本時間)
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            autoComplete="off"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-900 mb-2">
            終了時刻 * (日本時間)
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            autoComplete="off"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="zoomId" className="block text-sm font-medium text-gray-900 mb-2">
          Zoom ID
        </label>
        <input
          type="text"
          id="zoomId"
          name="zoomId"
          autoComplete="off"
          value={zoomId}
          onChange={(e) => setZoomId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="例: 123 456 7890"
        />
        <p className="mt-2 text-sm text-gray-500">
          ※パスワードは参加希望者に別途お知らせします
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
          コメント
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="勉強会の概要や注意事項を入力してください"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? '保存中...' : initialData ? '更新' : '作成'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
