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
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
        >
          Sign in with Microsoft
        </button>
      )}
    </div>
  );
}
