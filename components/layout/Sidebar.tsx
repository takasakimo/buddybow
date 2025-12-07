'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { 
  Home, 
  User, 
  BookOpen, 
  Users, 
  Settings, 
  Tag, 
  Bell, 
  GraduationCap, 
  BarChart3,
  LogOut,
  Target
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
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
      icon: <Home className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'マイページ',
      href: '/mypage',
      icon: <User className="w-5 h-5" />,
      allowedRoles: ['USER'],
    },
    {
      name: '研修一覧',
      href: '/trainings',
      icon: <BookOpen className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'ユーザー管理',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: '研修管理',
      href: '/admin/trainings',
      icon: <Settings className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: 'カテゴリ管理',
      href: '/admin/categories',
      icon: <Tag className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: 'お知らせ管理',
      href: '/admin/announcements',
      icon: <Bell className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: '勉強会管理',
      href: '/admin/study-sessions',
      icon: <GraduationCap className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN'],
    },
    {
      name: '受講者マイページ管理',
      href: '/admin/user-progress',
      icon: <BarChart3 className="w-5 h-5" />,
      allowedRoles: ['FULL_ADMIN', 'MANAGER'],
    },
  ];

  // ロールの後方互換性を確保（既存のadmin/userも動作するように）
  const getUserRole = () => {
    const role = session?.user?.role || 'user';
    // 既存のロールを新しいロールにマッピング
    if (role === 'admin') return 'FULL_ADMIN';
    if (role === 'user') return 'USER';
    return role;
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(getUserRole())
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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out flex flex-col shadow-soft ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="p-6 border-b border-slate-200">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2.5 group"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-all">
              <Target className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-lg font-semibold text-slate-900 tracking-tight">buddybow</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      // モバイルの場合のみサイドバーを閉じる
                      if (isMounted && typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-200 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <span className={isActive ? 'text-slate-700' : 'text-slate-500'}>{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="px-3 py-2.5 bg-white rounded-lg mb-2 border border-slate-200">
            <p className="text-sm font-medium text-slate-900">{session?.user?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 flex items-center justify-center gap-2 font-medium"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </aside>
    </>
  );
}
