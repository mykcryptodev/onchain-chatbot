'use client';

import { createThirdwebClient } from 'thirdweb';
import { ThirdwebProvider } from 'thirdweb/react';

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

export const ThirdwebProviderComponent = ({
  children,
}: { children: React.ReactNode }) => {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
};

export default ThirdwebProviderComponent;
