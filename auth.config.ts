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
        /*
         * Option 1 - works with Solution 2 in `middleware.ts`.
         */
        // return false;

        /*
         * Option 2 - works with Solution 3 in `middleware.ts`.
         */
        return Response.redirect(
          new URL(
            `/login?callbackUrl=${encodeURIComponent(nextUrl.href)}`,
            nextUrl
          )
        );
      }

      /*
       * Allow access to all other pages, e.g., Homepage, by default.
       */
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
