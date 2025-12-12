'use client';

import { XboxScreenshot } from '@/lib/xboxApi';
import { downloadMedia } from '@/lib/xboxApi';
import Image from 'next/image';
import { useState } from 'react';

interface ScreenshotGridProps {
  screenshots: XboxScreenshot[];
}

export default function ScreenshotGrid({ screenshots }: ScreenshotGridProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {screenshots.map((screenshot) => {
          const thumbnailUri = screenshot.thumbnails[0]?.uri || screenshot.screenshotUris[0]?.uri;
          const fullUri = screenshot.screenshotUris.find(u => u.uriType === 'Download')?.uri || screenshot.screenshotUris[0]?.uri;

          return (
            <div key={screenshot.screenshotId} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition">
              <div className="relative aspect-video cursor-pointer" onClick={() => setSelectedScreenshot(fullUri)}>
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
                  <button
                    onClick={() => handleDownload(screenshot)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <Image
              src={selectedScreenshot}
              alt="Full size screenshot"
              width={1920}
              height={1080}
              className="object-contain max-h-[90vh]"
              unoptimized
            />
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
