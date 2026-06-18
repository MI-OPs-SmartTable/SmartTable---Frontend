

import { useState, useEffect, useCallback } from "react";
import type { Usuario } from "./types/config.types";
import { initials, rolInfo } from "../../data/seedConfig";
import {
  fetchUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../../services/configService";
import UsuarioModal from "../../components/CrearEditarUsuario";
import DeleteConfirm from "../../components/DeleteConfirmUsuario";
import "../../styles/Configuracion.css";
import RestauranteTab from "./RestauranteTab";
import EntidadesBancariasTab from "./EntidadesBancariasTab";


const I = {
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  user: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  pin: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  restaurant: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
      <path d="M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  bank: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  ),
};



export default function Configuracion() {
  // Estado de usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  // Estado de tabs
  const [activeTab, setActiveTab] = useState<"usuarios" | "restaurante" | "bancarias">("usuarios");

  // Cargar usuarios desde BD
  useEffect(() => {
    const cargarUsuarios = async () => {
      setLoading(true);
      const data = await fetchUsuarios();
      setUsuarios(data);
      setLoading(false);
    };
    cargarUsuarios();
  }, []);

  const handleSave = useCallback(
    async (usuario: Usuario) => {
      try {
        let saved: Usuario;
        const exists = usuarios.some((u) => u.id === usuario.id);
        if (exists) {
          saved = await actualizarUsuario(usuario.id, usuario);
          setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? saved : u)));
        } else {
          saved = await crearUsuario(usuario);
          setUsuarios((prev) => [...prev, saved]);
        }
      } catch (error) {
        console.error("Error guardando usuario:", error);
      }
    },
    [usuarios]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await eliminarUsuario(deleteTarget.id);
      setUsuarios((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error eliminando usuario:", error);
    }
  }, [deleteTarget]);

  // ============================================
  // RENDERIZADO DE TABS
  // ============================================

  const renderTabContent = () => {
    switch (activeTab) {
      case "usuarios":
        return renderUsuariosTab();
      case "restaurante":
        return <RestauranteTab />;
      case "bancarias":
        return <EntidadesBancariasTab />;
      default:
        return null;
    }
  };

  const renderUsuariosTab = () => {
    if (loading) {
      return (
        <div className="cfg-loading">
          <p>Cargando usuarios...</p>
        </div>
      );
    }

    return (
      <>
        <div className="cfg-toolbar">
          <span className="cfg-count">
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado
            {usuarios.length !== 1 ? "s" : ""}
          </span>
          <button
            className="cfg-btn-new"
            onClick={() => {
              setEditTarget(null);
              setModal("new");
            }}
          >
            {I.plus} Nuevo Usuario
          </button>
        </div>

        <div className="cfg-list">
          {usuarios.map((u) => {
            const rol = rolInfo(u.rol);
            return (
              <div key={u.id} className="cfg-card">
                <div className="cfg-avatar">{initials(u.nombre)}</div>
                <div className="cfg-info">
                  <div className="cfg-name-row">
                    <span className="cfg-name">{u.nombre}</span>
                    {u.esTu && <span className="cfg-tu-badge">Tú</span>}
                  </div>
                  {u.email && <div className="cfg-email">{u.email}</div>}
                  <div className="cfg-tags">
                    <span className="cfg-rol-pill" style={{ background: rol.bg, color: rol.color }}>
                      {rol.label}
                    </span>
                    <span className="cfg-pin">{I.pin} PIN: ••••</span>
                    {!u.activo && <span className="cfg-status inactive">Inactivo</span>}
                  </div>
                </div>
                <div className="cfg-actions">
                  <button
                    className="cfg-action-btn"
                    title="Editar"
                    onClick={() => {
                      setEditTarget(u);
                      setModal("edit");
                    }}
                  >
                    {I.edit}
                  </button>
                  <button className="cfg-action-btn" title="Ver permisos" style={{ cursor: "default" }}>
                    {I.user}
                  </button>
                  <button
                    className={`cfg-action-btn danger${u.esTu ? "" : ""}`}
                    title={u.esTu ? "No puedes eliminarte a ti mismo" : "Eliminar"}
                    disabled={u.esTu}
                    onClick={() => !u.esTu && setDeleteTarget(u)}
                  >
                    {I.trash}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modales de usuarios */}
        {(modal === "new" || modal === "edit") && (
          <UsuarioModal
            editTarget={modal === "edit" ? editTarget : null}
            usuarios={usuarios}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}

        {deleteTarget && (
          <DeleteConfirm
            nombre={deleteTarget.nombre}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </>
    );
  };


  return (
    <div className="cfg-root">
      <h1 className="cfg-title">Configuración</h1>
      <p className="cfg-sub">Gestiona usuarios, restaurante y entidades bancarias</p>

      {/* Tabs */}
      <div className="cfg-tabs">
        <button
          className={`cfg-tab ${activeTab === "usuarios" ? "active" : ""}`}
          onClick={() => setActiveTab("usuarios")}
        >
          <span className="cfg-tab-icon">{I.users}</span>
          Usuarios
        </button>
        <button
          className={`cfg-tab ${activeTab === "restaurante" ? "active" : ""}`}
          onClick={() => setActiveTab("restaurante")}
        >
          <span className="cfg-tab-icon">{I.restaurant}</span>
          Restaurante
        </button>
        <button
          className={`cfg-tab ${activeTab === "bancarias" ? "active" : ""}`}
          onClick={() => setActiveTab("bancarias")}
        >
          <span className="cfg-tab-icon">{I.bank}</span>
          Entidades Bancarias
        </button>
      </div>

      {/* Contenido del tab activo */}
      <div className="cfg-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}