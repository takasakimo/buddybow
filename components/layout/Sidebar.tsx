'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  allowedRoles: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // デスクトップではサイドバーを常に閉じる
    const checkDesktop = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        setIsOpen(false);
      }
    };
    
    // 初回チェック
    if (typeof window !== 'undefined') {
      checkDesktop();
      window.addEventListener('resize', checkDesktop);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkDesktop);
      }
    };
  }, []);

  const menuItems: MenuItem[] = [
    {
      name: 'ダッシュボード',
      href: '/dashboard',
      icon: '🏠',
      allowedRoles: ['FULL_ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'マイページ',
      href: '/mypage',
      icon: '👤',
      allowedRoles: ['USER'],
    },
    {
      name: '研修一覧',
      href: '/trainings',
      icon: '📚',
      allowedRoles: ['FULL_ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'ユーザー管理',
      href: '/admin/users',
      icon: '👥',
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: '研修管理',
      href: '/admin/trainings',
      icon: '⚙️',
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: 'カテゴリ管理',
      href: '/admin/categories',
      icon: '🏷️',
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: 'お知らせ管理',
      href: '/admin/announcements',
      icon: '📢',
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: '勉強会管理',
      href: '/admin/study-sessions',
      icon: '🎓',
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: '受講者マイページ管理',
      href: '/admin/user-progress',
      icon: '📊',
      allowedRoles: ['FULL_ADMIN', 'MANAGER'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(session?.user?.role || 'USER')
  );

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => {
          if (isMounted && typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsOpen(!isOpen);
          }
        }}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* オーバーレイ - モバイルのみ表示（デスクトップでは絶対に表示しない） */}
      {(() => {
        if (!isMounted || !isOpen) return null;
        if (typeof window === 'undefined') return null;
        if (window.innerWidth >= 1024) return null;
        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
            onTouchStart={() => setIsOpen(false)}
          />
        );
      })()}

      {/* サイドバー */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold text-gray-900">buddybow</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
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
    </>
  );
}
