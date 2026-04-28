import { useState } from "react";
import { useApp, Supplier } from "../context/AppContext";
import { Plus, Edit2, Trash2, X, Check, Phone, Mail, MapPin, Truck, Package } from "lucide-react";

type FormData = Omit<Supplier, "id">;

const emptyForm = (): FormData => ({
  name: "", contact: "", phone: "", email: "", address: "", products: ""
});

export default function Suppliers() {
  const { suppliers, setSuppliers, supplies } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [search, setSearch] = useState("");

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.products.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, address: s.address, products: s.products });
    setEditingId(s.id);
    setShowForm(true);
  };

  const save = () => {
    if (!form.name) return;
    if (editingId) {
      setSuppliers(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
    } else {
      setSuppliers(prev => [...prev, { id: `s_${Date.now()}`, ...form }]);
    }
    setShowForm(false);
  };

  const deleteSupplier = (id: string) => {
    const linkedSupplies = supplies.filter(s => s.supplierId === id);
    if (linkedSupplies.length > 0) {
      alert(`No puedes eliminar este proveedor. Tiene ${linkedSupplies.length} insumo(s) asociado(s).`);
      return;
    }
    if (confirm("¿Eliminar este proveedor?")) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  const getSupplierSupplies = (supplierId: string) => {
    return supplies.filter(s => s.supplierId === supplierId);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">Proveedores</h1>
          <p className="text-slate-500 text-sm">{suppliers.length} proveedores registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
          <Plus size={16} /> Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proveedor o producto..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Suppliers grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(supplier => {
          const supplierSupplies = getSupplierSupplies(supplier.id);
          return (
            <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>{supplier.name}</h3>
                      <p className="text-slate-500 text-xs">{supplier.contact}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(supplier)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteSupplier(supplier.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-2">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone size={12} className="text-slate-400 flex-shrink-0" />
                    <a href={`tel:${supplier.phone}`} className="hover:text-orange-500 transition-colors">{supplier.phone}</a>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${supplier.email}`} className="hover:text-orange-500 transition-colors">{supplier.email}</a>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{supplier.address}</span>
                  </div>
                )}
                {supplier.products && (
                  <div className="mt-2 pt-2 border-t border-slate-50">
                    <p className="text-xs text-slate-400 mb-1">Productos que provee:</p>
                    <p className="text-xs text-slate-600">{supplier.products}</p>
                  </div>
                )}

                {/* Linked supplies */}
                {supplierSupplies.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package size={12} className="text-slate-400" />
                      <p className="text-xs text-slate-400">{supplierSupplies.length} insumo(s) en inventario</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {supplierSupplies.slice(0, 4).map(s => (
                        <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full ${s.quantity <= s.minStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {s.name}
                        </span>
                      ))}
                      {supplierSupplies.length > 4 && (
                        <span className="text-xs text-slate-400 px-2 py-0.5">+{supplierSupplies.length - 4} más</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <Truck size={40} className="mb-3 opacity-40" />
          <p className="text-sm">No se encontraron proveedores</p>
          <button onClick={openCreate} className="mt-3 text-orange-500 text-sm hover:underline">Agregar el primero</button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-slate-800">{editingId ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nombre de la empresa *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nombre del proveedor" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Persona de contacto</label>
                <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nombre del contacto" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Teléfono</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="3201234567" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="contacto@proveedor.com" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Dirección</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Dirección del proveedor" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Productos / Insumos que provee</label>
                <textarea value={form.products} onChange={e => setForm(f => ({ ...f, products: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" placeholder="Ej: Carnes, embutidos, lácteos..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancelar</button>
                <button onClick={save} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                  <Check size={16} /> {editingId ? "Actualizar" : "Crear Proveedor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
