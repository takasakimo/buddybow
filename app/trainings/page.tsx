'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';

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

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trainingsRes, categoriesRes] = await Promise.all([
        fetch('/api/trainings'),
        fetch('/api/categories'),
      ]);

      if (trainingsRes.ok) {
        const trainingsData = await trainingsRes.json();
        setTrainings(trainingsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  // カテゴリ別にグループ化
  const trainingsByCategory = filteredTrainings.reduce((acc, training) => {
    const categoryName = training.category?.name || 'その他';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(training);
    return acc;
  }, {} as Record<string, Training[]>);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            研修一覧
          </h1>
          
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
        
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-900">
              {searchQuery || selectedCategory
                ? '条件に一致する研修が見つかりませんでした。'
                : '現在、利用可能な研修はありません。'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(trainingsByCategory).map(([categoryName, categoryTrainings]) => (
              <div key={categoryName}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                    {categoryName}
                  </span>
                  <span className="text-sm text-gray-600">
                    {categoryTrainings.length}件
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTrainings.map((training) => (
                    <Link
                      key={training.id}
                      href={`/trainings/${training.id}`}
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
                          <span className="text-4xl text-gray-400">📚</span>
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">
                          {training.title}
                        </h3>
                        <p className="text-gray-900 text-sm mb-4 line-clamp-2">
                          {training.description || '説明なし'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">
                            チャプター数: {training.modules.length}
                          </span>
                          <span className="text-blue-600 font-medium">
                            開始 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
