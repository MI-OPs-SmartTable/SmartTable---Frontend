import { useCallback, useEffect, useRef, useState } from "react";
import type { BackupConfig, BackupCredentialsType } from "./types/backup.types";
import {
  deleteBackupCredentials,
  fetchBackupConfig,
  fetchBackupCredentialsStatus,
  previewBackupFile,
  restoreBackupFromFile,
  runBackupNow,
  startBackupOAuth,
  updateBackupConfig,
  type BackupRestorePreview,
} from "../../services/backupService";
import { clearSession } from "../../auth/authService";
import { waitForBackendReady } from "../../lib/waitForBackend";

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

const stepListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  fontSize: 13,
  color: "#4b5563",
  lineHeight: 1.65,
  display: "grid",
  gap: 6,
};

function DriveInstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="cfg-overlay">
      <div className="cfg-modal" style={{ maxWidth: 520 }} role="dialog" aria-modal="true" aria-labelledby="drive-help-title">
        <div className="cfg-modal-header">
          <div className="cfg-modal-title" id="drive-help-title">Cómo configurar Google Drive</div>
          <button type="button" className="cfg-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="cfg-modal-body" style={{ display: "grid", gap: 18, paddingBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#4b5563", lineHeight: 1.55 }}>
            Sigue estos pasos para subir los respaldos a la carpeta de Google Drive que te compartieron.
          </p>

          <ol style={stepListStyle}>
            <li>
              Pulsa <strong>Conectar con Google</strong> e inicia sesión con el Gmail al que te
              compartieron la carpeta de respaldo.
            </li>
            <li>
              Si Google muestra que la app no está verificada, elige{" "}
              <strong>Avanzado → Ir a SmartTable (no seguro)</strong> y acepta.
            </li>
            <li>
              Pide el <strong>ID de carpeta</strong> a quien te instaló SmartTable y pégalo en el campo.
            </li>
            <li>
              Activa <strong>Subir respaldo a Google Drive</strong> y pulsa{" "}
              <strong>Guardar configuración</strong>.
            </li>
          </ol>

          <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
            Si algo falla al conectar o al guardar, contacta a quien te instaló la app.
          </p>
        </div>

        <div className="cfg-modal-footer">
          <button
            type="button"
            className="cfg-btn-save"
            onClick={onClose}
            style={{ flex: "0 0 auto", minWidth: 140, marginLeft: "auto" }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RespaldoTab() {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupRestorePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const [backupEnabled, setBackupEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("");
  const [credentialsEmail, setCredentialsEmail] = useState<string | null>(null);
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const [oauthClientConfigured, setOauthClientConfigured] = useState(false);
  const oauthPollRef = useRef<number | null>(null);

  const applyCredentialsState = (data: {
    credentialsConfigured?: boolean;
    configured?: boolean;
    credentialsEmail: string | null;
    credentialsType?: BackupCredentialsType;
    oauthPending?: boolean;
    oauthClientConfigured?: boolean;
  }) => {
    setCredentialsConfigured(Boolean(data.credentialsConfigured ?? data.configured));
    setCredentialsEmail(data.credentialsEmail);
    setOauthPending(Boolean(data.oauthPending));
    setOauthClientConfigured(Boolean(data.oauthClientConfigured));
  };

  const applyFormFromConfig = (data: BackupConfig) => {
    setBackupEnabled(data.backupEnabled);
    setIntervalMinutes(data.intervalMinutes);
    applyCredentialsState(data);
    if (data.credentialsConfigured) {
      setGoogleDriveEnabled(data.googleDriveEnabled);
      setGoogleDriveFolderId(data.googleDriveFolderId);
    } else {
      setGoogleDriveEnabled(false);
      setGoogleDriveFolderId("");
    }
  };

  const stopOAuthPoll = () => {
    if (oauthPollRef.current !== null) {
      window.clearInterval(oauthPollRef.current);
      oauthPollRef.current = null;
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBackupConfig();
      setConfig(data);
      applyFormFromConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => stopOAuthPoll();
  }, [load]);

  const isDirty = Boolean(
    config &&
      (backupEnabled !== config.backupEnabled ||
        intervalMinutes !== config.intervalMinutes ||
        googleDriveEnabled !== config.googleDriveEnabled ||
        googleDriveFolderId.trim() !== (config.googleDriveFolderId || "").trim())
  );

  const handleSave = async () => {
    if (googleDriveEnabled && (!credentialsConfigured || !googleDriveFolderId.trim())) {
      setError("Para activar Google Drive conecta una cuenta y pega el ID de carpeta.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateBackupConfig({
        backupEnabled,
        intervalMinutes,
        googleDriveEnabled: credentialsConfigured ? googleDriveEnabled : false,
        googleDriveFolderId: credentialsConfigured ? googleDriveFolderId.trim() : "",
      });
      setConfig(updated);
      applyFormFromConfig(updated);
      setSuccess(
        updated.googleDriveEnabled
          ? "Configuración guardada. Google Drive quedó activo."
          : "Configuración guardada correctamente"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setError("");
    setSuccess("");
    setConnectingOAuth(true);
    try {
      const { authUrl } = await startBackupOAuth();
      window.open(authUrl, "_blank", "noopener,noreferrer");
      setSuccess("Se abrió Google para autorizar. Completa el inicio de sesión y vuelve a esta ventana.");

      stopOAuthPoll();
      let attempts = 0;
      oauthPollRef.current = window.setInterval(() => {
        attempts += 1;
        void (async () => {
          try {
            const status = await fetchBackupCredentialsStatus();
            if (status.configured && status.credentialsType === "oauth") {
              stopOAuthPoll();
              applyCredentialsState(status);
              setConnectingOAuth(false);
              setSuccess(
                `Cuenta conectada${status.credentialsEmail ? `: ${status.credentialsEmail}` : ""}. Ahora pega el ID de carpeta, activa Drive y guarda.`
              );
            } else if (attempts >= 60) {
              stopOAuthPoll();
              setConnectingOAuth(false);
              setError("No se detectó la autorización. Vuelve a pulsar “Conectar con Google”.");
            }
          } catch {
            // Seguir intentando mientras el usuario autoriza
          }
        })();
      }, 2000);
    } catch (e) {
      setConnectingOAuth(false);
      const raw = e instanceof Error ? e.message : "No se pudo iniciar la conexión con Google";
      const isProviderConfig =
        /GOOGLE_OAUTH_CLIENT|cliente OAuth de SmartTable|Falta el cliente OAuth/i.test(raw);
      setError(
        isProviderConfig
          ? "Google Drive aún no está disponible en esta instalación. Contacta a quien te instaló SmartTable."
          : raw
      );
    }
  };

  const handleDisconnectGoogle = async () => {
    setError("");
    setSuccess("");
    stopOAuthPoll();
    setConnectingOAuth(false);
    try {
      const result = await deleteBackupCredentials();
      applyCredentialsState(result);
      setGoogleDriveEnabled(false);
      setGoogleDriveFolderId("");
      const updated = await updateBackupConfig({
        googleDriveEnabled: false,
        googleDriveFolderId: "",
      });
      setConfig(updated);
      applyCredentialsState(updated);
      setGoogleDriveFolderId(updated.googleDriveFolderId || "");
      setGoogleDriveEnabled(updated.googleDriveEnabled);
      setSuccess("Cuenta de Google desconectada y permiso revocado en Google. Se limpió el ID de carpeta.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo desconectar Google");
    }
  };

  const handleRunNow = async () => {
    if (isDirty) {
      setError("Guarda la configuración antes de ejecutar el respaldo (botón Guardar configuración).");
      return;
    }

    setRunning(true);
    setError("");
    setSuccess("");
    try {
      const result = await runBackupNow();
      setConfig(result.config);
      applyCredentialsState(result.config);
      setSuccess(`Respaldo ejecutado: ${result.fileName} (${formatBytes(result.sizeBytes)})`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo ejecutar el respaldo");
      try {
        const data = await fetchBackupConfig();
        setConfig(data);
        applyCredentialsState(data);
      } catch {
        // Mantener el formulario local si falla la recarga de estado
      }
    } finally {
      setRunning(false);
    }
  };

  const handleRestoreFileChange = async (file: File | null) => {
    setRestoreFile(file);
    setRestorePreview(null);
    setError("");
    setSuccess("");
    if (!file) return;

    setPreviewing(true);
    try {
      const preview = await previewBackupFile(file);
      setRestorePreview(preview);
      if (preview.aviso) {
        setError(preview.aviso);
      }
    } catch (e) {
      setRestoreFile(null);
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo de respaldo");
    } finally {
      setPreviewing(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setError("Selecciona el archivo de respaldo descargado de Drive (.db.gz).");
      return;
    }

    const resumen = restorePreview
      ? `\n\nContenido del archivo:\n- ${restorePreview.usuarios} usuario(s): ${(restorePreview.nombresUsuarios || []).join(", ") || "—"}\n- ${restorePreview.productos} producto(s)\n- ${restorePreview.mesas} mesa(s)\n- ${restorePreview.insumos} insumo(s)`
      : "";

    const ok = window.confirm(
      "Esto reemplazará TODOS los datos actuales por los del archivo." +
        resumen +
        "\n\nSe guardará una copia previa y la app se reiniciará.\n\n¿Continuar?"
    );
    if (!ok) return;

    setRestoring(true);
    setError("");
    setSuccess("");
    try {
      const result = await restoreBackupFromFile(restoreFile);
      setSuccess(
        (result.message || "Base restaurada.") +
          " Esperando a que el servidor vuelva a estar listo…"
      );
      setRestoreFile(null);
      setRestorePreview(null);
      clearSession();

      const ready = await waitForBackendReady({ timeoutMs: 45000, intervalMs: 700 });
      if (!ready) {
        setSuccess(
          "Base restaurada, pero el servidor tardó en responder. En el login usa Reintentar."
        );
      }
      window.location.href = "/login";
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restaurar el respaldo");
      setRestoring(false);
    }
  };

  if (loading) {
    return <div className="cfg-loading"><p>Cargando respaldo...</p></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#9a3412", lineHeight: 1.5 }}>
          1) <strong>Conectar con Google</strong>, 2) pega el <strong>ID de carpeta</strong> que te compartieron,
          3) activa Drive y 4) <strong>Guardar configuración</strong>.
        </p>
      </div>

      {isDirty && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 10, padding: "12px 14px", fontSize: 13 }}>
          Tienes cambios sin guardar. Pulsa <strong>Guardar configuración</strong> para aplicar el switch, el intervalo y el ID de carpeta.
        </div>
      )}

      {!oauthClientConfigured && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 10, padding: "12px 14px", fontSize: 13 }}>
          Google Drive aún no está disponible en esta instalación. Contacta a quien te instaló SmartTable para activarlo.
        </div>
      )}

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Google Drive</h3>
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              border: "1.5px solid #fdba74",
              background: "#fff7ed",
              color: "#9a3412",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>?</span>
            Cómo configurar
          </button>
        </div>

        <Field
          label="Cuenta de Google"
          hint="Primero autoriza con el Gmail al que te compartieron la carpeta de respaldo."
        >
          {credentialsConfigured ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#047857" }}>
                Conectado: {credentialsEmail}
              </span>
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 13 }}
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={connectingOAuth || !oauthClientConfigured}
                style={{
                  padding: "9px 16px",
                  borderRadius: 999,
                  border: "none",
                  background: connectingOAuth || !oauthClientConfigured ? "#fdba74" : ORANGE,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: connectingOAuth || !oauthClientConfigured ? "default" : "pointer",
                  fontSize: 13,
                }}
              >
                {connectingOAuth ? "Esperando autorización..." : "Conectar con Google"}
              </button>
              {oauthPending && oauthClientConfigured && (
                <span style={{ fontSize: 13, color: "#6b7280" }}>Pendiente de autorizar</span>
              )}
            </div>
          )}
        </Field>

        <Field
          label="ID de carpeta en Drive"
          hint={
            credentialsConfigured
              ? "Pídelo a quien te instaló la app (está en la URL de la carpeta compartida)."
              : "Conecta una cuenta de Google para poder ingresar el ID de carpeta."
          }
        >
          <input
            value={credentialsConfigured ? googleDriveFolderId : ""}
            onChange={(e) => setGoogleDriveFolderId(e.target.value)}
            placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
            disabled={!credentialsConfigured}
            style={{
              ...inputStyle,
              background: credentialsConfigured ? "#fff" : "#f3f4f6",
              color: credentialsConfigured ? "#111827" : "#9ca3af",
              cursor: credentialsConfigured ? "text" : "not-allowed",
            }}
          />
        </Field>

        <Toggle
          checked={googleDriveEnabled}
          onChange={(value) => {
            if (!credentialsConfigured) return;
            setGoogleDriveEnabled(value);
          }}
          label="Subir respaldo a Google Drive"
        />
        {!credentialsConfigured && (
          <span style={{ fontSize: 12, color: "#6b7280", marginTop: -8 }}>
            Conecta Google antes de activar la subida a Drive.
          </span>
        )}
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

      <section
        style={{
          borderTop: "1px solid #f3f4f6",
          paddingTop: 20,
          display: "grid",
          gap: 14,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Restaurar desde archivo</h3>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
            Sube el archivo que se guarda en Google Drive (normalmente{" "}
            <code style={{ fontSize: 12 }}>smarttable-backup.db.gz</code>
            ). Reemplaza todos los datos actuales y reinicia el servidor.
          </p>
        </div>

        <Field
          label="Archivo de respaldo"
          hint="Formatos: .db.gz (recomendado), .db o .sqlite"
        >
          <input
            type="file"
            accept=".gz,.db,.sqlite,application/gzip,application/octet-stream"
            disabled={restoring || previewing}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              void handleRestoreFileChange(file);
            }}
            style={{ ...inputStyle, padding: "8px 10px" }}
          />
          {previewing && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>Analizando archivo…</span>
          )}
          {restoreFile && restorePreview && (
            <div
              style={{
                marginTop: 4,
                padding: "10px 12px",
                borderRadius: 8,
                background: restorePreview.aviso ? "#fff7ed" : "#ecfdf5",
                border: `1px solid ${restorePreview.aviso ? "#fed7aa" : "#a7f3d0"}`,
                fontSize: 12.5,
                color: "#374151",
                lineHeight: 1.5,
              }}
            >
              <div><strong>Archivo:</strong> {restoreFile.name} ({formatBytes(restoreFile.size)})</div>
              <div><strong>Usuarios:</strong> {restorePreview.usuarios} {(restorePreview.nombresUsuarios || []).length ? `(${restorePreview.nombresUsuarios.join(", ")})` : ""}</div>
              <div><strong>Productos:</strong> {restorePreview.productos} · <strong>Mesas:</strong> {restorePreview.mesas} · <strong>Insumos:</strong> {restorePreview.insumos}</div>
              {restorePreview.aviso && (
                <div style={{ marginTop: 6, color: "#9a3412" }}>{restorePreview.aviso}</div>
              )}
            </div>
          )}
        </Field>

        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring || previewing || !restoreFile || !restorePreview}
          style={{
            padding: "11px 22px",
            borderRadius: 999,
            border: "1.5px solid #fecaca",
            background: restoring || previewing || !restoreFile || !restorePreview ? "#fee2e2" : "#fff1f2",
            color: "#b91c1c",
            fontWeight: 700,
            cursor: restoring || previewing || !restoreFile || !restorePreview ? "default" : "pointer",
            fontSize: 14,
            width: "fit-content",
          }}
        >
          {restoring ? "Restaurando…" : "Restaurar base de datos"}
        </button>
      </section>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            padding: "11px 22px",
            borderRadius: 999,
            border: "none",
            background: saving || !isDirty ? "#fed7aa" : ORANGE,
            color: "#fff",
            fontWeight: 700,
            cursor: saving || !isDirty ? "default" : "pointer",
            boxShadow: isDirty ? "0 0 0 3px rgba(249, 115, 22, 0.25)" : "none",
          }}
        >
          {saving ? "Guardando..." : isDirty ? "Guardar configuración" : "Sin cambios por guardar"}
        </button>

        <button
          type="button"
          onClick={handleRunNow}
          disabled={running || isDirty}
          title={isDirty ? "Guarda primero la configuración" : undefined}
          style={{
            padding: "11px 22px",
            borderRadius: 999,
            border: `1.5px solid ${ORANGE}`,
            background: "#fff",
            color: ORANGE,
            fontWeight: 700,
            cursor: running || isDirty ? "default" : "pointer",
            opacity: isDirty ? 0.55 : 1,
          }}
        >
          {running ? "Ejecutando..." : "Ejecutar respaldo ahora"}
        </button>
      </div>

      {showInstructions && <DriveInstructionsModal onClose={() => setShowInstructions(false)} />}
    </div>
  );
}
