'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  publishedAt: string;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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

    fetchAnnouncements();
  }, [session, router]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch {
      console.error('Failed to fetch announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このお知らせを削除しますか?')) return;

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAnnouncements();
      } else {
        alert('削除に失敗しました');
      }
    } catch {
      alert('削除に失敗しました');
    }
  };

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
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            お知らせ管理
          </h1>
          <Link
            href="/admin/announcements/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            新規作成
          </Link>
        </header>

        <div className="bg-white rounded-lg shadow">
          {announcements.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              お知らせがありません
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            announcement.category === 'news'
                              ? 'bg-blue-100 text-blue-800'
                              : announcement.category === 'event'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {announcement.category === 'news' && 'ニュース'}
                          {announcement.category === 'event' && 'イベント'}
                          {announcement.category === 'update' && 'アップデート'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            announcement.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {announcement.isPublished ? '公開中' : '下書き'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(announcement.publishedAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/admin/announcements/${announcement.id}/edit`}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
