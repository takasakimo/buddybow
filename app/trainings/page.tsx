'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen, Search } from 'lucide-react';

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
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-slate-700" />
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
              研修一覧
            </h1>
          </div>
          
          {/* 検索とフィルター */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="研修を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 bg-white transition-all"
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
          <div className="text-center py-16">
            <p className="text-slate-600">読み込み中...</p>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="card p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700">
              {searchQuery || selectedCategory
                ? '条件に一致する研修が見つかりませんでした。'
                : '現在、利用可能な研修はありません。'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(trainingsByCategory).map(([categoryName, categoryTrainings]) => (
              <div key={categoryName}>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {categoryName}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                    {categoryTrainings.length}件
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTrainings.map((training) => (
                    <Link
                      key={training.id}
                      href={`/trainings/${training.id}`}
                      className="card card-hover overflow-hidden group"
                    >
                      {training.imageUrl ? (
                        <div className="relative w-full h-48 bg-slate-100 rounded-t-xl overflow-hidden">
                          <Image
                            src={training.imageUrl}
                            alt={training.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-xl flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-slate-400" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold mb-2 text-slate-900 line-clamp-2 group-hover:text-slate-700 transition-colors">
                          {training.title}
                        </h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {training.description || '説明なし'}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                          <span className="text-xs text-slate-500 font-medium">
                            チャプター数: {training.modules.length}
                          </span>
                          <span className="text-sm text-slate-900 font-medium group-hover:text-slate-700 transition-colors">
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
