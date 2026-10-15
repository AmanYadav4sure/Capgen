import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  authorizedParties: (
    process.env.CLERK_AUTHORIZED_PARTIES ||
    'http://localhost:3000,http://localhost:3001,https://www.capgen.app,https://capgen.app'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
