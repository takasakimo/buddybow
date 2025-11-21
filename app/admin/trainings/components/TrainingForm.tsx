'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Module {
  id?: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
}

interface TrainingFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: string | null;
    modules?: Module[];
  };
}

export default function TrainingForm({ initialData }: TrainingFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [modules, setModules] = useState<Module[]>(
    initialData?.modules?.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description || '',
      imageUrl: m.imageUrl || '',
      videoUrl: m.videoUrl || '',
      order: m.order,
    })) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingModuleIndex, setUploadingModuleIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
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

  const handleModuleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, moduleIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setUploadingModuleIndex(moduleIndex);
    setError('');

    try {
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
      updateModule(moduleIndex, 'imageUrl', data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
    } finally {
      setUploadingModuleIndex(null);
    }
  };

  const addModule = () => {
    setModules([...modules, { 
      title: '', 
      description: '', 
      imageUrl: '',
      videoUrl: '',
      order: modules.length + 1 
    }]);
  };

  const removeModule = (index: number) => {
    const newModules = modules.filter((_, i) => i !== index);
    newModules.forEach((mod, i) => {
      mod.order = i + 1;
    });
    setModules(newModules);
  };

  const updateModule = (index: number, field: keyof Module, value: string | number) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setModules(newModules);
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
          categoryId: categoryId || null,
          modules: modules.map(m => ({
            title: m.title,
            description: m.description || null,
            imageUrl: m.imageUrl || null,
            videoUrl: m.videoUrl || null,
            order: m.order,
          })),
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">基本情報</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
            研修タイトル *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="例: スマートフォン販売基礎研修"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-2">
            カテゴリ
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">カテゴリを選択</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
            説明
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="研修の概要を入力してください"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            サムネイル画像 (1280×720px) *
          </label>
          
          <div className="space-y-4">
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

            <div>
              <p className="text-sm text-gray-900 mb-2">または画像URLを入力:</p>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {imageUrl && (
              <div>
                <p className="text-sm text-gray-900 mb-2">プレビュー:</p>
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
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">チャプター</h2>
          <button
            type="button"
            onClick={addModule}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            チャプター追加
          </button>
        </div>

        {modules.length === 0 ? (
          <p className="text-gray-900 text-center py-8">
            チャプターを追加してください
          </p>
        ) : (
          <div className="space-y-6">
            {modules.map((mod, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-gray-900 text-lg">
                    チャプター {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeModule(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      タイトル *
                    </label>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => updateModule(index, 'title', e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="例: 基本操作を学ぶ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      説明 (Markdown記法対応)
                    </label>
                    <textarea
                      value={mod.description || ''}
                      onChange={(e) => updateModule(index, 'description', e.target.value)}
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-mono text-sm"
                      placeholder={`テキストの途中に画像を挿入できます。

使い方:
![画像の説明](画像のURL)

例:
AIについて説明します。

![AIの概念図](https://example.com/ai-image.jpg)

このように画像を挿入できます。`}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      💡 画像を挿入: <code className="bg-gray-100 px-2 py-1 rounded">![説明](画像URL)</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      サムネイル画像 (1280×720px)
                    </label>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`moduleFileUpload-${index}`}
                          className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                          {uploadingModuleIndex === index ? 'アップロード中...' : 'ファイルを選択'}
                        </label>
                        <input
                          type="file"
                          id={`moduleFileUpload-${index}`}
                          accept="image/*"
                          onChange={(e) => handleModuleFileUpload(e, index)}
                          disabled={uploadingModuleIndex === index}
                          className="hidden"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          JPG, PNG, GIF (1280×720px、最大5MB)
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-900 mb-2">または画像URLを入力:</p>
                        <input
                          type="url"
                          value={mod.imageUrl || ''}
                          onChange={(e) => updateModule(index, 'imageUrl', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      {mod.imageUrl && (
                        <div>
                          <p className="text-sm text-gray-900 mb-2">プレビュー:</p>
                          <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={mod.imageUrl}
                              alt="チャプターサムネイル"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      動画URL
                    </label>
                    <input
                      type="url"
                      value={mod.videoUrl || ''}
                      onChange={(e) => updateModule(index, 'videoUrl', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="https://vimeo.com/1138786209/32ff031622"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Vimeo、YouTubeなどの動画URLを入力してください
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || isUploading || uploadingModuleIndex !== null}
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
