'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ModuleFormProps {
  trainingId: string;
  nextOrder: number;
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    order: number;
  };
}

export default function ModuleForm({ trainingId, nextOrder, initialData }: ModuleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [order, setOrder] = useState(initialData?.order || nextOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = initialData
        ? `/api/admin/trainings/${trainingId}/modules/${initialData.id}`
        : `/api/admin/trainings/${trainingId}/modules`;
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          order,
        }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      router.push(`/trainings/${trainingId}`);
      router.refresh();
    } catch {
      setError('保存に失敗しました');
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          チャプタータイトル *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="例: 基本操作を学ぶ"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="チャプターの概要を入力してください"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
          表示順序 *
        </label>
        <input
          type="number"
          id="order"
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value))}
          min="1"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-2 text-sm text-gray-500">
          チャプターの表示順序を指定してください
        </p>
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
