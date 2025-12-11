'use client';

import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '@/lib/msalConfig';
import { ReactNode, useState, useEffect } from 'react';

const MsalProviderWrapper = ({ children }: { children: ReactNode }) => {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
      const instance = new PublicClientApplication(msalConfig);
      await instance.initialize();
      setMsalInstance(instance);
    };

    initializeMsal();
  }, []);

  if (!msalInstance) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};

export default MsalProviderWrapper;
