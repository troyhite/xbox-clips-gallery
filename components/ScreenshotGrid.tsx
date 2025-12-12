'use client';

import { XboxScreenshot } from '@/lib/xboxApi';
import { downloadMedia, deleteXboxScreenshot } from '@/lib/xboxApi';
import Image from 'next/image';
import { useState } from 'react';

interface ScreenshotGridProps {
  screenshots: XboxScreenshot[];
  authHeader?: string;
  xuid?: string;
  onScreenshotDeleted?: (screenshotId: string) => void;
}

export default function ScreenshotGrid({ screenshots, authHeader, xuid, onScreenshotDeleted }: ScreenshotGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingScreenshotId, setDeletingScreenshotId] = useState<string | null>(null);
  const [screenshotToDelete, setScreenshotToDelete] = useState<XboxScreenshot | null>(null);

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No screenshots found</p>
      </div>
    );
  }

  const handleDownload = (screenshot: XboxScreenshot) => {
    const uri = screenshot.screenshotUris.find(u => u.uriType === 'Download')?.uri || screenshot.screenshotUris[0]?.uri;
    if (uri) {
      downloadMedia(uri, `${screenshot.screenshotName || screenshot.screenshotId}.png`);
    }
  };

  const handleDeleteClick = (screenshot: XboxScreenshot) => {
    setScreenshotToDelete(screenshot);
  };

  const handleDeleteConfirm = async () => {
    if (!screenshotToDelete || !authHeader || !xuid) return;

    setDeletingScreenshotId(screenshotToDelete.screenshotId);
    try {
      await deleteXboxScreenshot(authHeader, xuid, screenshotToDelete.screenshotId);
      onScreenshotDeleted?.(screenshotToDelete.screenshotId);
      setScreenshotToDelete(null);
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
      alert('Failed to delete screenshot. Please try again.');
    } finally {
      setDeletingScreenshotId(null);
    }
  };

  const handleDeleteCancel = () => {
    setScreenshotToDelete(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {screenshots.map((screenshot) => {
          const thumbnailUri = screenshot.thumbnails[0]?.uri || screenshot.screenshotUris[0]?.uri;
          const fullUri = screenshot.screenshotUris.find(u => u.uriType === 'Download')?.uri || screenshot.screenshotUris[0]?.uri;

          return (
            <div key={screenshot.screenshotId} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition">
              <div className="relative aspect-video cursor-pointer" onClick={() => setSelectedImage(fullUri)}>
                {thumbnailUri && (
                  <Image
                    src={thumbnailUri}
                    alt={screenshot.userCaption || screenshot.titleName || 'Xbox Screenshot'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold truncate">{screenshot.titleName || 'Unknown Game'}</h3>
                {screenshot.userCaption && (
                  <p className="text-gray-400 text-sm mt-1 truncate">{screenshot.userCaption}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-500 text-xs">
                    {new Date(screenshot.dateTaken).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(screenshot)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition"
                      title="Download screenshot"
                    >
                      Download
                    </button>
                    {authHeader && xuid && (
                      <button
                        onClick={() => handleDeleteClick(screenshot)}
                        disabled={deletingScreenshotId === screenshot.screenshotId}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm px-3 py-1 rounded transition"
                        title="Delete screenshot"
                      >
                        {deletingScreenshotId === screenshot.screenshotId ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <Image
              src={selectedImage}
              alt="Full size screenshot"
              width={1920}
              height={1080}
              className="object-contain max-h-[90vh]"
              unoptimized
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {screenshotToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-white text-xl font-bold mb-4">Delete Screenshot?</h3>
            <p className="text-gray-300 mb-2">Are you sure you want to delete this screenshot?</p>
            <p className="text-gray-400 text-sm mb-6">
              <strong>{screenshotToDelete.titleName || 'Unknown Game'}</strong>
              {screenshotToDelete.userCaption && (
                <>
                  <br />
                  {screenshotToDelete.userCaption}
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingScreenshotId === screenshotToDelete.screenshotId}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition"
              >
                {deletingScreenshotId === screenshotToDelete.screenshotId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
