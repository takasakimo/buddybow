import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Vercel Cron Job用のエンドポイント
// このエンドポイントは定期的に呼び出され、pending状態の診断URLをチェックします
export async function GET(request: Request) {
  try {
    // 認証: Vercel Cron Jobからのリクエストか確認
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // pending状態の診断URLを取得
    const pendingUrls = await prisma.diagnosisUrl.findMany({
      where: {
        status: {
          in: ['pending', 'processing'],
        },
      },
      take: 50, // 一度に処理する最大数
    });

    console.log(`Checking ${pendingUrls.length} pending diagnosis URLs...`);

    // 各診断URLをチェック
    const results = await Promise.allSettled(
      pendingUrls.map((diagnosisUrl) =>
        checkDiagnosisResult(diagnosisUrl.id, diagnosisUrl.url, diagnosisUrl.userId)
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      checked: pendingUrls.length,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 診断結果をチェックする関数
async function checkDiagnosisResult(
  diagnosisUrlId: string,
  url: string,
  userId: number
) {
  try {
    // 診断URLのステータスを更新
    await prisma.diagnosisUrl.update({
      where: { id: diagnosisUrlId },
      data: {
        status: 'processing',
        lastCheckedAt: new Date(),
      },
    });

    // 診断結果を取得
    const diagnosisResult = await fetchDiagnosisResult(url);

    if (diagnosisResult) {
      // 既に診断結果が存在するかチェック
      const existingDiagnosis = await prisma.diagnosis.findFirst({
        where: {
          userId,
          diagnosisUrls: {
            some: {
              id: diagnosisUrlId,
            },
          },
        },
      });

      if (!existingDiagnosis) {
        // 診断結果を保存
        const diagnosis = await prisma.diagnosis.create({
          data: {
            userId,
            personalityType: diagnosisResult.personalityType || null,
            skillMap: diagnosisResult.skillMap || undefined,
            strengths: diagnosisResult.strengths || undefined,
            weaknesses: diagnosisResult.weaknesses || undefined,
            recommendations: diagnosisResult.recommendations || undefined,
            pdfUrl: diagnosisResult.pdfUrl || null,
            comment: diagnosisResult.comment || null,
          },
        });

        // 診断URLのステータスを更新
        await prisma.diagnosisUrl.update({
          where: { id: diagnosisUrlId },
          data: {
            status: 'completed',
            diagnosisId: diagnosis.id,
            lastCheckedAt: new Date(),
          },
        });
      } else {
        // 既に診断結果が存在する場合、ステータスを更新
        await prisma.diagnosisUrl.update({
          where: { id: diagnosisUrlId },
          data: {
            status: 'completed',
            diagnosisId: existingDiagnosis.id,
            lastCheckedAt: new Date(),
          },
        });
      }
    } else {
      // 結果がまだ準備できていない場合、後で再チェックするためにステータスをpendingに戻す
      await prisma.diagnosisUrl.update({
        where: { id: diagnosisUrlId },
        data: {
          status: 'pending',
          lastCheckedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Failed to check diagnosis result:', error);
    // エラーが発生した場合、ステータスをfailedに更新
    await prisma.diagnosisUrl.update({
      where: { id: diagnosisUrlId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '診断結果の取得に失敗しました',
        lastCheckedAt: new Date(),
      },
    });
    throw error;
  }
}

// 診断結果の型定義
interface DiagnosisResult {
  personalityType?: string | null;
  skillMap?: unknown | null;
  strengths?: unknown | null;
  weaknesses?: unknown | null;
  recommendations?: unknown | null;
  pdfUrl?: string | null;
  comment?: string | null;
}

// 診断結果を取得する関数
// buddybow詳細診断のAPIエンドポイントに合わせて実装
async function fetchDiagnosisResult(url: string): Promise<DiagnosisResult | null> {
  try {
    // URLから診断結果を取得
    // buddybow詳細診断のURL形式: https://buddybow-diagnosis-*.vercel.app/diagnosis
    
    // 方法1: URLから診断IDを抽出してAPIエンドポイントを呼び出す
    // 方法2: URLに直接アクセスしてHTMLから結果を抽出
    // 方法3: APIエンドポイントを推測して呼び出す
    
    // URLから診断IDを抽出（例: /diagnosis?id=xxx または /diagnosis/xxx）
    const urlObj = new URL(url);
    const diagnosisId = urlObj.searchParams.get('id') || urlObj.pathname.split('/').pop();
    
    // APIエンドポイントを構築（診断結果を取得するAPI）
    // 実際のAPIエンドポイントに合わせて調整が必要
    const apiUrl = diagnosisId 
      ? `${urlObj.origin}/api/diagnosis/${diagnosisId}`
      : `${urlObj.origin}/api/diagnosis/result?url=${encodeURIComponent(url)}`;
    
    // まずAPIエンドポイントを試す
    try {
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'buddybow-member-site/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        
        // 診断結果が準備できているかチェック
        if (data.status === 'completed' && data.result) {
          return {
            personalityType: data.result.personalityType || null,
            skillMap: data.result.skillMap || null,
            strengths: data.result.strengths || null,
            weaknesses: data.result.weaknesses || null,
            recommendations: data.result.recommendations || null,
            pdfUrl: data.result.pdfUrl || null,
            comment: data.result.comment || null,
          };
        }

        // 直接結果が返される場合
        if (data.personalityType || data.pdfUrl || data.comment) {
          return {
            personalityType: data.personalityType || null,
            skillMap: data.skillMap || null,
            strengths: data.strengths || null,
            weaknesses: data.weaknesses || null,
            recommendations: data.recommendations || null,
            pdfUrl: data.pdfUrl || null,
            comment: data.comment || null,
          };
        }
      }
    } catch {
      console.log('API endpoint not available, trying direct URL fetch');
    }

    // APIエンドポイントが利用できない場合、URLを直接フェッチ
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'buddybow-member-site/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // 結果がまだ準備できていない場合（404など）
      if (response.status === 404) {
        return null;
      }
      // その他のエラー
      return null;
    }

    const contentType = response.headers.get('content-type');
    
    // JSONレスポンスの場合
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (data.status === 'completed' && data.result) {
        return {
          personalityType: data.result.personalityType || null,
          skillMap: data.result.skillMap || null,
          strengths: data.result.strengths || null,
          weaknesses: data.result.weaknesses || null,
          recommendations: data.result.recommendations || null,
          pdfUrl: data.result.pdfUrl || null,
          comment: data.result.comment || null,
        };
      }

      if (data.personalityType || data.pdfUrl || data.comment) {
        return {
          personalityType: data.personalityType || null,
          skillMap: data.skillMap || null,
          strengths: data.strengths || null,
          weaknesses: data.weaknesses || null,
          recommendations: data.recommendations || null,
          pdfUrl: data.pdfUrl || null,
          comment: data.comment || null,
        };
      }
    }

    // HTMLレスポンスの場合、診断結果が含まれている可能性がある
    // 実際のHTML構造に合わせて調整が必要
    // ここでは、診断結果が準備できていないと判断
    return null;
  } catch (error) {
    // タイムアウトやネットワークエラーの場合
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Diagnosis result fetch timeout:', url);
      return null;
    }
    console.error('Failed to fetch diagnosis result:', error);
    return null;
  }
}

