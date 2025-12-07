'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface TrainingCategory {
  id: string;
  name: string;
}

interface Training {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: TrainingCategory | null;
  modules: { id: string }[];
  progress: {
    progressPercent: number;
    startedAt: Date;
    completedAt: Date | null;
  } | null;
}

export default function TrainingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'title' | 'modules'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTrainings();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedCategory]);

  const fetchTrainings = async () => {
    try {
      const url =
        selectedCategory === 'all'
          ? '/api/trainings'
          : `/api/trainings?categoryId=${selectedCategory}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTrainings(data);
      }
    } catch (error) {
      console.error('研修データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('カテゴリーデータ取得エラー:', error);
    }
  };

  const handleSort = (field: 'title' | 'modules') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'title' | 'modules') => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const sortedTrainings = [...trainings].sort((a, b) => {
    let compareValue = 0;

    if (sortField === 'title') {
      compareValue = a.title.localeCompare(b.title, 'ja');
    } else if (sortField === 'modules') {
      compareValue = a.modules.length - b.modules.length;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const filteredTrainings = sortedTrainings.filter((training) => {
    const matchesSearch = searchQuery === '' ||
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (training.description && training.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📚 研修プログラム
            </h1>
            <p className="text-gray-600">
              通信業界の即戦力になるための研修プログラム
            </p>
          </div>
          
          {/* 管理者のみ表示 */}
          {(session?.user?.role === 'FULL_ADMIN' || session?.user?.role === 'MANAGER') && (
            <button
              onClick={() => router.push('/admin/trainings')}
              className="px-6 py-3 bg-buddybow-orange text-white rounded-lg font-medium hover:bg-buddybow-orange-dark transition-colors flex items-center gap-2"
            >
              ⚙️ 研修を管理
            </button>
          )}
        </div>

        {/* カテゴリーフィルター */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-buddybow-orange text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              すべて
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-buddybow-orange text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 検索とソート */}
        {trainings.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            {/* 検索 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 キーワード検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトルや説明文で検索..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* 件数表示 */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>{filteredTrainings.length}件表示</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-buddybow-orange hover:text-buddybow-orange-dark"
                >
                  クリア
                </button>
              )}
            </div>

            {/* ソート */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">並び替え:</span>
                <button
                  onClick={() => handleSort('title')}
                  className={`px-3 py-1 text-sm rounded ${
                    sortField === 'title'
                      ? 'bg-buddybow-beige-light text-buddybow-orange-dark'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  タイトル順 {getSortIcon('title')}
                </button>
                <button
                  onClick={() => handleSort('modules')}
                  className={`px-3 py-1 text-sm rounded ${
                    sortField === 'modules'
                      ? 'bg-buddybow-beige-light text-buddybow-orange-dark'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  チャプター数順 {getSortIcon('modules')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 研修一覧 */}
        {filteredTrainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">
              {trainings.length === 0
                ? '研修がまだありません'
                : '検索条件に一致する研修がありません'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainings.map((training) => (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/trainings/${training.id}`)}
              >
                {/* サムネイル */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                  {training.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={training.imageUrl}
                      alt={training.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 画像読み込みエラー時はアイコン表示にフォールバック
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('span')) {
                          const iconSpan = document.createElement('span');
                          iconSpan.className = 'text-6xl';
                          iconSpan.textContent = '📚';
                          parent.appendChild(iconSpan);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-6xl">📚</span>
                  )}
                </div>

                {/* コンテンツ */}
                <div className="p-5">
                  {/* カテゴリー */}
                  {training.category && (
                    <div className="mb-3">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {training.category.name}
                      </span>
                    </div>
                  )}

                  {/* タイトル */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {training.title}
                  </h3>

                  {/* 説明 */}
                  {training.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {training.description}
                    </p>
                  )}

                  {/* メタ情報 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>📝 {training.modules.length}チャプター</span>
                  </div>

                  {/* 進捗バー */}
                  {training.progress && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">進捗</span>
                        <span className="text-xs font-semibold text-buddybow-orange">
                          {training.progress.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-buddybow-orange h-2 rounded-full transition-all"
                          style={{
                            width: `${training.progress.progressPercent}%`,
                          }}
                        ></div>
                      </div>
                      {training.progress.completedAt && (
                        <span className="inline-block mt-2 text-xs text-green-600 font-medium">
                          ✓ 修了済み
                        </span>
                      )}
                    </div>
                  )}

                  {/* 未受講の場合 */}
                  {!training.progress && (
                    <div className="mt-4">
                      <button className="w-full bg-buddybow-orange text-white py-2 rounded-lg text-sm font-medium hover:bg-buddybow-orange-dark transition-colors">
                        受講を開始
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
