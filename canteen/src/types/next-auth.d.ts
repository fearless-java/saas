import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'student' | 'merchant';
    };
  }

  interface User {
    role: 'student' | 'merchant';
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'merchant';
    id?: string;
  }
}
