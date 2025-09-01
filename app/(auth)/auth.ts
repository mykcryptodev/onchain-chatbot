import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import type { DefaultJWT } from 'next-auth/jwt';
import { handleEthereumLogin } from '@/lib/auth-ethereum';

export type UserType = 'ethereum';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: 'ethereum',
      credentials: {
        address: { type: 'text' },
        signature: { type: 'text' },
        message: { type: 'text' },
      },
      async authorize({ address, signature, message }: any) {
        console.log('Ethereum authorize called with:', {
          address,
          signature: `${signature?.substring(0, 10)}...`,
          message: typeof message,
        });

        if (!address || !signature || !message) {
          console.log('Missing required fields for Ethereum auth');
          return null;
        }

        const result = await handleEthereumLogin({
          address,
          signature,
          message,
        });

        console.log('handleEthereumLogin result:', result);

        if (!result.success || !result.user) {
          console.log('Ethereum login failed or no user returned');
          return null;
        }

        console.log('Ethereum auth successful, returning user:', {
          ...result.user,
          type: 'ethereum',
        });
        return { ...result.user, type: 'ethereum' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }

      return session;
    },
  },
});
