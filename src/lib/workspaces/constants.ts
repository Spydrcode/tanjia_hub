export const DIRECTOR_WORKSPACE_ID = '11111111-1111-1111-1111-111111111111';
export const DEMO_WORKSPACE_ID = '22222222-2222-2222-2222-222222222222';

export function isDemoPath(pathname?: string | null) {
  if (!pathname) return false;
  return pathname.startsWith('/demo');
}
