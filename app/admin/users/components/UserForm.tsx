'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: string;
    assignedAdminId?: string;
  };
}

export default function UserForm({ initialData }: UserFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialData?.role || 'USER');
  const [assignedAdminId, setAssignedAdminId] = useState(initialData?.assignedAdminId || '');
  const [admins, setAdmins] = useState<{ id: number; name: string; role: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 管理者一覧を取得（全権管理者と担当者）
  useEffect(() => {
    fetch('/api/admin/users-list')
      .then((res) => res.json())
      .then((users) => {
        const adminUsers = users.filter((u: { role: string }) => 
          u.role === 'FULL_ADMIN' || u.role === 'MANAGER'
        );
        setAdmins(adminUsers);
      })
      .catch((err) => console.error('Failed to fetch admins:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = initialData
        ? `/api/admin/users/${initialData.id}`
        : '/api/admin/users';
      
      const method = initialData ? 'PUT' : 'POST';

      const body: {
        name: string;
        email: string;
        role: string;
        password?: string;
        assignedAdminId?: string;
      } = {
        name,
        email,
        role,
        assignedAdminId: assignedAdminId || undefined,
      };

      // 新規作成時またはパスワード変更時のみパスワードを送信
      if (!initialData || password) {
        if (!password || password.length < 8) {
          setError('パスワードは8文字以上で入力してください');
          setIsSubmitting(false);
          return;
        }
        body.password = password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
          名前 *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
          メールアドレス *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
          パスワード {initialData ? '(変更する場合のみ入力)' : '*'}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!initialData}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder={initialData ? '変更しない場合は空欄' : '8文字以上で入力してください'}
        />
        {!initialData && (
          <p className="mt-2 text-sm text-gray-500">
            8文字以上で入力してください
          </p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="role" className="block text-sm font-medium text-gray-900 mb-2">
          ロール *
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="USER">一般ユーザー</option>
          <option value="MANAGER">担当者</option>
          <option value="FULL_ADMIN">全権管理者</option>
        </select>
        <p className="mt-2 text-sm text-gray-500">
          全権管理者: 全ユーザーを管理可能 | 担当者: 担当ユーザーのみ管理可能 | 一般ユーザー: 自分のみ
        </p>
      </div>

      {role === 'USER' && (
        <div className="mb-6">
          <label htmlFor="assignedAdminId" className="block text-sm font-medium text-gray-900 mb-2">
            担当者
          </label>
          <select
            id="assignedAdminId"
            name="assignedAdminId"
            value={assignedAdminId}
            onChange={(e) => setAssignedAdminId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">担当者なし</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id.toString()}>
                {admin.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            このユーザーの担当管理者を選択します。担当者が設定されると、その管理者のみがこのユーザーを管理できます。
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? '保存中...' : initialData ? '更新' : '作成'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
