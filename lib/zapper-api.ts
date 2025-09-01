// Zapper API utilities for contract address identity resolution

export interface ZapperAccountInfo {
  name: string;
  source: string;
  isHumanReadable: boolean;
}

export interface ZapperAccountData {
  displayName?: {
    source: string;
    value: string;
  };
  description?: {
    source: string;
    value: string;
  };
  ensRecord?: {
    name: string;
  };
  basename?: string;
  farcasterProfile?: {
    username: string;
    fid: number;
  };
  lensProfile?: {
    handle: string;
  };
}

/**
 * Fetch account information from Zapper API for multiple addresses
 * @param addresses Array of Ethereum addresses to lookup
 * @returns Record mapping addresses to their identity information
 */
export async function getZapperAccountInfo(
  addresses: string[],
): Promise<Record<string, ZapperAccountInfo | null>> {
  if (!process.env.ZAPPER_API_KEY) {
    console.warn('Zapper API key not configured');
    return {};
  }

  if (addresses.length === 0) {
    return {};
  }

  try {
    const query = `
      query AccountIdentity($addresses: [Address!]!) {
        accounts(addresses: $addresses) {
          displayName {
            source
            value
          }
          description {
            source
            value
          }
          ensRecord {
            name
          }
          basename
          farcasterProfile {
            username
            fid
          }
          lensProfile {
            handle
          }
        }
      }
    `;

    const response = await fetch('https://public.zapper.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': process.env.ZAPPER_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables: { addresses },
      }),
    });

    if (!response.ok) {
      console.warn('Zapper API request failed:', response.status);
      return {};
    }

    const data = await response.json();

    if (data.errors) {
      console.warn('Zapper API errors:', data.errors);
      return {};
    }

    const result: Record<string, ZapperAccountInfo | null> = {};

    addresses.forEach((address, index) => {
      const account = data.data?.accounts?.[index] as
        | ZapperAccountData
        | undefined;

      // Helper function to check if a name is actually human-readable
      const isValidHumanReadableName = (
        name: string,
        address: string,
      ): boolean => {
        if (!name || name.length === 0) return false;

        // Check if the name is just the address (case insensitive)
        if (name.toLowerCase() === address.toLowerCase()) return false;

        // Check if the name is a shortened address pattern (0x...xxxx or 0xXXXX...xxxx)
        if (/^0x[a-fA-F0-9]{4}\.{2,3}[a-fA-F0-9]{4}$/i.test(name)) return false;

        // Check if the name looks like a full address
        if (/^0x[a-fA-F0-9]{40}$/i.test(name)) return false;

        // Check if the name is just hex characters (likely an address variant)
        if (/^[a-fA-F0-9]{40}$/.test(name)) return false;

        // Check for common non-human-readable patterns
        if (
          name.startsWith('0x') &&
          name.length > 10 &&
          /^0x[a-fA-F0-9]+$/i.test(name)
        )
          return false;

        // Check if the name is suspiciously similar to the address (contains most of the same characters)
        const addressWithoutPrefix = address.toLowerCase().slice(2);
        const nameForComparison = name.toLowerCase().replace(/[^a-f0-9]/g, '');
        if (
          nameForComparison.length > 8 &&
          addressWithoutPrefix.includes(nameForComparison)
        )
          return false;

        return true;
      };

      if (account) {
        // Priority: displayName > farcasterProfile > lensProfile > ensRecord > basename
        if (
          account.displayName?.value &&
          isValidHumanReadableName(account.displayName.value, address)
        ) {
          result[address] = {
            name: account.displayName.value,
            source: account.displayName.source.toLowerCase(),
            isHumanReadable: true,
          };
        } else if (account.farcasterProfile?.username) {
          result[address] = {
            name: `@${account.farcasterProfile.username}`,
            source: 'farcaster',
            isHumanReadable: true,
          };
        } else if (account.lensProfile?.handle) {
          result[address] = {
            name: account.lensProfile.handle,
            source: 'lens',
            isHumanReadable: true,
          };
        } else if (
          account.ensRecord?.name &&
          isValidHumanReadableName(account.ensRecord.name, address)
        ) {
          result[address] = {
            name: account.ensRecord.name,
            source: 'ens',
            isHumanReadable: true,
          };
        } else if (
          account.basename &&
          isValidHumanReadableName(account.basename, address)
        ) {
          result[address] = {
            name: account.basename,
            source: 'basename',
            isHumanReadable: true,
          };
        } else {
          result[address] = null;
        }
      } else {
        result[address] = null;
      }
    });

    return result;
  } catch (error) {
    console.warn('Failed to fetch Zapper account info:', error);
    return {};
  }
}

/**
 * Get account information for a single address
 * @param address Ethereum address to lookup
 * @returns Account information or null if not found
 */
export async function getZapperAccountInfoSingle(
  address: string,
): Promise<ZapperAccountInfo | null> {
  const result = await getZapperAccountInfo([address]);
  return result[address] || null;
}
