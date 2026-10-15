import { apiError, privateJson, requireUser, sameOrigin } from '@/lib/server/http';
import { deleteProject, getProject } from '@/lib/server/repository';

type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  try {
    return privateJson({
      project: await getProject(await requireUser(req), (await context.params).id),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(req: Request, context: Context) {
  try {
    sameOrigin(req);
    await deleteProject(await requireUser(req), (await context.params).id);
    return privateJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
