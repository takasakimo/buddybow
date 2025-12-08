import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 診断結果をチェックするAPI
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
    const { userId: requestUserId } = body;

    const sessionUserId = parseInt(session.user.id as string);
    
    // リクエストのuserIdとセッションのuserIdが一致するか確認
    if (requestUserId && parseInt(requestUserId) !== sessionUserId) {
      return NextResponse.json(
        { error: '認証エラー' },
        { status: 403 }
      );
    }

    const userId = sessionUserId;

    // 固定の診断URL
    const DIAGNOSIS_BASE_URL = process.env.DIAGNOSIS_URL || 'https://buddybow-diagnosis-cb1bweb9y-aims-projects-264acc6a.vercel.app/diagnosis';
    const diagnosisUrl = `${DIAGNOSIS_BASE_URL}?userId=${userId}`;

    // 診断結果をチェック
    await checkDiagnosisResult(userId, diagnosisUrl);

    return NextResponse.json({
      success: true,
      message: '診断結果をチェックしました',
    });
  } catch (error) {
    console.error('Diagnosis check error:', error);
    return NextResponse.json(
      { error: '診断結果のチェックに失敗しました' },
      { status: 500 }
    );
  }
}

// 診断結果をチェックする関数
async function checkDiagnosisResult(userId: number, url: string) {
  try {
    console.log(`Checking diagnosis result for user ${userId}, URL: ${url}`);
    
    // 診断結果を取得
    const diagnosisResult = await fetchDiagnosisResult(url);
    
    console.log(`Diagnosis result for user ${userId}:`, diagnosisResult ? 'Found' : 'Not found');

    if (diagnosisResult) {
      // 既に診断結果が存在するかチェック（同じURLから取得した結果）
      const existingDiagnosis = await prisma.diagnosis.findFirst({
        where: {
          userId,
          diagnosisUrls: {
            some: {
              url: url,
              status: 'completed',
            },
          },
        },
      });

      if (!existingDiagnosis) {
        // 診断URLを登録または更新
        let diagnosisUrlRecord = await prisma.diagnosisUrl.findFirst({
          where: {
            userId,
            url: url,
          },
        });

        if (!diagnosisUrlRecord) {
          diagnosisUrlRecord = await prisma.diagnosisUrl.create({
            data: {
              userId,
              url: url,
              status: 'processing',
            },
          });
          console.log(`Created diagnosis URL record: ${diagnosisUrlRecord.id}`);
        }

        // 診断結果を保存
        console.log(`Creating diagnosis result for user ${userId}`);
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
          where: { id: diagnosisUrlRecord.id },
          data: {
            status: 'completed',
            diagnosisId: diagnosis.id,
            lastCheckedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to check diagnosis result:', error);
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
async function fetchDiagnosisResult(url: string): Promise<DiagnosisResult | null> {
  try {
    console.log(`Fetching diagnosis result from: ${url}`);
    const urlObj = new URL(url);
    const userId = urlObj.searchParams.get('userId');
    
    // 方法1: 診断結果を取得するAPIエンドポイントを試す
    // ユーザーIDから診断結果を取得するAPI
    const apiEndpoints = [
      `${urlObj.origin}/api/diagnosis/result?userId=${userId}`,
      `${urlObj.origin}/api/diagnosis/user/${userId}`,
      `${urlObj.origin}/api/diagnosis?userId=${userId}`,
    ];
    
    for (const apiUrl of apiEndpoints) {
      try {
        console.log(`Trying API endpoint: ${apiUrl}`);
        const apiResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'buddybow-member-site/1.0',
          },
          signal: AbortSignal.timeout(10000),
        });

        console.log(`API response status: ${apiResponse.status}`);

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log('API response data:', JSON.stringify(data).substring(0, 200));
          
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
          
          // 診断結果がまだ準備できていない場合
          if (data.status === 'pending' || data.status === 'processing') {
            console.log('Diagnosis result is not ready yet');
            return null;
          }
        }
      } catch (apiError) {
        console.log(`API endpoint ${apiUrl} failed:`, apiError);
        continue;
      }
    }

    // 方法2: URLを直接フェッチ（HTMLレスポンスの場合）
    console.log('Trying direct URL fetch');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'buddybow-member-site/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`Direct URL response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Diagnosis result not found (404)');
        return null;
      }
      console.log(`Response not OK: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Direct URL JSON data:', JSON.stringify(data).substring(0, 200));
      
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

    console.log('No diagnosis result found');
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Diagnosis result fetch timeout:', url);
      return null;
    }
    console.error('Failed to fetch diagnosis result:', error);
    return null;
  }
}

