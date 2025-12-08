import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'ファイル名とファイルタイプが必要です' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase Storageの設定が不完全です' },
        { status: 500 }
      );
    }

    // サーバー側でSupabaseクライアントを作成（サービスロールキーを使用）
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `diagnosis/${uniqueFileName}`;

    // サーバー側でSupabase Storageに直接アップロード（サービスロールキーを使用してRLSをバイパス）
    // ファイルはクライアント側から送られてくるため、このエンドポイントではファイルパスのみを返す
    // 実際のアップロードは、クライアント側からSupabase Storageに直接行う
    
    // クライアント側から直接アップロードするため、Supabase Storageのバケットを公開設定にする必要がある
    // または、RLSポリシーを適切に設定する必要がある
    
    return NextResponse.json({
      path: filePath,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/files/${filePath}`
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { error: '署名付きURLの生成に失敗しました' },
      { status: 500 }
    );
  }
}

