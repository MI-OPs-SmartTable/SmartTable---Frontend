import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

type TunnelStatus = {
  status: "idle" | "downloading" | "starting" | "connected" | "error";
  url: string | null;
  error: string | null;
  localTarget: string;
  enabled?: boolean;
};

type LocalAccess = {
  url: string | null;
  ip: string | null;
  port: number;
  error: string | null;
};

function statusLabel(status: TunnelStatus["status"]): string {
  switch (status) {
    case "downloading":
      return "Descargando Cloudflare…";
    case "starting":
      return "Conectando túnel…";
    case "connected":
      return "Acceso remoto activo";
    case "error":
      return "Acceso remoto no disponible";
    default:
      return "Acceso remoto";
  }
}

function QrBlock({
  title,
  hint,
  url,
  emptyMessage,
}: {
  title: string;
  hint: string;
  url: string | null;
  emptyMessage?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setDataUrl(null);
      return;
    }
    void QRCode.toDataURL(url, {
      width: 148,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#2e1f0e", light: "#ffffff" },
    }).then((value) => {
      if (!cancelled) setDataUrl(value);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia esta URL:", url);
    }
  };

  if (!url) {
    return (
      <div className="pl-qr-block">
        <div className="pl-qr-title">{title}</div>
        <p className="pl-qr-empty">{emptyMessage || "No disponible"}</p>
      </div>
    );
  }

  return (
    <div className="pl-qr-block">
      <div className="pl-qr-title">{title}</div>
      <div className="pl-qr-sub">{hint}</div>
      <div className="pl-qr-frame">
        {dataUrl ? (
          <img src={dataUrl} alt={`Código QR ${title}`} />
        ) : (
          <div className="pl-qr-placeholder">Generando QR…</div>
        )}
      </div>
      <div className="pl-remote-url-row">
        <span className="pl-remote-url">{url}</span>
        <button type="button" className="pl-remote-copy" onClick={() => void handleCopy()}>
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

export default function RemoteAccessCard() {
  const isDesktop = Boolean(window.smarttable?.isDesktop && window.smarttable.getTunnelStatus);
  const [tunnel, setTunnel] = useState<TunnelStatus | null>(null);
  const [localAccess, setLocalAccess] = useState<LocalAccess | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshLocal = useCallback(async () => {
    const info = await window.smarttable?.getLocalAccess?.();
    if (info) setLocalAccess(info);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    let unsubscribe: (() => void) | undefined;

    void window.smarttable?.getTunnelStatus?.().then((status) => {
      if (status) setTunnel(status);
    });
    void refreshLocal();

    unsubscribe = window.smarttable?.onTunnelStatus?.((status) => {
      setTunnel(status);
      setBusy(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [isDesktop, refreshLocal]);

  const handleRetry = useCallback(async () => {
    if (!window.smarttable?.restartTunnel) return;
    setBusy(true);
    try {
      const status = await window.smarttable.restartTunnel();
      if (status) setTunnel(status);
      await refreshLocal();
    } finally {
      setBusy(false);
    }
  }, [refreshLocal]);

  if (!isDesktop || !tunnel) return null;

  const remoteOk = tunnel.status === "connected" && Boolean(tunnel.url);
  const isPending = tunnel.status === "starting" || tunnel.status === "downloading" || busy;

  return (
    <div className={`pl-remote ${remoteOk ? "ok" : tunnel.status === "error" ? "err" : ""}`}>
      <div className="pl-remote-head">
        <div>
          <div className="pl-remote-title">Acceso desde el celular</div>
          <div className="pl-remote-sub">
            Escanea el QR con la cámara. Local = misma WiFi · Remoto = fuera del local (internet)
          </div>
        </div>
        <button
          type="button"
          className="pl-remote-retry"
          onClick={() => void handleRetry()}
          disabled={isPending}
        >
          {isPending ? "Conectando…" : "Reintentar remoto"}
        </button>
      </div>

      <div className="pl-qr-grid">
        <QrBlock
          title="Red local"
          hint="Misma WiFi del restaurante"
          url={localAccess?.url ?? null}
          emptyMessage={localAccess?.error || "Detectando IP local…"}
        />

        {remoteOk ? (
          <QrBlock
            title="Acceso remoto"
            hint="Desde cualquier lugar (Cloudflare)"
            url={tunnel.url}
          />
        ) : (
          <div className="pl-qr-block pl-qr-block-muted">
            <div className="pl-qr-title">{statusLabel(tunnel.status)}</div>
            <div className="pl-qr-sub">
              El QR remoto solo aparece cuando el túnel conecta con éxito.
            </div>
            {tunnel.status === "error" && tunnel.error ? (
              <p className="pl-remote-error">{tunnel.error}</p>
            ) : isPending ? (
              <p className="pl-qr-empty">Esperando conexión…</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
