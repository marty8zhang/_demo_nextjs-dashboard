import NextAuth from 'next-auth';
import {authConfig} from './auth.config';
import {NextRequest, NextResponse} from 'next/server';

/*
 * Solution 1 - export from importing the singleton `auth`:
 * Note: Importing `auth` from `auth.ts` won't work because of the
 * incompatibility between `bcrypt` and the edge (different from Node.js)
 * JavaScript runtime.
 * See:
 *   - https://github.com/kelektiv/node.bcrypt.js/issues/1017#issuecomment-1993995468.
 *   - https://runtime-compat.unjs.io/
 */
// export {auth as middleware} from '@/auth';

/*
 * Solution 2 - export a copy of `auth`:
 * The problem with direct `auth` export is that there's no way to define other
 * middleware logic.
 */
// console.log('middleware NextAuth(authConfig).auth:', NextAuth(authConfig).auth);
// export default NextAuth(authConfig).auth;

/*
 * Solution 3 - wrap `auth` around other middleware logic:
 */
const {auth} = NextAuth(authConfig)

interface AppRouteHandlerFnContext {
  params?: Record<string, string | string[]>;
}

export function middleware(
  request: NextRequest, ctx: AppRouteHandlerFnContext
) {
  return auth(async function restMiddleware(req: NextRequest) {
    /*
     * Other middleware logic goes here. Note `request` and `req` are two
     * different objects. E.g.,
     * ```
     * middleware request: {"sourcePage":"/middleware"}
     * middleware req: {"auth":{"user":{"name":"User","email":"user@nextmail.com"},"expires":"2024-11-09T04:02:11.867Z"}}
     * ```
     */
    console.log('middleware request:', JSON.stringify(request));
    console.log('middleware req:', JSON.stringify(req));

    // return middlewareOne(originalReq);
    // return middlewareTwo(req);

    return NextResponse.next();
  })(request, ctx);
}

export const config = {
  /*
   * https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher.
   */
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
