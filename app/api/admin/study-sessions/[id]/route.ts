import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 全権管理者のみアクセス可能
    if (!session || session.user.role !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startTime, endTime, zoomId } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    const studySession = await prisma.studySession.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        zoomId,
      },
    });

    return NextResponse.json(studySession);
  } catch (error) {
    console.error('Study session update error:', error);
    return NextResponse.json(
      { error: '勉強会の更新に失敗しました' },
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

    // 全権管理者のみアクセス可能
    if (!session || session.user.role !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    await prisma.studySession.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Study session deletion error:', error);
    return NextResponse.json(
      { error: '勉強会の削除に失敗しました' },
      { status: 500 }
    );
  }
}
