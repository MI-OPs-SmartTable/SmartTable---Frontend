import { useCallback, useEffect, useState } from "react";
import type { BackupConfig } from "./types/backup.types";
import {
  deleteBackupCredentials,
  fetchBackupConfig,
  runBackupNow,
  updateBackupConfig,
  uploadBackupCredentials,
} from "../../services/backupService";

const ORANGE = "#F97316";

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleString();
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 46,
          height: 26,
          borderRadius: 999,
          border: "none",
          background: checked ? ORANGE : "#d1d5db",
          position: "relative",
          cursor: "pointer",
          transition: "background .2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .2s",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }}
        />
      </button>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{label}</span>
    </label>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 12, color: "#6b7280" }}>{hint}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 13px",
  fontSize: 14,
  outline: "none",
};

export default function RespaldoTab() {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [backupEnabled, setBackupEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("");
  const [credentialsEmail, setCredentialsEmail] = useState<string | null>(null);
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBackupConfig();
      setConfig(data);
      setBackupEnabled(data.backupEnabled);
      setIntervalMinutes(data.intervalMinutes);
      setGoogleDriveEnabled(data.googleDriveEnabled);
      setGoogleDriveFolderId(data.googleDriveFolderId);
      setCredentialsEmail(data.credentialsEmail);
      setCredentialsConfigured(data.credentialsConfigured);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateBackupConfig({
        backupEnabled,
        intervalMinutes,
        googleDriveEnabled,
        googleDriveFolderId,
      });
      setConfig(updated);
      setCredentialsEmail(updated.credentialsEmail);
      setCredentialsConfigured(updated.credentialsConfigured);
      setSuccess("Configuración guardada correctamente");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCredentialsFile = async (file: File | null) => {
    if (!file) return;

    setError("");
    setSuccess("");
    try {
      const text = await file.text();
      const credentials = JSON.parse(text);
      const result = await uploadBackupCredentials(credentials);
      setCredentialsConfigured(result.configured);
      setCredentialsEmail(result.credentialsEmail);
      setSuccess("Credenciales de Google guardadas");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archivo de credenciales inválido");
    }
  };

  const handleRemoveCredentials = async () => {
    setError("");
    setSuccess("");
    try {
      await deleteBackupCredentials();
      setCredentialsConfigured(false);
      setCredentialsEmail(null);
      setGoogleDriveEnabled(false);
      setSuccess("Credenciales eliminadas");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron eliminar las credenciales");
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setError("");
    setSuccess("");
    try {
      const result = await runBackupNow();
      setConfig(result.config);
      setSuccess(`Respaldo ejecutado: ${result.fileName} (${formatBytes(result.sizeBytes)})`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo ejecutar el respaldo");
      await load();
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="cfg-loading"><p>Cargando respaldo...</p></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#9a3412", lineHeight: 1.5 }}>
          Configura aquí el respaldo automático de la base de datos. La copia local se guarda junto a los datos de la app
          y, si activas Google Drive, se sube el mismo archivo cada intervalo.
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "12px 14px", fontSize: 13 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", borderRadius: 10, padding: "12px 14px", fontSize: 13 }}>
          {success}
        </div>
      )}

      <section style={{ display: "grid", gap: 18 }}>
        <Toggle checked={backupEnabled} onChange={setBackupEnabled} label="Respaldo automático activo" />

        <Field label="Intervalo (minutos)" hint="Entre 1 y 59 minutos">
          <input
            type="number"
            min={1}
            max={59}
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
            style={inputStyle}
          />
        </Field>
      </section>

      <section style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20, display: "grid", gap: 18 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Google Drive</h3>

        <Toggle checked={googleDriveEnabled} onChange={setGoogleDriveEnabled} label="Subir respaldo a Google Drive" />

        <Field
          label="ID de carpeta en Drive"
          hint="Cópialo de la URL de la carpeta: drive.google.com/drive/folders/ESTE_ID"
        >
          <input
            value={googleDriveFolderId}
            onChange={(e) => setGoogleDriveFolderId(e.target.value)}
            placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
            style={inputStyle}
          />
        </Field>

        <Field
          label="Credenciales (JSON de cuenta de servicio)"
          hint="Descárgalas desde Google Cloud Console. Comparte la carpeta de Drive con el email de la cuenta."
        >
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => handleCredentialsFile(e.target.files?.[0] || null)}
            style={{ fontSize: 13 }}
          />
          {credentialsConfigured ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: "#047857" }}>
                Configurado: {credentialsEmail}
              </span>
              <button
                type="button"
                onClick={handleRemoveCredentials}
                style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 13 }}
              >
                Eliminar
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: "#9ca3af" }}>Sin credenciales cargadas</span>
          )}
        </Field>
      </section>

      <section style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Estado</h3>
        <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#4b5563" }}>
          <div><strong>Último respaldo:</strong> {formatDate(config?.lastRunAt ?? null)}</div>
          <div><strong>Estado:</strong> {config?.lastRunStatus === "success" ? "Correcto" : config?.lastRunStatus === "error" ? "Error" : "Sin ejecutar"}</div>
          <div><strong>Tamaño local:</strong> {formatBytes(config?.lastLocalSizeBytes ?? null)}</div>
          {config?.lastRunError && (
            <div style={{ color: "#b91c1c" }}><strong>Error:</strong> {config.lastRunError}</div>
          )}
        </div>
      </section>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "11px 22px",
            borderRadius: 999,
            border: "none",
            background: saving ? "#fed7aa" : ORANGE,
            color: "#fff",
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>

        <button
          type="button"
          onClick={handleRunNow}
          disabled={running}
          style={{
            padding: "11px 22px",
            borderRadius: 999,
            border: `1.5px solid ${ORANGE}`,
            background: "#fff",
            color: ORANGE,
            fontWeight: 700,
            cursor: running ? "default" : "pointer",
          }}
        >
          {running ? "Ejecutando..." : "Ejecutar respaldo ahora"}
        </button>
      </div>
    </div>
  );
}
