import type {NextAuthConfig} from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({auth, request: {nextUrl}}) {
      console.log('auth:', auth);
      console.log('nextUrl:', nextUrl);

      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnProtectedPage = isOnDashboard; /* && is... && is... */
      if (!isLoggedIn && isOnProtectedPage) {
        /* Option 1 - works with Solution 2 in `proxy.ts`. */
        // return false;

        /* Option 2 - works with Solution 3 in `proxy.ts`. */
        return Response.redirect(
          new URL(
            `/login?callbackUrl=${encodeURIComponent(nextUrl.href)}`,
            nextUrl
          )
        );
      }

      /* Access granted. */
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
