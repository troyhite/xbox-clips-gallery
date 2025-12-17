'use client';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  compilationName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  compilationName,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-red-900">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-900 bg-opacity-20 flex items-center justify-center">
            <span className="text-3xl">🗑️</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Delete Compilation?</h2>
            <p className="text-gray-300 mb-1">
              Are you sure you want to delete this compilation video?
            </p>
            <p className="text-gray-400 text-sm font-mono bg-gray-900 p-2 rounded mt-2 break-all">
              {compilationName}
            </p>
          </div>
        </div>

        <div className="bg-red-900 bg-opacity-10 border border-red-900 rounded p-3 mb-4">
          <p className="text-red-400 text-sm">
            ⚠️ This action cannot be undone. The video will be permanently removed from storage.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
