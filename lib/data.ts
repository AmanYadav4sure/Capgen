import type { Project, UserProfile } from './types';

/** Browser adapter. Authority, ownership, plans and balances live on the server. */
export class DataRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function dataRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: 'no-store',
    signal: options?.signal || AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new DataRequestError(
      data?.error || 'The operation failed. Your changes were not saved. Please try again.',
      response.status,
    );
  if (!data)
    throw new DataRequestError('The server returned an invalid response. Please try again.', 502);
  return data as T;
}
export async function getUserProfile(_user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<UserProfile> {
  return (await dataRequest<{ profile: UserProfile }>('/api/profile')).profile;
}
export async function setUserName(name: string): Promise<void> {
  await dataRequest('/api/profile', { method: 'PATCH', body: JSON.stringify({ name }) });
}
export async function deductUserCredit(_uid: string, id: string): Promise<number> {
  return (
    await dataRequest<{ credits: number }>(`/api/projects/${encodeURIComponent(id)}/export`, {
      method: 'POST',
    })
  ).credits;
}
const revisions = new Map<string, number>();
const queues = new Map<string, Promise<unknown>>();
export async function saveProject(
  project: Partial<Project>,
): Promise<{ data: Project | null; error: Error | null; isLocal: boolean }> {
  const id = project.id || crypto.randomUUID();
  const operation = (queues.get(id) || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const { project: saved } = await dataRequest<{ project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...project,
          id,
          revision: revisions.get(id) ?? project.revision ?? 0,
        }),
      });
      revisions.set(id, saved.revision || 0);
      return saved;
    });
  queues.set(id, operation);
  try {
    return { data: await operation, error: null, isLocal: false };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Project was not saved.'),
      isLocal: false,
    };
  } finally {
    if (queues.get(id) === operation) queues.delete(id);
  }
}
export async function fetchProject(id: string): Promise<Project | null> {
  try {
    const { project } = await dataRequest<{ project: Project }>(
      `/api/projects/${encodeURIComponent(id)}`,
    );
    revisions.set(id, project.revision || 0);
    return project;
  } catch (error) {
    if (error instanceof DataRequestError && error.status === 404) return null;
    throw error;
  }
}
export async function getUserProjects(
  _userId: string,
  cursor?: string,
): Promise<{ projects: Project[]; nextCursor: string | null }> {
  return dataRequest(`/api/projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
}
export async function deleteProject(id: string): Promise<boolean> {
  await dataRequest(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
  revisions.delete(id);
  return true;
}
