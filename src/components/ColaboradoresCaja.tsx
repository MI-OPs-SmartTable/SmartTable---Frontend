import { useCallback, useEffect, useState } from "react";
import { getRolLabel } from "../pages/dashboard.constants";
import {
  agregarColaborador,
  cerrarSesion,
  fetchColaboradores,
  type ColaboradorApi,
} from "../services/cajaService";
import { fetchUsuarios } from "../services/configService";
import type { Usuario } from "../pages/dashboard/types/config.types";
import "../styles/Caja.css";

interface ColaboradoresCajaProps {
  cajaId: string;
  titularId: string;
  /** Solo quien abrió la caja puede agregar/quitar colaboradores. */
  puedeGestionar: boolean;
}

function formatInicioAt(value: string): string {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ColaboradoresCaja({ cajaId, titularId, puedeGestionar }: ColaboradoresCajaProps) {
  const [colaboradores, setColaboradores] = useState<ColaboradorApi[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [lista, todosUsuarios] = await Promise.all([
        fetchColaboradores(cajaId),
        fetchUsuarios().catch(() => []),
      ]);
      setColaboradores(lista);
      setUsuarios(todosUsuarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los colaboradores");
    } finally {
      setLoading(false);
    }
  }, [cajaId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const idsOcupados = new Set([titularId, ...colaboradores.map((c) => c.usuario_id)]);
  const usuariosDisponibles = usuarios.filter(
    (user) => user.activo && !idsOcupados.has(user.id)
  );

  const resetForm = () => {
    setUsuarioSeleccionado("");
    setFormError("");
    setShowForm(false);
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) {
      setFormError("Selecciona un usuario");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await agregarColaborador(cajaId, usuarioSeleccionado);
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo agregar el colaborador");
    } finally {
      setSaving(false);
    }
  };

  const handleQuitar = async (sesionId: string) => {
    setRemovingId(sesionId);
    setError("");
    try {
      await cerrarSesion(sesionId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar al colaborador");
    } finally {
      setRemovingId("");
    }
  };

  if (loading) {
    return <p className="caja-loading">Cargando colaboradores...</p>;
  }

  return (
    <div className="caja-section-card caja-colaboradores-card">
      <div className="caja-section-header">
        <h3>Colaboradores ({colaboradores.length})</h3>
        {puedeGestionar && !showForm && (
          <button type="button" className="caja-add-btn" onClick={() => setShowForm(true)}>
            + Agregar
          </button>
        )}
      </div>

      {error && <p className="caja-error">{error}</p>}

      {puedeGestionar && showForm && (
        <form className="caja-gasto-form" onSubmit={handleAgregar}>
          <div className="caja-gasto-form-fields">
            <select
              className="caja-colaborador-select"
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              disabled={saving}
              autoFocus
            >
              <option value="">Selecciona un usuario</option>
              {usuariosDisponibles.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre} — {getRolLabel(user.rol)}
                </option>
              ))}
            </select>
          </div>
          {formError && <p className="caja-gasto-form-error">{formError}</p>}
          <div className="caja-gasto-form-acts">
            <button type="submit" className="caja-gasto-btn-guardar" disabled={saving}>
              {saving ? "Agregando..." : "Agregar"}
            </button>
            <button
              type="button"
              className="caja-gasto-btn-cancelar"
              onClick={resetForm}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={`caja-section-body${colaboradores.length === 0 ? " empty" : ""}`}>
        {colaboradores.length === 0 ? (
          <p>Sin colaboradores activos</p>
        ) : (
          colaboradores.map((colaborador) => (
            <div key={colaborador.sesion_id} className="caja-colaborador-item">
              <div>
                <p className="caja-colaborador-nombre">{colaborador.nombre_completo}</p>
                <p className="caja-colaborador-meta">
                  {getRolLabel(colaborador.rol)} · Desde {formatInicioAt(colaborador.inicio_at)}
                </p>
              </div>
              {puedeGestionar && (
                <button
                  type="button"
                  className="caja-colaborador-quitar"
                  onClick={() => void handleQuitar(colaborador.sesion_id)}
                  disabled={removingId === colaborador.sesion_id}
                >
                  {removingId === colaborador.sesion_id ? "Quitando..." : "Quitar"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
