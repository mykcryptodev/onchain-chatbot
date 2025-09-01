'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import {
  ethereum,
  base,
  polygon,
  bsc,
  avalanche,
  arbitrum,
  optimism,
  celo,
  gnosis,
  fantom,
  zkSync,
  linea,
  scroll,
  getChainMetadata,
  type Chain,
} from 'thirdweb/chains';

// Define supported chains with their thirdweb chain objects
const SUPPORTED_CHAINS: Array<{
  chain: Chain;
  id: number;
  name: string;
}> = [
  { chain: ethereum, id: 1, name: 'Ethereum' },
  { chain: base, id: 8453, name: 'Base' },
  { chain: polygon, id: 137, name: 'Polygon' },
  { chain: bsc, id: 56, name: 'BSC' },
  { chain: avalanche, id: 43114, name: 'Avalanche' },
  { chain: arbitrum, id: 42161, name: 'Arbitrum' },
  { chain: optimism, id: 10, name: 'Optimism' },
  { chain: celo, id: 42220, name: 'Celo' },
  { chain: gnosis, id: 100, name: 'Gnosis' },
  { chain: fantom, id: 250, name: 'Fantom' },
  { chain: zkSync, id: 324, name: 'zkSync' },
  { chain: linea, id: 59144, name: 'Linea' },
  { chain: scroll, id: 534352, name: 'Scroll' },
];

// Cache for chain metadata to avoid refetching
const chainMetadataCache = new Map<
  number,
  { iconUrl: string | null; name: string }
>();

// Convert IPFS URLs to HTTP URLs using a public gateway
function convertIpfsToHttp(url: string): string {
  if (url.startsWith('ipfs://')) {
    // Extract the hash from ipfs://QmHash
    const hash = url.replace('ipfs://', '');
    // Use a reliable public IPFS gateway
    return `https://ipfs.io/ipfs/${hash}`;
  }
  return url;
}

// Component to display chain icon using fetched metadata
function ChainIcon({ chain, size = 16 }: { chain: Chain; size?: number }) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [chainName, setChainName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchChainMetadata() {
      try {
        setLoading(true);
        setError(false);

        // Check cache first
        const cached = chainMetadataCache.get(chain.id);
        if (cached) {
          setIconUrl(cached.iconUrl);
          setChainName(cached.name);
          setLoading(false);
          return;
        }

        const metadata = await getChainMetadata(chain);
        const rawIconUrl = metadata.icon?.url || null;
        const iconUrl = rawIconUrl ? convertIpfsToHttp(rawIconUrl) : null;
        const name = metadata.name;

        // Cache the result
        chainMetadataCache.set(chain.id, { iconUrl, name });

        setIconUrl(iconUrl);
        setChainName(name);
      } catch (err) {
        console.error('Failed to fetch chain metadata:', err);
        setError(true);
        const fallbackName = chain.name || 'Unknown Chain';
        setChainName(fallbackName);

        // Cache the error result to avoid refetching
        chainMetadataCache.set(chain.id, { iconUrl: null, name: fallbackName });
      } finally {
        setLoading(false);
      }
    }

    fetchChainMetadata();
  }, [chain]);

  if (loading) {
    // Loading state
    return (
      <div
        className="rounded-full bg-gray-200 animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  if (error || !iconUrl) {
    // Fallback to a generic blockchain icon if no icon is available or error occurred
    return (
      <div
        className="rounded-full bg-gray-300 flex items-center justify-center text-gray-600"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
        title={chainName}
      >
        ⛓
      </div>
    );
  }

  return (
    <Image
      src={iconUrl}
      alt={`${chainName} logo`}
      width={size}
      height={size}
      className="rounded-full"
      title={chainName}
      onError={() => {
        setError(true);
        setIconUrl(null);
      }}
    />
  );
}

interface BlockchainSelectorProps {
  selectedChains: number[];
  onSelectionChange: (chainIds: number[]) => void;
  disabled?: boolean;
}

export function BlockchainSelector({
  selectedChains,
  onSelectionChange,
  disabled = false,
}: BlockchainSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleChainToggle = (chainId: number) => {
    const newSelection = selectedChains.includes(chainId)
      ? selectedChains.filter((id) => id !== chainId)
      : [...selectedChains, chainId];

    onSelectionChange(newSelection);
  };

  const selectedChainsData = SUPPORTED_CHAINS.filter((chain) =>
    selectedChains.includes(chain.id),
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 px-2 py-1 text-xs font-normal border border-transparent hover:border-border rounded-md"
        >
          <div className="flex items-center gap-1">
            {selectedChains.length === 0 ? (
              <>
                <span className="text-muted-foreground">Chains</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  {selectedChainsData.slice(0, 2).map((chainData) => (
                    <div key={chainData.id} title={chainData.name}>
                      <ChainIcon chain={chainData.chain} size={14} />
                    </div>
                  ))}
                  {selectedChains.length > 2 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">
                      +{selectedChains.length - 2}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="size-3 text-muted-foreground" />
              </>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 max-h-80 overflow-y-auto"
      >
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Select blockchain networks
          </div>
          {SUPPORTED_CHAINS.map((chainData) => (
            <DropdownMenuCheckboxItem
              key={chainData.id}
              checked={selectedChains.includes(chainData.id)}
              onCheckedChange={() => handleChainToggle(chainData.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ChainIcon chain={chainData.chain} size={16} />
              <span className="text-sm">{chainData.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {chainData.id}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          {selectedChains.length > 0 && (
            <div className="border-t mt-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
