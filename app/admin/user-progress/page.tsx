'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Map, FileText, MessageSquare, Trophy } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  userProgress: {
    currentPhase: string;
    overallProgress: number;
  } | null;
  _count: {
    roadmaps: number;
    dailyReports: number;
    consultations: number;
    achievements: number;
  };
}

export default function UserProgressPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ロールの後方互換性を確保
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  useEffect(() => {
    // 全権管理者または担当者のみアクセス可能
    const role = getUserRole();
    if (role !== 'FULL_ADMIN' && role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/user-progress');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            受講者マイページ管理
          </h1>
          <p className="text-gray-600">
            ユーザーの進捗状況とマイページ情報を管理します
          </p>
        </header>

        {/* 検索 */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ユーザー名やメールアドレスで検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  進捗状況
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  マイページ情報
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? '検索条件に一致するユーザーがありません' : 'ユーザーが登録されていません'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <span
                          className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'FULL_ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'MANAGER'
                              ? 'bg-buddybow-beige-light text-buddybow-orange-dark'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role === 'FULL_ADMIN' 
                            ? '全権管理者' 
                            : user.role === 'MANAGER'
                            ? '担当者'
                            : '一般ユーザー'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.userProgress ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">
                              {user.userProgress.currentPhase}
                            </span>
                            <span className="text-sm font-semibold text-buddybow-orange">
                              {user.userProgress.overallProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-buddybow-orange h-2 rounded-full transition-all"
                              style={{
                                width: `${user.userProgress.overallProgress}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Map className="w-4 h-4 text-slate-500" />
                          <span className="text-gray-600">
                            ロードマップ: {user._count.roadmaps}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-gray-600">
                            日報: {user._count.dailyReports}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          <span className="text-gray-600">
                            相談: {user._count.consultations}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-slate-500" />
                          <span className="text-gray-600">
                            バッジ: {user._count.achievements}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/user-progress/${user.id}`}
                        className="text-buddybow-orange hover:text-buddybow-orange-dark"
                      >
                        詳細を見る
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

