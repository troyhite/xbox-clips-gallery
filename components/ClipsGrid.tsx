'use client';

import { XboxClip } from '@/lib/xboxApi';
import { downloadMedia, deleteXboxClip } from '@/lib/xboxApi';
import Image from 'next/image';
import { useState } from 'react';

interface ClipsGridProps {
  clips: XboxClip[];
  authHeader?: string;
  xuid?: string;
  onClipDeleted?: (gameClipId: string) => void;
}

export default function ClipsGrid({ clips, authHeader, xuid, onClipDeleted }: ClipsGridProps) {
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [deletingClipId, setDeletingClipId] = useState<string | null>(null);
  const [clipToDelete, setClipToDelete] = useState<XboxClip | null>(null);

  if (clips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No clips found</p>
      </div>
    );
  }

  const handleDownload = (clip: XboxClip) => {
    const uri = clip.gameClipUris.find(u => u.uriType === 'Download')?.uri || clip.gameClipUris[0]?.uri;
    if (uri) {
      downloadMedia(uri, `${clip.clipName || clip.gameClipId}.mp4`);
    }
  };

  const handleDeleteClick = (clip: XboxClip) => {
    setClipToDelete(clip);
  };

  const handleDeleteConfirm = async () => {
    if (!clipToDelete || !authHeader || !xuid) return;

    setDeletingClipId(clipToDelete.gameClipId);
    try {
      await deleteXboxClip(authHeader, xuid, clipToDelete.gameClipId);
      onClipDeleted?.(clipToDelete.gameClipId);
      setClipToDelete(null);
    } catch (error) {
      console.error('Failed to delete clip:', error);
      alert('Failed to delete clip. Please try again.');
    } finally {
      setDeletingClipId(null);
    }
  };

  const handleDeleteCancel = () => {
    setClipToDelete(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clips.map((clip) => {
          const thumbnailUri = clip.thumbnails[0]?.uri;
          const videoUri = clip.gameClipUris.find(u => u.uriType === 'Download')?.uri || clip.gameClipUris[0]?.uri;

          return (
            <div key={clip.gameClipId} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition">
              <div className="relative aspect-video cursor-pointer group" onClick={() => setSelectedClip(videoUri)}>
                {thumbnailUri && (
                  <Image
                    src={thumbnailUri}
                    alt={clip.userCaption || clip.titleName || 'Xbox Clip'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(clip.durationInSeconds)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold truncate">{clip.titleName || 'Unknown Game'}</h3>
                {clip.userCaption && (
                  <p className="text-gray-400 text-sm mt-1 truncate">{clip.userCaption}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-500 text-xs">
                    {new Date(clip.dateRecorded).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(clip);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition"
                      title="Download clip"
                    >
                      Download
                    </button>
                    {authHeader && xuid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(clip);
                        }}
                        disabled={deletingClipId === clip.gameClipId}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm px-3 py-1 rounded transition"
                        title="Delete clip"
                      >
                        {deletingClipId === clip.gameClipId ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedClip && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedClip(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <video
              src={selectedClip}
              controls
              autoPlay
              className="max-h-[90vh] max-w-full"
            >
              Your browser does not support the video tag.
            </video>
            <button
              onClick={() => setSelectedClip(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {clipToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-white text-xl font-bold mb-4">Delete Clip?</h3>
            <p className="text-gray-300 mb-2">Are you sure you want to delete this clip?</p>
            <p className="text-gray-400 text-sm mb-6">
              <strong>{clipToDelete.titleName || 'Unknown Game'}</strong>
              {clipToDelete.userCaption && (
                <>
                  <br />
                  {clipToDelete.userCaption}
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
                disabled={deletingClipId === clipToDelete.gameClipId}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition"
              >
                {deletingClipId === clipToDelete.gameClipId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
