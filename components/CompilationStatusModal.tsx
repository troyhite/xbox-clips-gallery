'use client';

import { useEffect, useState } from 'react';

interface CompilationStatusModalProps {
  isOpen: boolean;
  jobId: string | null;
  onClose: () => void;
  onComplete: (compilationUrl?: string) => void;
}

interface StatusUpdate {
  status: 'processing' | 'completed' | 'failed';
  message: string;
  progress?: number;
  videoUrl?: string;
}

export default function CompilationStatusModal({
  isOpen,
  jobId,
  onClose,
  onComplete,
}: CompilationStatusModalProps) {
  const [statusData, setStatusData] = useState<StatusUpdate>({
    status: 'processing',
    message: 'Initializing compilation...',
    progress: 0,
  });

  useEffect(() => {
    if (!isOpen || !jobId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/xbox/compilation-status?jobId=${jobId}`);
        if (response.ok) {
          const data: StatusUpdate = await response.json();
          setStatusData(data);

          if (data.status === 'completed') {
            onComplete(data.videoUrl);
            // Don't auto-close, let user manually close to see success
          } else if (data.status === 'failed') {
            // Auto-close failed status after 5 seconds
            setTimeout(() => {
              onClose();
            }, 5000);
          }
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);
    pollStatus(); // Initial fetch

    return () => clearInterval(interval);
  }, [isOpen, jobId, onClose, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">
          {statusData.status === 'completed'
            ? '✅ Compilation Complete!'
            : statusData.status === 'failed'
            ? '❌ Compilation Failed'
            : '🎬 Creating Compilation...'}
        </h2>

        <div className="space-y-4">
          <p className="text-gray-300">{statusData.message}</p>

          {statusData.status === 'processing' && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${statusData.progress || 0}%` }}
              />
            </div>
          )}

          {statusData.status === 'processing' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : statusData.status === 'completed' ? (
            <div className="space-y-3">
              <div className="bg-green-900 bg-opacity-50 border border-green-700 rounded-lg p-4 text-center">
                <p className="text-green-400 font-semibold">
                  🎉 Your compilation is ready!
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  View it in the Compilations tab
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Got it!
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Close
            </button>
          )}
          )}
        </div>
      </div>
    </div>
  );
}
