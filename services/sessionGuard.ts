/** Pure guard shared by login, profile refresh and initial session hydration. */
export function isCurrentSession(
  requestVersion: number,
  currentVersion: number,
  requestToken: string | null,
  currentToken: string | null
): boolean {
  return requestVersion === currentVersion && requestToken === currentToken;
}
