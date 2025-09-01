/**
 * Thirdweb API client for handling blockchain transactions
 */
class ThirdwebAPIClient {
  private secretKey: string;
  private clientId: string;
  private baseUrl = 'https://api.thirdweb.com/v1';

  constructor() {
    this.secretKey = process.env.THIRDWEB_SECRET_KEY || '';
    this.clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '';

    if (!this.secretKey) {
      throw new Error('THIRDWEB_SECRET_KEY is required');
    }
    if (!this.clientId) {
      throw new Error('NEXT_PUBLIC_THIRDWEB_CLIENT_ID is required');
    }
  }

  public async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': this.secretKey,
        'x-client-id': this.clientId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Thirdweb API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Execute a token swap using Thirdweb's swap API
   */
  async executeSwap({
    from,
    tokenIn,
    tokenOut,
    exact = 'input',
  }: {
    from: string;
    tokenIn: {
      address: string;
      chainId: number;
      amount?: string;
      maxAmount?: string;
    };
    tokenOut: {
      address: string;
      chainId: number;
      amount?: string;
      minAmount?: string;
    };
    exact?: 'input' | 'output';
  }) {
    return this.makeRequest('/tokens/swap', {
      method: 'POST',
      body: JSON.stringify({
        from,
        tokenIn,
        tokenOut,
        exact,
      }),
    });
  }

  /**
   * Sign a message with the user's wallet
   */
  async signMessage({
    from,
    chainId,
    message,
  }: {
    from: string;
    chainId: number;
    message: string;
  }) {
    return this.makeRequest('/wallets/sign-message', {
      method: 'POST',
      body: JSON.stringify({
        from,
        chainId,
        message,
      }),
    });
  }

  /**
   * Send tokens to recipients
   */
  async sendTokens({
    from,
    chainId,
    recipients,
    tokenAddress,
    tokenId,
  }: {
    from: string;
    chainId: number;
    recipients: Array<{
      address: string;
      quantity: string;
    }>;
    tokenAddress?: string;
    tokenId?: string;
  }) {
    return this.makeRequest('/wallets/send', {
      method: 'POST',
      body: JSON.stringify({
        from,
        chainId,
        recipients,
        tokenAddress,
        tokenId,
      }),
    });
  }

  /**
   * Execute contract write operations
   */
  async writeContract({
    from,
    chainId,
    calls,
  }: {
    from: string;
    chainId: number;
    calls: Array<{
      contractAddress: string;
      method: string;
      params?: string[];
      value?: string;
    }>;
  }) {
    return this.makeRequest('/contracts/write', {
      method: 'POST',
      body: JSON.stringify({
        from,
        chainId,
        calls,
      }),
    });
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance({
    address,
    chainId,
    tokenAddress,
  }: {
    address: string;
    chainId: number[];
    tokenAddress?: string;
  }) {
    const params = new URLSearchParams();
    params.set('address', address);
    chainId.forEach((id) => params.append('chainId', id.toString()));
    if (tokenAddress) {
      params.set('tokenAddress', tokenAddress);
    }

    return this.makeRequest(`/wallets/balance?${params}`);
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions({
    address,
    chainId,
    limit = 20,
    page = 1,
  }: {
    address: string;
    chainId: number[];
    limit?: number;
    page?: number;
  }) {
    const params = new URLSearchParams();
    params.set('address', address);
    chainId.forEach((id) => params.append('chainId', id.toString()));
    params.set('limit', limit.toString());
    params.set('page', page.toString());

    return this.makeRequest(`/wallets/transactions?${params}`);
  }
}

// Export a singleton instance
export const thirdwebAPI = new ThirdwebAPIClient();
