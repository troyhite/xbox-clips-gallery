'use client';

import { XboxClip, XboxScreenshot } from '@/lib/xboxApi';
import { useState } from 'react';

interface ShareButtonProps {
  media: XboxClip | XboxScreenshot;
  mediaType: 'clip' | 'screenshot';
  gamertag?: string;
}

export default function ShareButton({ media, mediaType, gamertag }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const isClip = (media: XboxClip | XboxScreenshot): media is XboxClip => {
    return 'gameClipId' in media;
  };

  const getXboxUrl = () => {
    if (isClip(media)) {
      // Xbox.com clip URL format
      return `https://www.xbox.com/play/media/${media.gameClipId}`;
    } else {
      // Xbox.com screenshot URL format
      return `https://www.xbox.com/play/media/${media.screenshotId}`;
    }
  };

  const getMediaUrl = () => {
    if (isClip(media)) {
      return media.gameClipUris.find(u => u.uriType === 'Download')?.uri || media.gameClipUris[0]?.uri;
    } else {
      return media.screenshotUris.find(u => u.uriType === 'Download')?.uri || media.screenshotUris[0]?.uri;
    }
  };

  const getShareText = () => {
    const game = media.titleName || 'Xbox';
    const caption = media.userCaption || '';
    return `Check out my ${mediaType} from ${game}! ${caption}`.trim();
  };

  const handleCopyLink = async () => {
    const url = getXboxUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyDirectLink = async () => {
    const url = getMediaUrl();
    if (!url) return;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getXboxUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getXboxUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const handleShareReddit = () => {
    const title = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getXboxUrl());
    window.open(`https://www.reddit.com/submit?title=${title}&url=${url}`, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const handleCopyEmbedCode = async () => {
    const url = getMediaUrl();
    if (!url) return;

    const embedCode = isClip(media)
      ? `<video controls width="640" height="360">\n  <source src="${url}" type="video/mp4">\n  Your browser does not support the video tag.\n</video>`
      : `<img src="${url}" alt="${media.titleName || 'Xbox Screenshot'}" />`;

    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative flex-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded transition flex items-center justify-center gap-1"
        title="Share"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="hidden sm:inline">Share</span>
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[101] py-2 w-56"
            style={{
              top: typeof window !== 'undefined' ? 'auto' : undefined,
              left: typeof window !== 'undefined' ? 'auto' : undefined,
            }}
            ref={(node) => {
              if (node && typeof window !== 'undefined') {
                const button = node.previousElementSibling?.previousElementSibling as HTMLElement;
                if (button) {
                  const rect = button.getBoundingClientRect();
                  node.style.top = `${rect.bottom + 8}px`;
                  node.style.left = `${Math.max(8, rect.right - 224)}px`;
                }
              }
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink();
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {copied ? 'Copied!' : 'Copy Xbox.com Link'}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyDirectLink();
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Copy Direct Media Link
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyEmbedCode();
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Copy Embed Code
            </button>

            <div className="border-t border-gray-700 my-2" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShareTwitter();
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X (Twitter)
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShareFacebook();
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Share on Facebook
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShareReddit();
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              Share on Reddit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
