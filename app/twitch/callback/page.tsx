'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TwitchCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('Twitch auth error:', error);
        alert(`Twitch authentication failed: ${error}`);
        router.push('/');
        return;
      }

      if (code) {
        try {
          const response = await fetch(`/api/twitch/authenticate?code=${code}`);
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('twitch_access_token', data.access_token);
            localStorage.setItem('twitch_refresh_token', data.refresh_token);
            
            // Redirect back to home
            router.push('/');
          } else {
            const errorData = await response.json();
            console.error('Failed to authenticate:', errorData);
            alert('Failed to authenticate with Twitch. Please try again.');
            router.push('/');
          }
        } catch (error) {
          console.error('Twitch auth error:', error);
          alert('An error occurred during authentication.');
          router.push('/');
        }
      } else {
        router.push('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-white text-xl">Connecting to Twitch...</p>
      </div>
    </div>
  );
}
