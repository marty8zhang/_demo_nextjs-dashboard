import NextAuth from 'next-auth';
import {authConfig} from './auth.config';
import {NextRequest, NextResponse} from 'next/server';

/*
 * Solution 1 - export from importing the singleton `auth`:
 * Note: importing `auth` from `auth.ts` won't work because of the incompatibility between `bcrypt` and the edge (different from Node.js) JavaScript runtime.
 * See:
 *   - https://github.com/kelektiv/node.bcrypt.js/issues/1017#issuecomment-1993995468.
 *   - https://runtime-compat.unjs.io/
 */
// export {auth as proxy} from '@/auth';

/*
 * Solution 2 - export a copy of `auth`:
 * Note: the problem with direct `auth` export is that there's no way to define other proxy logic.
 */
// console.log('proxy NextAuth(authConfig).auth:', NextAuth(authConfig).auth);
// export default NextAuth(authConfig).auth;

/*
 * Solution 3 - wrap `auth` around other proxy logic:
 */
const {auth} = NextAuth(authConfig)

interface AppRouteHandlerFnContext {
  params?: Record<string, string | string[]>;
}

export function proxy(
  request: NextRequest, ctx: AppRouteHandlerFnContext
) {
  /* TODO: revisit once `next-auth` updates types for Next 16 proxy. This additional step shouldn't be needed when the types are aligned. */
  const authCtx = {
    ...ctx,
    params: Promise.resolve(ctx.params ?? {}),
  };

  return auth(async function restProxy(req: NextRequest) {
    /*
     * Other proxy logic goes here. Note that `request` and `req` are two different objects. E.g.,
     * ```
     * proxy request: {"sourcePage":"/proxy"}
     * proxy req: {"auth":{"user":{"name":"User","email":"user@nextmail.com"},"expires":"2024-11-09T04:02:11.867Z"}}
     * ```
     */
    console.log('proxy request:', JSON.stringify(request));
    console.log('proxy req:', JSON.stringify(req));

    // return proxyOne(originalReq);
    // return proxyTwo(req);

    return NextResponse.next();
    // })(request, ctx);
  })(request, authCtx);
}

export const config = {
  /* https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher. */
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
