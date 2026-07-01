// ============================================
// CONFIRMACIÓN DE ELIMINACIÓN DE USUARIO
// ============================================

interface DeleteConfirmProps {
  nombre: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const I = {
  warn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export default function DeleteConfirmUsuario({ nombre, onCancel, onConfirm }: DeleteConfirmProps) {
  return (
    <div className="cfg-confirm-overlay">
      <div className="cfg-confirm-box">
        <div className="cfg-confirm-icon">{I.warn}</div>
        <div className="cfg-confirm-title">Eliminar usuario</div>
        <div className="cfg-confirm-desc">
          ¿Estás seguro de eliminar a <strong>{nombre}</strong>?<br />Esta acción no se puede deshacer.
        </div>
        <div className="cfg-confirm-acts">
          <button className="cfg-btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="cfg-btn-del" onClick={onConfirm}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}