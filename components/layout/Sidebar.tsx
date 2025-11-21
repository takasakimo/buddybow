'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  allowedRoles: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems: MenuItem[] = [
    {
      name: 'ダッシュボード',
      href: '/dashboard',
      icon: '🏠',
      allowedRoles: ['admin', 'user'],
    },
    {
      name: 'マイページ',
      href: '/mypage',
      icon: '👤',
      allowedRoles: ['user'],
    },
    {
      name: '研修一覧',
      href: '/trainings',
      icon: '📚',
      allowedRoles: ['admin', 'user'],
    },
    {
      name: 'ユーザー管理',
      href: '/admin/users',
      icon: '👥',
      allowedRoles: ['admin'],
    },
    {
      name: '研修管理',
      href: '/admin/trainings',
      icon: '⚙️',
      allowedRoles: ['admin'],
    },
    {
      name: 'カテゴリ管理',
      href: '/admin/categories',
      icon: '🏷️',
      allowedRoles: ['admin'],
    },
    {
      name: 'お知らせ管理',
      href: '/admin/announcements',
      icon: '📢',
      allowedRoles: ['admin'],
    },
    {
      name: '勉強会管理',
      href: '/admin/study-sessions',
      icon: '🎓',
      allowedRoles: ['admin'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(session?.user?.role || 'user')
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold text-gray-900">buddybow</span>
        </Link>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
          <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
          <p className="text-xs text-gray-500">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}
