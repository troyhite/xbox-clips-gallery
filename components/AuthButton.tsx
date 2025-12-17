'use client';

import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/lib/msalConfig';

export default function AuthButton() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    instance.logoutPopup();
  };

  return (
    <div>
      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
        >
          Sign Out
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="group inline-flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl border-2 border-gray-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
            <path d="M0 0h11v11H0zm12 0h11v11H12zM0 12h11v11H0zm12 0h11v11H12z"/>
          </svg>
          <span>Sign in with Microsoft</span>
        </button>
      )}
    </div>
  );
}
