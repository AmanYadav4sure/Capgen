import 'server-only';
import type { AccountUser } from './identity';
import type { Project, UserProfile } from '@/lib/types';
import { database, transaction } from './database';
import { ApiError } from './http';
import { projectId, projectInput } from './project-validation';

function projectRow(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    transcriptText: String(row.transcript_text),
    words: row.words as Project['words'],
    styleSettings: row.style_settings as Project['styleSettings'],
    videoUrl: null,
    hasDeductedCredit: row.has_deducted_credit === true,
    revision: Number(row.revision),
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}
export async function profileFor(user: AccountUser): Promise<UserProfile> {
  const row = (
    await database().query(
      'SELECT uid,email,name,credits,plan,is_pro,created_at,updated_at FROM app_users WHERE uid=$1',
      [user.uid],
    )
  ).rows[0];
  if (!row) throw new ApiError(404, 'Your account was not found. Sign in again.');
  return {
    uid: row.uid,
    name: row.name || user.email.split('@')[0],
    email: row.email,
    credits: row.credits,
    plan: row.plan,
    isPro: row.is_pro,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
export async function nameProfile(user: AccountUser, name: unknown) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120)
    throw new ApiError(400, 'Enter a name between 1 and 120 characters.');
  const result = await database().query(
    'UPDATE app_users SET name=$2,updated_at=now() WHERE uid=$1',
    [user.uid, name.trim()],
  );
  if (!result.rowCount) throw new ApiError(404, 'Your account was not found.');
}
export async function listProjects(user: AccountUser, cursor?: string): Promise<Project[]> {
  if (cursor) {
    const anchor = (
      await database().query('SELECT updated_at FROM projects WHERE id=$1 AND user_id=$2', [
        projectId(cursor),
        user.uid,
      ])
    ).rows[0];
    if (!anchor) throw new ApiError(404, 'This project was not found in your account.');
    return (
      await database().query(
        'SELECT p.* FROM projects p WHERE p.user_id=$1 AND (p.updated_at,p.id)<(SELECT updated_at,id FROM projects WHERE id=$2 AND user_id=$1) ORDER BY p.updated_at DESC,p.id DESC LIMIT 51',
        [user.uid, cursor],
      )
    ).rows.map(projectRow);
  }
  return (
    await database().query(
      'SELECT * FROM projects WHERE user_id=$1 ORDER BY updated_at DESC,id DESC LIMIT 51',
      [user.uid],
    )
  ).rows.map(projectRow);
}
export async function getProject(user: AccountUser, id: string): Promise<Project> {
  const row = (
    await database().query('SELECT * FROM projects WHERE id=$1 AND user_id=$2', [
      projectId(id),
      user.uid,
    ])
  ).rows[0];
  if (!row) throw new ApiError(404, 'This project was not found in your account.');
  return projectRow(row);
}
export async function saveProject(
  user: AccountUser,
  input: Record<string, unknown>,
): Promise<Project> {
  const id = projectId(input.id);
  const values = projectInput(input);
  return transaction(async (client) => {
    const previous = (
      await client.query('SELECT user_id,revision FROM projects WHERE id=$1 FOR UPDATE', [id])
    ).rows[0];
    if (previous && previous.user_id !== user.uid)
      throw new ApiError(404, 'This project was not found in your account.');
    if ((previous?.revision || 0) !== (input.revision || 0))
      throw new ApiError(
        409,
        'This project changed in another tab. Reload the project before saving again; your current edits are still in this tab.',
      );
    const params = [
      id,
      user.uid,
      values.title,
      values.transcriptText,
      JSON.stringify(values.words),
      JSON.stringify(values.styleSettings),
    ];
    const result = previous
      ? await client.query(
          'UPDATE projects SET title=$3,transcript_text=$4,words=$5::jsonb,style_settings=$6::jsonb,revision=revision+1,updated_at=clock_timestamp() WHERE id=$1 AND user_id=$2 RETURNING *',
          params,
        )
      : await client.query(
          'INSERT INTO projects(id,user_id,title,transcript_text,words,style_settings,revision) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,1) ON CONFLICT DO NOTHING RETURNING *',
          params,
        );
    if (!result.rows[0])
      throw new ApiError(409, 'This project changed in another tab. Reload before saving again.');
    return projectRow(result.rows[0]);
  });
}
export async function deleteProject(user: AccountUser, id: string): Promise<void> {
  const result = await database().query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [
    projectId(id),
    user.uid,
  ]);
  if (!result.rowCount) throw new ApiError(404, 'This project was not found in your account.');
}
export async function recordExport(user: AccountUser, id: string): Promise<number> {
  return transaction(async (client) => {
    const project = (
      await client.query(
        'SELECT has_deducted_credit FROM projects WHERE id=$1 AND user_id=$2 FOR UPDATE',
        [projectId(id), user.uid],
      )
    ).rows[0];
    if (!project) throw new ApiError(404, 'This project was not found in your account.');
    const account = (
      await client.query('SELECT credits FROM app_users WHERE uid=$1 FOR UPDATE', [user.uid])
    ).rows[0];
    if (!account)
      throw new ApiError(409, 'Your credit balance could not be verified. Refresh your account.');
    if (project.has_deducted_credit) return account.credits;
    if (account.credits < 1)
      throw new ApiError(
        403,
        'You have no video credits left. Choose a plan to export a new project.',
      );
    await client.query('UPDATE app_users SET credits=credits-1,updated_at=now() WHERE uid=$1', [
      user.uid,
    ]);
    await client.query('UPDATE projects SET has_deducted_credit=true WHERE id=$1', [id]);
    return account.credits - 1;
  });
}
