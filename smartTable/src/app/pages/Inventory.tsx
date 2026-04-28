import { useState } from "react";
import { useApp, formatCOP, Supply } from "../context/AppContext";
import { Plus, Search, Edit2, Trash2, X, Check, AlertTriangle, Package, TrendingDown, History } from "lucide-react";

type FormData = Omit<Supply, "id">;

const emptyForm = (): FormData => ({
  name: "", unit: "unidad", quantity: 0, minStock: 0, cost: 0, supplierId: ""
});

export default function Inventory() {
  const { supplies, setSupplies, suppliers } = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "ok">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "set">("add");
  const [adjustCost, setAdjustCost] = useState("");
  const [adjustSupplierId, setAdjustSupplierId] = useState("");
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const filtered = supplies.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "low" && s.quantity > s.minStock) return false;
    if (filter === "ok" && s.quantity <= s.minStock) return false;
    return true;
  });

  const lowStockItems = supplies.filter(s => s.quantity <= s.minStock);
  const totalValue = supplies.reduce((acc, s) => acc + s.quantity * s.cost, 0);

  const openCreate = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };
  const openEdit = (s: Supply) => {
    setForm({ name: s.name, unit: s.unit, quantity: s.quantity, minStock: s.minStock, cost: s.cost, supplierId: s.supplierId });
    setEditingId(s.id);
    setShowForm(true);
  };

  const save = () => {
    if (!form.name) return;
    if (editingId) {
      setSupplies(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
    } else {
      setSupplies(prev => [...prev, { id: `sup_${Date.now()}`, ...form }]);
    }
    setShowForm(false);
  };

  const deleteSupply = (id: string) => {
    if (confirm("¿Eliminar este insumo?")) setSupplies(prev => prev.filter(s => s.id !== id));
  };

  const handleAdjust = (id: string) => {
    const qty = parseFloat(adjustQty);
    if (isNaN(qty)) return;

    const cost = parseFloat(adjustCost);
    const supplierId = adjustSupplierId;

    setSupplies(prev => prev.map(s => {
      if (s.id !== id) return s;

      const newQuantity = adjustType === "add" ? s.quantity + qty : qty;
      const updatedSupply = { ...s, quantity: newQuantity };

      // Si es una compra (add) y se proporcionó proveedor y costo, agregar al historial
      if (adjustType === "add" && supplierId && !isNaN(cost)) {
        const supplier = suppliers.find(sup => sup.id === supplierId);
        const purchase = {
          id: `purch_${Date.now()}`,
          date: new Date().toISOString(),
          supplierId,
          supplierName: supplier?.name || "Proveedor desconocido",
          quantity: qty,
          unitCost: cost,
          totalCost: qty * cost,
        };
        updatedSupply.purchaseHistory = [...(s.purchaseHistory || []), purchase];
        updatedSupply.cost = cost; // Actualizar el costo unitario
        updatedSupply.supplierId = supplierId; // Actualizar el proveedor actual
      }

      return updatedSupply;
    }));

    setShowAdjust(null);
    setAdjustQty("");
    setAdjustCost("");
    setAdjustSupplierId("");
  };

  const getStockStatus = (s: Supply) => {
    const ratio = s.quantity / s.minStock;
    if (s.quantity === 0) return { color: "bg-red-500", text: "Sin stock", textColor: "text-red-700", bg: "bg-red-50 border-red-200" };
    if (ratio <= 1) return { color: "bg-red-400", text: "Crítico", textColor: "text-red-600", bg: "bg-red-50 border-red-100" };
    if (ratio <= 1.5) return { color: "bg-amber-400", text: "Bajo", textColor: "text-amber-600", bg: "bg-amber-50 border-amber-100" };
    return { color: "bg-green-400", text: "OK", textColor: "text-green-600", bg: "bg-white border-slate-100" };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">Inventario</h1>
          <p className="text-slate-500 text-sm">{supplies.length} insumos · Valor total: {formatCOP(totalValue)}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
          <Plus size={16} /> Nuevo Insumo
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500">Total Insumos</span>
          </div>
          <p className="text-2xl text-slate-800" style={{ fontWeight: 600 }}>{supplies.length}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-xs text-red-600">Stock Bajo</span>
          </div>
          <p className="text-2xl text-red-600" style={{ fontWeight: 600 }}>{lowStockItems.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500">Valor Inventario</span>
          </div>
          <p className="text-slate-800 text-lg" style={{ fontWeight: 600 }}>{formatCOP(totalValue)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Check size={16} className="text-green-500" />
            <span className="text-xs text-green-600">Stock OK</span>
          </div>
          <p className="text-2xl text-green-600" style={{ fontWeight: 600 }}>{supplies.length - lowStockItems.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar insumo..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div className="flex gap-2">
          {[["all", "Todos"], ["low", "Stock Bajo"], ["ok", "Stock OK"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val as typeof filter)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${filter === val ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(s => {
          const status = getStockStatus(s);
          const supplier = suppliers.find(sup => sup.id === s.supplierId);
          const pct = Math.min(100, (s.quantity / (s.minStock * 2)) * 100);
          return (
            <div key={s.id} className={`bg-white rounded-xl p-4 border ${s.quantity <= s.minStock ? "border-red-200 bg-red-50" : "border-slate-100"} shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-800 text-sm" style={{ fontWeight: 500 }}>{s.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${status.textColor} ${s.quantity <= s.minStock ? "bg-red-100" : "bg-green-100"}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{supplier?.name || "Sin proveedor"}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setShowAdjust(s.id); setAdjustQty(""); setAdjustType("add"); setAdjustCost(s.cost.toString()); setAdjustSupplierId(s.supplierId); }} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 size={14} />
                  </button>
                  {s.purchaseHistory && s.purchaseHistory.length > 0 && (
                    <button onClick={() => setShowHistory(showHistory === s.id ? null : s.id)} className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all">
                      <History size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteSupply(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Stock bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{s.quantity} {s.unit}</span>
                  <span>Mín: {s.minStock}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${status.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>Costo unitario: {formatCOP(s.cost)}</span>
                <span>Total: {formatCOP(s.quantity * s.cost)}</span>
              </div>

              {/* Purchase history */}
              {showHistory === s.id && s.purchaseHistory && s.purchaseHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                    <History size={12} /> Historial de compras
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {s.purchaseHistory.slice().reverse().map(purchase => (
                      <div key={purchase.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-slate-700" style={{ fontWeight: 500 }}>{purchase.supplierName}</span>
                          <span className="text-slate-500">{new Date(purchase.date).toLocaleDateString('es-CO')}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>{purchase.quantity} {s.unit} × {formatCOP(purchase.unitCost)}</span>
                          <span className="text-slate-700" style={{ fontWeight: 500 }}>{formatCOP(purchase.totalCost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adjust form */}
              {showAdjust === s.id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setAdjustType("add")} className={`flex-1 py-1 text-xs rounded-lg border transition-all ${adjustType === "add" ? "bg-orange-500 text-white border-orange-500" : "border-slate-200 text-slate-500"}`}>+ Agregar</button>
                    <button onClick={() => setAdjustType("set")} className={`flex-1 py-1 text-xs rounded-lg border transition-all ${adjustType === "set" ? "bg-blue-500 text-white border-blue-500" : "border-slate-200 text-slate-500"}`}>= Fijar</button>
                  </div>
                  <div className="space-y-2">
                    <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder={adjustType === "add" ? "Cantidad a agregar" : "Nueva cantidad"} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    {adjustType === "add" && (
                      <>
                        <select value={adjustSupplierId} onChange={e => setAdjustSupplierId(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400">
                          <option value="">Seleccionar proveedor (opcional)</option>
                          {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                        </select>
                        <input type="number" value={adjustCost} onChange={e => setAdjustCost(e.target.value)} placeholder="Costo unitario (opcional)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleAdjust(s.id)} className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600">Guardar</button>
                    <button onClick={() => { setShowAdjust(null); setAdjustQty(""); setAdjustCost(""); setAdjustSupplierId(""); }} className="flex-1 px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs hover:bg-slate-50">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No se encontraron insumos</div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-slate-800">{editingId ? "Editar Insumo" : "Nuevo Insumo"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nombre del insumo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Unidad</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {["unidad","kg","gramos","litro","ml","porción","caja","bolsa"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Cantidad inicial</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Stock mínimo</label>
                  <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Costo unitario</label>
                  <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Proveedor</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancelar</button>
                <button onClick={save} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                  <Check size={16} /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
