import { apiError, jsonBody, privateJson, requireUser, sameOrigin } from '@/lib/server/http';
import { nameProfile, profileFor } from '@/lib/server/repository';

export async function GET(req: Request) {
  try {
    return privateJson({ profile: await profileFor(await requireUser(req)) });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    const user = await requireUser(req);
    const { name } = await jsonBody(req);
    await nameProfile(user, name);
    return privateJson({ profile: await profileFor(user) });
  } catch (error) {
    return apiError(error);
  }
}
