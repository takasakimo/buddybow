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
    // 診断結果を取得
    const diagnosisResult = await fetchDiagnosisResult(url);

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
        }

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
    const urlObj = new URL(url);
    const diagnosisId = urlObj.searchParams.get('id') || urlObj.pathname.split('/').pop();
    
    // APIエンドポイントを構築
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
      if (response.status === 404) {
        return null;
      }
      return null;
    }

    const contentType = response.headers.get('content-type');
    
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

