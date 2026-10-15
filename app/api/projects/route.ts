import { apiError, jsonBody, privateJson, requireUser, sameOrigin } from '@/lib/server/http';
import { listProjects, saveProject } from '@/lib/server/repository';

export async function GET(req: Request) {
  try {
    const projects = await listProjects(
      await requireUser(req),
      new URL(req.url).searchParams.get('cursor') || undefined,
    );
    return privateJson({
      projects: projects.slice(0, 50),
      nextCursor: projects.length > 50 ? projects[49].id : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const user = await requireUser(req);
    return privateJson({ project: await saveProject(user, await jsonBody(req, 900000)) });
  } catch (error) {
    return apiError(error);
  }
}
