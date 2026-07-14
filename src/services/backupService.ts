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

export async function restoreBackupFromFile(file: File): Promise<{
  success: boolean;
  requiresRestart: boolean;
  message: string;
  safetyBackup: string | null;
  userCount?: number;
  aviso?: string | null;
  stats?: {
    usuarios: number;
    mesas: number;
    productos: number;
    insumos: number;
    categorias: number;
    nombresUsuarios: string[];
  };
}> {
  const lower = file.name.toLowerCase();
  const contentType = lower.endsWith(".gz")
    ? "application/gzip"
    : "application/octet-stream";

  return apiClient.postBinary("/backup/restore", file, {
    contentType,
    fileName: file.name,
  });
}

export type BackupRestorePreview = {
  ok: boolean;
  fileName: string;
  sizeBytes: number;
  usuarios: number;
  mesas: number;
  productos: number;
  insumos: number;
  categorias: number;
  nombresUsuarios: string[];
  aviso: string | null;
};

export async function previewBackupFile(file: File): Promise<BackupRestorePreview> {
  const lower = file.name.toLowerCase();
  const contentType = lower.endsWith(".gz")
    ? "application/gzip"
    : "application/octet-stream";

  return apiClient.postBinary("/backup/restore/preview", file, {
    contentType,
    fileName: file.name,
  });
}
