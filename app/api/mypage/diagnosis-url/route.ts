import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const userId = parseInt(session.user.id as string);

    // 診断URL一覧を取得
    const diagnosisUrls = await prisma.diagnosisUrl.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(diagnosisUrls);
  } catch (error) {
    console.error('Diagnosis URLs fetch error:', error);
    return NextResponse.json(
      { error: '診断URLの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id as string);

    // 既に同じURLが登録されているかチェック
    const existing = await prisma.diagnosisUrl.findFirst({
      where: {
        userId,
        url: url.trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'このURLは既に登録されています' },
        { status: 400 }
      );
    }

    // 診断URLを登録
    const diagnosisUrl = await prisma.diagnosisUrl.create({
      data: {
        userId,
        url: url.trim(),
        status: 'pending',
      },
    });

    // 診断結果をチェック（非同期で実行）
    checkDiagnosisResult(diagnosisUrl.id, url.trim(), userId).catch((error) => {
      console.error('Failed to check diagnosis result:', error);
    });

    return NextResponse.json({
      success: true,
      diagnosisUrl,
      message: '診断URLを登録しました。診断結果が準備でき次第、自動的にマイページに保存されます。',
    });
  } catch (error) {
    console.error('Diagnosis URL creation error:', error);
    return NextResponse.json(
      { error: '診断URLの登録に失敗しました' },
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

    // 診断URLから結果を取得
    // 注意: 実際のbuddybow詳細診断のAPIエンドポイントに合わせて実装する必要があります
    // ここでは例として、URLから結果を取得する方法を示します
    
    // 診断結果を取得するAPIを呼び出す
    // 実際の実装では、buddybow詳細診断のAPIエンドポイントを使用します
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
    // 実際の実装では、buddybow詳細診断のAPIエンドポイントを使用します
    
    // 方法1: URLが直接診断結果を返す場合
    // 方法2: URLから診断IDを抽出してAPIエンドポイントを呼び出す場合
    
    // 例: URLから診断IDを抽出
    // const diagnosisId = extractDiagnosisIdFromUrl(url);
    // const apiUrl = `${process.env.DIAGNOSIS_API_BASE_URL}/results/${diagnosisId}`;
    
    // 現在は、URLを直接フェッチして結果を取得する方法を実装
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'buddybow-member-site/1.0',
      },
      // タイムアウトを設定（10秒）
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // 結果がまだ準備できていない場合（404など）
      if (response.status === 404) {
        return null;
      }
      // その他のエラー
      throw new Error(`Failed to fetch diagnosis result: ${response.status}`);
    }

    const data = await response.json();

    // 診断結果が準備できているかチェック
    // 実際のAPIレスポンス形式に合わせて調整が必要
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
