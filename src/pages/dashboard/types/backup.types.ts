export type BackupCredentialsType = "none" | "service_account" | "oauth_pending" | "oauth";

export type BackupConfig = {
  backupEnabled: boolean;
  intervalMinutes: number;
  runOnStart: boolean;
  fileName: string;
  googleDriveEnabled: boolean;
  googleDriveFolderId: string;
  credentialsConfigured: boolean;
  credentialsEmail: string | null;
  credentialsType: BackupCredentialsType;
  oauthPending: boolean;
  oauthClientConfigured: boolean;
  lastRunAt: string | null;
  lastRunStatus: "idle" | "success" | "error";
  lastRunError: string | null;
  lastLocalSizeBytes: number | null;
  lastDriveFileId: string | null;
};

export type BackupCredentialsStatus = {
  configured: boolean;
  credentialsEmail: string | null;
  credentialsType: BackupCredentialsType;
  oauthPending: boolean;
  oauthClientConfigured: boolean;
};

export type UpdateBackupConfigPayload = {
  backupEnabled?: boolean;
  intervalMinutes?: number;
  runOnStart?: boolean;
  fileName?: string;
  googleDriveEnabled?: boolean;
  googleDriveFolderId?: string;
};
