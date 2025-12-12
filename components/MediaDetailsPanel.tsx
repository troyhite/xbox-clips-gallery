'use client';

import { XboxClip, XboxScreenshot } from '@/lib/xboxApi';
import Image from 'next/image';

interface MediaDetailsPanelProps {
  media: XboxClip | XboxScreenshot;
  mediaType: 'clip' | 'screenshot';
  onClose: () => void;
}

export default function MediaDetailsPanel({ media, mediaType, onClose }: MediaDetailsPanelProps) {
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isClip = (media: XboxClip | XboxScreenshot): media is XboxClip => {
    return 'gameClipId' in media;
  };

  const getThumbnail = () => {
    if (isClip(media)) {
      return media.thumbnails[0]?.uri;
    } else {
      return media.thumbnails[0]?.uri || media.screenshotUris[0]?.uri;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {mediaType === 'clip' ? 'Clip Details' : 'Screenshot Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="relative w-full aspect-video bg-gray-800">
          {getThumbnail() && (
            <Image
              src={getThumbnail()!}
              alt={media.titleName || 'Media preview'}
              fill
              className="object-contain"
              unoptimized
            />
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Game:</span>
                <p className="text-white font-medium">{media.titleName || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400">Date Captured:</span>
                <p className="text-white font-medium">
                  {formatDate(isClip(media) ? media.dateRecorded : media.dateTaken)}
                </p>
              </div>
              {media.userCaption && (
                <div className="col-span-2">
                  <span className="text-gray-400">Caption:</span>
                  <p className="text-white font-medium">{media.userCaption}</p>
                </div>
              )}
            </div>
          </section>

          {/* Technical Details */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Technical Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {isClip(media) && (
                <>
                  <div>
                    <span className="text-gray-400">Duration:</span>
                    <p className="text-white font-medium">{formatDuration(media.durationInSeconds)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <p className="text-white font-medium">{media.type || 'Game Clip'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Clip ID:</span>
                    <p className="text-white font-mono text-xs break-all">{media.gameClipId}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Clip Name:</span>
                    <p className="text-white font-medium">{media.clipName || 'Unnamed'}</p>
                  </div>
                </>
              )}
              
              {!isClip(media) && (
                <>
                  <div>
                    <span className="text-gray-400">Screenshot ID:</span>
                    <p className="text-white font-mono text-xs break-all">{media.screenshotId}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Screenshot Name:</span>
                    <p className="text-white font-medium">{media.screenshotName || 'Unnamed'}</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Available Versions */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">
              {isClip(media) ? 'Available Versions' : 'Available Sizes'}
            </h3>
            <div className="space-y-2">
              {isClip(media) ? (
                media.gameClipUris.map((uri, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                    <div>
                      <p className="text-white font-medium">{uri.uriType}</p>
                      {uri.fileSize && (
                        <p className="text-gray-400 text-xs">{formatFileSize(uri.fileSize)}</p>
                      )}
                    </div>
                    <a
                      href={uri.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Open →
                    </a>
                  </div>
                ))
              ) : (
                <>
                  {media.screenshotUris.map((uri, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <div>
                        <p className="text-white font-medium">{uri.uriType}</p>
                        {uri.fileSize && (
                          <p className="text-gray-400 text-xs">{formatFileSize(uri.fileSize)}</p>
                        )}
                      </div>
                      <a
                        href={uri.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Open →
                      </a>
                    </div>
                  ))}
                  <div className="text-gray-500 text-sm mt-2">
                    <p className="font-semibold mb-1">Thumbnails:</p>
                    {media.thumbnails.map((thumb, index) => (
                      <div key={index} className="ml-2 text-xs">
                        • {thumb.thumbnailType}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Stats */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Views:</span>
                <p className="text-white font-medium">{media.views?.toLocaleString() || '0'}</p>
              </div>
              {isClip(media) && media.rating && (
                <div>
                  <span className="text-gray-400">Rating:</span>
                  <p className="text-white font-medium">{media.rating}</p>
                </div>
              )}
            </div>
          </section>

          {/* Additional Info */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Title ID:</span>
                <p className="text-white font-mono text-xs">{media.titleId}</p>
              </div>
              <div>
                <span className="text-gray-400">Locale:</span>
                <p className="text-white font-medium">{isClip(media) ? media.gameClipLocale : 'Unknown'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
