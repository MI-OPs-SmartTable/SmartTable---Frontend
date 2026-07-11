export {};

declare global {
  interface Window {
    smarttable?: {
      isDesktop: boolean;
      onRequestClose: (handler: () => void) => () => void;
      confirmQuit: () => void;
      cancelQuit: () => void;
    };
    __smarttableOnCloseRequest?: () => void;
  }
}
