import { useState } from "react";
import { useApp, ROLE_LABELS, ROLE_COLORS, Role, User, RoomConfig, TableConfig } from "../context/AppContext";
import { Plus, Edit2, Trash2, X, Check, UserCheck, UserX, Shield, Store, Users as UsersIcon } from "lucide-react";

type UserFormData = Omit<User, "id">;
type RoomFormData = Omit<RoomConfig, "id" | "tables"> & { tables: string };

const emptyUserForm = (): UserFormData => ({
  name: "", email: "", role: "cashier", pin: "", active: true
});

const emptyRoomForm = (): RoomFormData => ({
  name: "", tables: ""
});

export default function Settings() {
  const { users, setUsers, currentUser, rooms = [], setRooms } = useApp();
  const [activeTab, setActiveTab] = useState<"users" | "restaurant">("users");

  // Users state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm());
  const [userError, setUserError] = useState("");

  // Restaurant state
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState<RoomFormData>(emptyRoomForm());
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Users functions
  const openCreateUser = () => { setUserForm(emptyUserForm()); setEditingUserId(null); setUserError(""); setShowUserForm(true); };
  const openEditUser = (u: User) => {
    setUserForm({ name: u.name, email: u.email, role: u.role, pin: u.pin, active: u.active });
    setEditingUserId(u.id);
    setUserError("");
    setShowUserForm(true);
  };

  const saveUser = () => {
    if (!userForm.name || !userForm.pin) { setUserError("Nombre y PIN son requeridos"); return; }
    if (userForm.pin.length !== 4 || !/^\d{4}$/.test(userForm.pin)) { setUserError("El PIN debe ser de 4 dígitos numéricos"); return; }
    if (editingUserId) {
      setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...userForm } : u));
    } else {
      setUsers(prev => [...prev, { id: `u_${Date.now()}`, ...userForm }]);
    }
    setShowUserForm(false);
  };

  const toggleActive = (id: string) => {
    if (id === currentUser?.id) return;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const deleteUser = (id: string) => {
    if (id === currentUser?.id) { alert("No puedes eliminar tu propio usuario"); return; }
    if (confirm("¿Eliminar este usuario?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // Restaurant functions
  const openCreateRoom = () => { setRoomForm(emptyRoomForm()); setEditingRoomId(null); setShowRoomForm(true); };
  const openEditRoom = (r: RoomConfig) => {
    setRoomForm({ name: r.name, tables: r.tables.map(t => t.name).join(", ") });
    setEditingRoomId(r.id);
    setShowRoomForm(true);
  };

  const saveRoom = () => {
    if (!roomForm.name || !roomForm.tables.trim()) return;
    const tableNames = roomForm.tables.split(",").map(t => t.trim()).filter(t => t);
    const tables: TableConfig[] = tableNames.map((name, i) => ({ id: `t_${Date.now()}_${i}`, name }));

    if (editingRoomId) {
      setRooms(prev => prev.map(r => r.id === editingRoomId ? { ...r, name: roomForm.name, tables } : r));
    } else {
      setRooms(prev => [...prev, { id: `r_${Date.now()}`, name: roomForm.name, tables }]);
    }
    setShowRoomForm(false);
  };

  const deleteRoom = (id: string) => {
    if (confirm("¿Eliminar esta ubicación y todas sus mesas?")) {
      setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  const addTable = (roomId: string) => {
    if (!tableName.trim()) return;
    setRooms(prev => prev.map(r => r.id !== roomId ? r : {
      ...r,
      tables: [...r.tables, { id: `t_${Date.now()}`, name: tableName }]
    }));
    setTableName("");
    setSelectedRoomId(null);
  };

  const updateTable = (roomId: string, tableId: string) => {
    if (!tableName.trim()) return;
    setRooms(prev => prev.map(r => r.id !== roomId ? r : {
      ...r,
      tables: r.tables.map(t => t.id === tableId ? { ...t, name: tableName } : t)
    }));
    setEditingTableId(null);
    setTableName("");
  };

  const deleteTable = (roomId: string, tableId: string) => {
    if (confirm("¿Eliminar esta mesa?")) {
      setRooms(prev => prev.map(r => r.id !== roomId ? r : {
        ...r,
        tables: r.tables.filter(t => t.id !== tableId)
      }));
    }
  };

  const rolePermissions: Record<Role, string[]> = {
    admin: ["Acceso total al sistema", "Gestión de usuarios", "Reportes completos", "Caja y ventas", "Inventario y proveedores"],
    cashier: ["Registro de ventas", "Apertura y cierre de caja", "Consulta de productos"],
    waiter: ["Registro de ventas", "Consulta de productos"],
    inventory: ["Gestión de inventario", "Gestión de productos", "Gestión de proveedores"],
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">Configuración</h1>
          <p className="text-slate-500 text-sm">Gestiona usuarios y configuración del restaurante</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-all border-b-2 -mb-px ${
            activeTab === "users" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <UsersIcon size={16} />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab("restaurant")}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-all border-b-2 -mb-px ${
            activeTab === "restaurant" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Store size={16} />
          Restaurante
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">{users.length} usuarios registrados</p>
            <button onClick={openCreateUser} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
              <Plus size={16} /> Nuevo Usuario
            </button>
          </div>

          <div className="grid gap-4">
            {users.map(user => (
              <div key={user.id} className={`bg-white rounded-xl p-4 border transition-all ${user.active ? "border-slate-200" : "border-slate-200 bg-slate-50 opacity-60"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full ${user.active ? "bg-orange-100" : "bg-slate-200"} flex items-center justify-center text-lg`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-800" style={{ fontWeight: 500 }}>{user.name}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tú</span>
                          )}
                          {!user.active && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactivo</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-14">
                      <span className={`text-xs px-2 py-1 rounded-full ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                      <span className="text-xs text-slate-400">PIN: ••••</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditUser(user)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(user.id)}
                      disabled={user.id === currentUser?.id}
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-30"
                    >
                      {user.active ? <UserCheck size={16} /> : <UserX size={16} />}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={user.id === currentUser?.id}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* User Form Modal */}
          {showUserForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
                  <h3 className="text-slate-800">{editingUserId ? "Editar Usuario" : "Nuevo Usuario"}</h3>
                  <button onClick={() => setShowUserForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="px-6 py-4 space-y-4">
                  {userError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{userError}</div>}

                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Nombre completo *</label>
                    <input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Email</label>
                    <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">PIN de acceso * (4 dígitos)</label>
                    <input type="text" maxLength={4} value={userForm.pin} onChange={e => setUserForm(f => ({ ...f, pin: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="1234" />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600 mb-2 block flex items-center gap-2">
                      <Shield size={14} /> Rol y permisos
                    </label>
                    <div className="space-y-2">
                      {(Object.keys(rolePermissions) as Role[]).map(role => (
                        <label key={role} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${userForm.role === role ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-slate-300"}`}>
                          <input type="radio" name="role" checked={userForm.role === role} onChange={() => setUserForm(f => ({ ...f, role }))} className="mt-1" />
                          <div className="flex-1">
                            <p className={`text-sm mb-1 ${ROLE_COLORS[role]} inline-block px-2 py-0.5 rounded-full`} style={{ fontWeight: 500 }}>
                              {ROLE_LABELS[role]}
                            </p>
                            <ul className="space-y-0.5">
                              {rolePermissions[role].map((perm, i) => (
                                <li key={i} className="text-xs text-slate-500">• {perm}</li>
                              ))}
                            </ul>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="active" checked={userForm.active} onChange={e => setUserForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 text-orange-500" />
                    <label htmlFor="active" className="text-sm text-slate-600">Usuario activo</label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowUserForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancelar</button>
                    <button onClick={saveUser} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                      <Check size={16} /> Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restaurant Tab */}
      {activeTab === "restaurant" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">{rooms.length} ubicaciones · {rooms.reduce((acc, r) => acc + r.tables.length, 0)} mesas totales</p>
            <button onClick={openCreateRoom} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
              <Plus size={16} /> Nueva Ubicación
            </button>
          </div>

          <div className="grid gap-4">
            {rooms.map(room => (
              <div key={room.id} className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-slate-800" style={{ fontWeight: 500 }}>{room.name}</p>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{room.tables.length} mesas</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditRoom(room)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteRoom(room.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {room.tables.map(table => (
                    <div key={table.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      {editingTableId === table.id ? (
                        <>
                          <input
                            type="text"
                            value={tableName}
                            onChange={e => setTableName(e.target.value)}
                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                            autoFocus
                          />
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => updateTable(room.id, table.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <Check size={14} />
                            </button>
                            <button onClick={() => { setEditingTableId(null); setTableName(""); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                              <X size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-slate-700">{table.name}</span>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingTableId(table.id); setTableName(table.name); }} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deleteTable(room.id, table.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add table */}
                  {selectedRoomId === room.id ? (
                    <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
                      <input
                        type="text"
                        value={tableName}
                        onChange={e => setTableName(e.target.value)}
                        placeholder="Nombre de la mesa"
                        className="flex-1 px-2 py-1 border border-orange-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                        autoFocus
                      />
                      <button onClick={() => addTable(room.id)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => { setSelectedRoomId(null); setTableName(""); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSelectedRoomId(room.id); setTableName(""); }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs text-orange-600 border border-dashed border-orange-300 rounded-lg hover:bg-orange-50 transition-all"
                    >
                      <Plus size={12} /> Agregar mesa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Room Form Modal */}
          {showRoomForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h3 className="text-slate-800">{editingRoomId ? "Editar Ubicación" : "Nueva Ubicación"}</h3>
                  <button onClick={() => setShowRoomForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Nombre de la ubicación *</label>
                    <input
                      value={roomForm.name}
                      onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ej: Salón Principal, Terraza, Barra"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Mesas * (separadas por comas)</label>
                    <textarea
                      value={roomForm.tables}
                      onChange={e => setRoomForm(f => ({ ...f, tables: e.target.value }))}
                      placeholder="Mesa 1, Mesa 2, Mesa 3"
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <p className="text-xs text-slate-400 mt-1">Escribe los nombres de las mesas separados por comas</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowRoomForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancelar</button>
                    <button onClick={saveRoom} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                      <Check size={16} /> Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
