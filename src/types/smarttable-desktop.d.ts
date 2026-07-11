export {};

type TunnelStatusPayload = {
  status: "idle" | "downloading" | "starting" | "connected" | "error";
  url: string | null;
  error: string | null;
  localTarget: string;
  enabled?: boolean;
};

type LocalAccessPayload = {
  url: string | null;
  ip: string | null;
  port: number;
  error: string | null;
};

declare global {
  interface Window {
    smarttable?: {
      isDesktop: boolean;
      onRequestClose: (handler: () => void) => () => void;
      confirmQuit: () => void;
      cancelQuit: () => void;
      getTunnelStatus?: () => Promise<TunnelStatusPayload | null>;
      restartTunnel?: () => Promise<TunnelStatusPayload | null>;
      onTunnelStatus?: (handler: (status: TunnelStatusPayload) => void) => () => void;
      getLocalAccess?: () => Promise<LocalAccessPayload>;
    };
    __smarttableOnCloseRequest?: () => void;
  }
}
