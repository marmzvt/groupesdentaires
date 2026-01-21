import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Support multiple admin users via environment variables
interface AdminUser {
  id: string;
  username: string;
  password: string;
}

function getAdminUsers(): AdminUser[] {
  const users: AdminUser[] = [];

  // Primary admin
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    users.push({
      id: '1',
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    });
  }

  // Second admin (optional)
  if (process.env.ADMIN_USERNAME_2 && process.env.ADMIN_PASSWORD_2) {
    users.push({
      id: '2',
      username: process.env.ADMIN_USERNAME_2,
      password: process.env.ADMIN_PASSWORD_2,
    });
  }

  // Third admin (optional)
  if (process.env.ADMIN_USERNAME_3 && process.env.ADMIN_PASSWORD_3) {
    users.push({
      id: '3',
      username: process.env.ADMIN_USERNAME_3,
      password: process.env.ADMIN_PASSWORD_3,
    });
  }

  return users;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const adminUsers = getAdminUsers();

        if (adminUsers.length === 0) {
          console.error('Admin credentials not configured');
          return null;
        }

        // Find matching user
        for (const admin of adminUsers) {
          if (credentials.username === admin.username) {
            // Check password (support both plain and hashed)
            const isValidPassword =
              credentials.password === admin.password ||
              (await bcrypt.compare(credentials.password, admin.password));

            if (isValidPassword) {
              return {
                id: admin.id,
                name: admin.username,
                email: `${admin.username}@admin.local`,
              };
            }
          }
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
