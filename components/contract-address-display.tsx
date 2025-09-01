'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { shortenAddress } from 'thirdweb/utils';

interface ContractAddressDisplayProps {
  address: string;
  showFullAddress?: boolean;
  className?: string;
}

interface AddressInfo {
  name: string;
  source: string;
  isHumanReadable: boolean;
}

// Client-side function to fetch address info
async function fetchAddressInfo(address: string): Promise<AddressInfo | null> {
  try {
    const response = await fetch('/api/address-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.info;
  } catch (error) {
    console.warn('Failed to fetch address info:', error);
    return null;
  }
}

export function ContractAddressDisplay({
  address,
  showFullAddress = false,
  className = '',
}: ContractAddressDisplayProps) {
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAddressInfo = async () => {
      try {
        const info = await fetchAddressInfo(address);
        if (isMounted) {
          setAddressInfo(info);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAddressInfo();

    return () => {
      isMounted = false;
    };
  }, [address]);

  const formatAddress = (addr: string) => {
    if (showFullAddress) return addr;
    return shortenAddress(addr, 4);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-4 w-20" />
        <span className="text-xs font-mono text-muted-foreground">
          {formatAddress(address)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {addressInfo?.isHumanReadable ? (
        <>
          <div className="flex flex-col">
            <span className="text-xs font-medium">{addressInfo.name}</span>
            <span className="text-xs font-mono text-muted-foreground">
              {formatAddress(address)}
            </span>
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {addressInfo.source}
          </Badge>
        </>
      ) : (
        <span className="text-xs font-mono">{formatAddress(address)}</span>
      )}
    </div>
  );
}
