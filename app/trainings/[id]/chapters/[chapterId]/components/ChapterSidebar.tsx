import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  order: number;
}

interface Training {
  id: string;
  title: string;
  modules: Module[];
}

interface ChapterSidebarProps {
  training: Training;
  currentModuleId: string;
  progressMap: Map<string, boolean>;
}

export default function ChapterSidebar({ training, currentModuleId, progressMap }: ChapterSidebarProps) {
  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-white rounded-lg shadow sticky top-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">チャプター一覧</h2>
          <p className="text-sm text-gray-600 mt-1">
            {training.modules.filter(m => progressMap.get(m.id)).length} / {training.modules.length} 完了
          </p>
        </div>
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-2">
            {training.modules.map((module, index) => {
              const isCompleted = progressMap.get(module.id) || false;
              const isCurrent = module.id === currentModuleId;

              return (
                <Link
                  key={module.id}
                  href={`/trainings/${training.id}/chapters/${module.id}`}
                  className={`block p-3 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-buddybow-beige-light border-2 border-buddybow-orange'
                      : isCompleted
                      ? 'bg-green-50 hover:bg-green-100 border-2 border-green-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCurrent
                          ? 'bg-buddybow-orange text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={`text-sm font-medium line-clamp-2 ${
                        isCurrent
                          ? 'text-buddybow-orange-dark'
                          : isCompleted
                          ? 'text-green-900'
                          : 'text-gray-900'
                      }`}
                    >
                      {module.title}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
