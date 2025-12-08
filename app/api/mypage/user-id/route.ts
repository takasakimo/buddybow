import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    return NextResponse.json({ userId });
  } catch (error) {
    console.error('User ID fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザーIDの取得に失敗しました' },
      { status: 500 }
    );
  }
}

