const WORKSPACE_ID_PATTERN = /^[A-Z0-9]{1,16}$/;

export function normalizeWorkspaceId(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidWorkspaceId(value: string): boolean {
  return WORKSPACE_ID_PATTERN.test(value);
}
