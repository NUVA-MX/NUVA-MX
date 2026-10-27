// Result of the admin "sync now" action (counts and a status only, never supplier text).
export type CatalogSyncStatus = 'idle' | 'success' | 'skipped' | 'cooldown' | 'outside_window' | 'failed' | 'not_configured' | 'rate_limited';

export type CatalogSyncState = {
  status: CatalogSyncStatus;
  accepted: number;
  rejected: number;
  deactivated: number;
  errorKind?: string;
};

export const idleSyncState: CatalogSyncState = { status: 'idle', accepted: 0, rejected: 0, deactivated: 0 };
