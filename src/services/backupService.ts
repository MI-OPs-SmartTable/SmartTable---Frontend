import { apiClient } from "../lib/apiClient";
import type {
  BackupConfig,
  BackupCredentialsStatus,
  UpdateBackupConfigPayload,
} from "../pages/dashboard/types/backup.types";

export async function fetchBackupConfig(): Promise<BackupConfig> {
  return apiClient.get<BackupConfig>("/backup/config");
}

export async function updateBackupConfig(
  payload: UpdateBackupConfigPayload
): Promise<BackupConfig> {
  return apiClient.put<BackupConfig>("/backup/config", payload);
}

export async function fetchBackupCredentialsStatus(): Promise<BackupCredentialsStatus> {
  return apiClient.get<BackupCredentialsStatus>("/backup/credentials/status");
}

export async function deleteBackupCredentials(): Promise<BackupCredentialsStatus> {
  return apiClient.delete<BackupCredentialsStatus>("/backup/credentials");
}

export async function startBackupOAuth(): Promise<{
  authUrl: string;
  redirectUri: string;
  state: string;
}> {
  return apiClient.post("/backup/oauth/start");
}

export async function runBackupNow(): Promise<{
  message: string;
  fileName: string;
  sizeBytes: number;
  driveFileId: string | null;
  config: BackupConfig;
}> {
  return apiClient.post("/backup/run");
}
