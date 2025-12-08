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

    // サーバー側でSupabaseクライアントを作成（サービスロールキー使用でRLSをバイパス）
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ファイル名をサニタイズ（英数字、ハイフン、アンダースコア、ドットのみ許可）
    const sanitizeFileName = (name: string): string => {
      // 拡張子を取得
      const ext = name.split('.').pop() || 'pdf';
      // 拡張子をサニタイズ（英数字のみ）
      const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'pdf';
      // ファイル名をタイムスタンプとランダム文字列で生成（日本語や特殊文字を回避）
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      return `${timestamp}-${randomStr}.${sanitizedExt}`;
    };

    const uniqueFileName = sanitizeFileName(fileName);
    const filePath = `diagnosis/${uniqueFileName}`;

    // 署名付きURLを生成してクライアントから直接PUTアップロードできるようにする
    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUploadUrl(filePath);

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error);
      return NextResponse.json(
        { error: '署名付きURLの生成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      path: filePath,
      signedUrl: data.signedUrl,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/files/${filePath}`,
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { error: '署名付きURLの生成に失敗しました' },
      { status: 500 }
    );
  }
}

