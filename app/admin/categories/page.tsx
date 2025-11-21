'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    } catch {
      console.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!response.ok) {
        throw new Error('カテゴリの作成に失敗しました');
      }

      setNewCategoryName('');
      fetchCategories();
    } catch {
      setError('カテゴリの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このカテゴリを削除しますか?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch {
      alert('削除に失敗しました');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link
            href="/admin/trainings"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 研修管理に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            カテゴリ管理
          </h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">新しいカテゴリを追加</h2>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="カテゴリ名"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? '追加中...' : '追加'}
            </button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">カテゴリ一覧</h2>
          {isLoading ? (
            <p className="text-gray-600">読み込み中...</p>
          ) : categories.length === 0 ? (
            <p className="text-gray-600">カテゴリが登録されていません</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium">{category.name}</span>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
