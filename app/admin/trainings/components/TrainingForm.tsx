'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface TrainingFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
  };
}

export default function TrainingForm({ initialData }: TrainingFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 画像のサイズをチェック
      const img = new window.Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          if (img.width !== 1280 || img.height !== 720) {
            reject(new Error('画像サイズは1280×720pxである必要があります'));
          } else {
            resolve(true);
          }
        };
        img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
        img.src = imageUrl;
      });

      URL.revokeObjectURL(imageUrl);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = initialData
        ? `/api/admin/trainings/${initialData.id}`
        : '/api/admin/trainings';
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      router.push('/admin/trainings');
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
          研修タイトル *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="例: スマートフォン販売基礎研修"
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
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="研修の概要を入力してください"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          サムネイル画像 (1280×720px) *
        </label>
        
        <div className="space-y-4">
          {/* ファイルアップロード */}
          <div>
            <label
              htmlFor="fileUpload"
              className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
            >
              {isUploading ? 'アップロード中...' : 'ファイルを選択'}
            </label>
            <input
              type="file"
              id="fileUpload"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <p className="mt-2 text-sm text-gray-500">
              JPG, PNG, GIF (1280×720px、最大5MB)
            </p>
          </div>

          {/* URLから入力 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">または画像URLを入力:</p>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* プレビュー */}
          {imageUrl && (
            <div>
              <p className="text-sm text-gray-600 mb-2">プレビュー:</p>
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="サムネイルプレビュー"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                画像を削除
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
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
