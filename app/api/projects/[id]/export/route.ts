import { apiError, privateJson, requireUser, sameOrigin } from '@/lib/server/http';
import { recordExport } from '@/lib/server/repository';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(req);
    return privateJson({
      credits: await recordExport(await requireUser(req), (await context.params).id),
    });
  } catch (error) {
    return apiError(error);
  }
}
