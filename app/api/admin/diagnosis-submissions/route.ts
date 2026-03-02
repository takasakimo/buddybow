import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * 匿名診断結果一覧取得（管理者のみ）
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const getUserRole = () => {
      const role = session?.user?.role || 'user';
      if (role === 'admin') return 'FULL_ADMIN';
      if (role === 'user') return 'USER';
      return role;
    };

    const userRole = getUserRole();

    if (!session || (userRole !== 'FULL_ADMIN' && userRole !== 'MANAGER')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.diagnosisSubmission.findMany({
        orderBy: { diagnosedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.diagnosisSubmission.count(),
    ]);

    return NextResponse.json({
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Diagnosis submissions fetch error:', error);
    return NextResponse.json(
      { error: '診断結果の取得に失敗しました' },
      { status: 500 }
    );
  }
}
