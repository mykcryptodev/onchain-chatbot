import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getZapperAccountInfoSingle } from '@/lib/zapper-api';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 },
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 },
      );
    }

    const info = await getZapperAccountInfoSingle(address);

    return NextResponse.json({ info });
  } catch (error) {
    console.error('Error fetching address info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address information' },
      { status: 500 },
    );
  }
}
