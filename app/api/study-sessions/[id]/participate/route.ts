import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    // 既に申し込み済みかチェック
    const existingParticipant = await prisma.studySessionParticipant.findUnique({
      where: {
        studySessionId_userId: {
          studySessionId: params.id,
          userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: '既に申し込み済みです' },
        { status: 400 }
      );
    }

    // 参加申し込みを作成
    const participant = await prisma.studySessionParticipant.create({
      data: {
        studySessionId: params.id,
        userId,
        status: 'pending',
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error('Participation error:', error);
    return NextResponse.json(
      { error: '参加申し込みに失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    await prisma.studySessionParticipant.delete({
      where: {
        studySessionId_userId: {
          studySessionId: params.id,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: 'キャンセルに失敗しました' },
      { status: 500 }
    );
  }
}
