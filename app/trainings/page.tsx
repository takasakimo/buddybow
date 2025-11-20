import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function TrainingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const trainings = await prisma.training.findMany({
    include: {
      modules: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            研修一覧
          </h1>
          <p className="text-gray-600 mt-2">
            利用可能な研修プログラムを確認できます
          </p>
        </header>
        
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              現在、利用可能な研修はありません。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <Link
                key={training.id}
                href={`/trainings/${training.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                {training.imageUrl ? (
                  <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={training.imageUrl}
                      alt={training.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <span className="text-4xl text-gray-400">📚</span>
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {training.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {training.description || '説明なし'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      チャプター数: {training.modules.length}
                    </span>
                    <span className="text-blue-600 font-medium">
                      開始 →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
