'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CompleteButtonProps {
  trainingId: string;
  moduleId: string;
  isCompleted: boolean;
}

export default function CompleteButton({ trainingId, moduleId, isCompleted }: CompleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/trainings/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          completed: !isCompleted,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={isLoading}
      className={`px-6 py-3 rounded-lg transition-colors ${
        isCompleted
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-green-600 text-white hover:bg-green-700'
      } disabled:opacity-50`}
    >
      {isLoading ? '処理中...' : isCompleted ? '完了を取り消す' : 'このチャプターを完了'}
    </button>
  );
}
