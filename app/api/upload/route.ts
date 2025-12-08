import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercelの最大実行時間を60秒に設定

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは50MB以下にしてください' },
        { status: 400 }
      );
    }

    // Supabase Storageが利用可能な場合、それを使用
    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `diagnosis/${fileName}`;

        // ファイルをArrayBufferに変換
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Supabase Storageにアップロード
        const { error } = await supabase.storage
          .from('files') // バケット名（環境変数で設定可能）
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error('Supabase upload error:', error);
          throw error;
        }

        // 公開URLを取得
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);

        return NextResponse.json({ url: urlData.publicUrl });
      } catch (supabaseError) {
        console.error('Supabase upload failed, falling back to base64:', supabaseError);
        // Supabaseが失敗した場合、Base64にフォールバック（小さいファイルの場合のみ）
        if (file.size <= 4 * 1024 * 1024) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;
          return NextResponse.json({ url: dataUrl });
        } else {
          throw new Error('ファイルが大きすぎます。Supabase Storageの設定を確認してください。');
        }
      }
    } else {
      // Supabaseが設定されていない場合、Base64に変換（4MB以下のみ）
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'ファイルが大きすぎます。Supabase Storageの設定が必要です。' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      return NextResponse.json({ url: dataUrl });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}
