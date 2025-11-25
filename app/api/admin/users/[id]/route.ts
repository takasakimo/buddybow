import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 全権管理者のみユーザー更新可能
    if (!session || session.user.role !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, assignedAdminId } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    const userId = parseInt(params.id);

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    const updateData: {
      name: string;
      email: string;
      role: string;
      password?: string;
      assignedAdminId?: number | null;
    } = {
      name,
      email,
      role,
      assignedAdminId: assignedAdminId ? parseInt(assignedAdminId) : null,
    };

    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'パスワードは8文字以上で入力してください' },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
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

    // 全権管理者のみユーザー更新可能
    if (!session || session.user.role !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    const currentUserId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    if (userId === currentUserId) {
      return NextResponse.json(
        { error: '自分自身を削除することはできません' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    );
  }
}
