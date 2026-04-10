import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getUserRole(session: Session | null) {
  const role = session?.user?.role || 'user';
  if (role === 'admin') return 'FULL_ADMIN';
  if (role === 'user') return 'USER';
  return role;
}

async function assertCanAccessTrainee(session: Session, traineeUserId: number) {
  const userRole = getUserRole(session);
  if (userRole !== 'FULL_ADMIN' && userRole !== 'MANAGER') {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  const rawId = session.user?.id;
  if (rawId === undefined || rawId === null) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  const currentAdminId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;

  const user = await prisma.user.findUnique({
    where: { id: traineeUserId },
    select: { id: true, assignedAdminId: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
  }
  if (userRole === 'MANAGER' && user.assignedAdminId !== currentAdminId) {
    return NextResponse.json({ error: 'このユーザーへのアクセス権限がありません' }, { status: 403 });
  }
  return null;
}

/**
 * PUT — 管理者・担当メンターのみ。受講生向けAPIでは返さないフィールド。
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const traineeId = parseInt(params.id, 10);
    if (Number.isNaN(traineeId)) {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 });
    }

    const denied = await assertCanAccessTrainee(session, traineeId);
    if (denied) return denied;

    const body = (await request.json()) as Record<string, unknown>;
    const hearingNotes = typeof body.hearingNotes === 'string' ? body.hearingNotes : null;
    const background = typeof body.background === 'string' ? body.background : null;
    const mindset = typeof body.mindset === 'string' ? body.mindset : null;
    const currentGoals = typeof body.currentGoals === 'string' ? body.currentGoals : null;
    const diagnosisNotes = typeof body.diagnosisNotes === 'string' ? body.diagnosisNotes : null;

    await prisma.user.update({
      where: { id: traineeId },
      data: {
        adminHearingNotes: hearingNotes?.trim() ? hearingNotes.trim() : null,
        adminBackground: background?.trim() ? background.trim() : null,
        adminMindset: mindset?.trim() ? mindset.trim() : null,
        adminCurrentGoals: currentGoals?.trim() ? currentGoals.trim() : null,
        adminDiagnosisNotes: diagnosisNotes?.trim() ? diagnosisNotes.trim() : null,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Internal notes update error:', error);
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }
}
