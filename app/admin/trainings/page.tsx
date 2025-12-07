'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Training {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: Category | null;
  modules: { id: string }[];
}

export default function AdminTrainingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  useEffect(() => {
    // 全権管理者のみアクセス可能
    const role = getUserRole();
    if (role !== 'FULL_ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      const [trainingsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/trainings'),
        fetch('/api/admin/categories'),
      ]);

      if (trainingsRes.ok) {
        const trainingsData = await trainingsRes.json();
        setTrainings(trainingsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch {
      console.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch = training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (training.description && training.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || training.category?.id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              研修管理
            </h1>
            <Link
              href="/admin/trainings/new"
              className="px-4 py-2 bg-buddybow-orange text-white rounded-lg hover:bg-buddybow-orange-dark"
            >
              新規作成
            </Link>
          </div>

          {/* 検索とフィルター */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="研修を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {filteredTrainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-900">
              {searchQuery || selectedCategory
                ? '条件に一致する研修が見つかりませんでした。'
                : '研修が登録されていません。新規作成ボタンから研修を作成してください。'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainings.map((training) => (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                {training.imageUrl ? (
                  <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={training.imageUrl}
                      alt={training.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-6">
                  {training.category && (
                    <span className="inline-block px-3 py-1 bg-buddybow-beige-light text-buddybow-orange-dark text-sm rounded-full mb-2">
                      {training.category.name}
                    </span>
                  )}
                  <h2 className="text-xl font-semibold mb-2 text-gray-900">
                    {training.title}
                  </h2>
                  <p className="text-gray-900 text-sm mb-4 line-clamp-2">
                    {training.description || '説明なし'}
                  </p>
                  <p className="text-sm text-gray-900 mb-4">
                    チャプター数: {training.modules.length}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/trainings/${training.id}/edit`}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-center rounded-lg hover:bg-gray-300 text-sm"
                      >
                        編集
                      </Link>
                      <Link
                        href={`/trainings/${training.id}`}
                        className="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 text-sm"
                      >
                        表示
                      </Link>
                    </div>
                    <Link
                      href={`/admin/trainings/${training.id}/progress`}
                      className="w-full px-4 py-2 bg-buddybow-orange text-white text-center rounded-lg hover:bg-buddybow-orange-dark text-sm"
                    >
                      受講者進捗を見る
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
