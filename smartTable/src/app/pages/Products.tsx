import { useState } from "react";
import { useApp, formatCOP, Product, Category } from "../context/AppContext";
import { Plus, Search, Edit2, Trash2, X, Check, Package, Tag } from "lucide-react";

const EMOJIS = ["🍔","🌭","🍟","🍕","🍣","🍜","🍛","🍲","🥗","🥙","🥪","🌮","🥤","🍺","☕","🧃","💧","🍰","🍦","🎂","🍽️","🥩","🍗","🥞"];

type FormData = Omit<Product, "id" | "supplies"> & { supplies: Product["supplies"] };

const emptyForm = (): FormData => ({
  name: "", price: 0, categoryId: "", description: "", emoji: "🍔", active: true, supplies: []
});

export default function Products() {
  const { products, setProducts, categories, setCategories, supplies } = useApp();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState<Omit<Category, "id">>({ name: "", color: "#f97316", icon: "🍔" });
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  const filteredProducts = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && p.categoryId !== filterCategory) return false;
    return true;
  });

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, price: p.price, categoryId: p.categoryId, description: p.description, emoji: p.emoji, active: p.active, supplies: p.supplies });
    setEditingId(p.id);
    setShowForm(true);
  };

  const saveProduct = () => {
    if (!form.name || !form.categoryId) return;
    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p));
    } else {
      setProducts(prev => [...prev, { id: `p_${Date.now()}`, ...form }]);
    }
    setShowForm(false);
  };

  const toggleActive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const deleteProduct = (id: string) => {
    if (confirm("¿Eliminar este producto?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const saveCategory = () => {
    if (!catForm.name) return;
    setCategories(prev => [...prev, { id: `c_${Date.now()}`, ...catForm }]);
    setShowCatForm(false);
    setCatForm({ name: "", color: "#f97316", icon: "🍔" });
  };

  const deleteCategory = (id: string) => {
    if (products.some(p => p.categoryId === id)) {
      alert("No puedes eliminar una categoría con productos asignados");
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateSupply = (supplyId: string, quantity: number) => {
    const existing = form.supplies.find(s => s.supplyId === supplyId);
    if (quantity <= 0) {
      setForm(f => ({ ...f, supplies: f.supplies.filter(s => s.supplyId !== supplyId) }));
    } else if (existing) {
      setForm(f => ({ ...f, supplies: f.supplies.map(s => s.supplyId === supplyId ? { ...s, quantity } : s) }));
    } else {
      setForm(f => ({ ...f, supplies: [...f.supplies, { supplyId, quantity }] }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">Productos</h1>
          <p className="text-slate-500 text-sm">{products.length} productos · {categories.length} categorías</p>
        </div>
        <button onClick={activeTab === "products" ? openCreate : () => setShowCatForm(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
          <Plus size={16} />
          {activeTab === "products" ? "Nuevo Producto" : "Nueva Categoría"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        {["products", "categories"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {tab === "products" ? `Productos (${products.length})` : `Categorías (${categories.length})`}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Products table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs text-slate-500">Producto</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-500">Categoría</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500">Precio</th>
                    <th className="text-center px-4 py-3 text-xs text-slate-500">Estado</th>
                    <th className="text-center px-4 py-3 text-xs text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => {
                    const cat = categories.find(c => c.id === p.categoryId);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${!p.active ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{p.emoji}</span>
                            <div>
                              <p className="text-sm text-slate-800" style={{ fontWeight: 500 }}>{p.name}</p>
                              <p className="text-xs text-slate-400">{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {cat && (
                            <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: cat.color }}>
                              {cat.icon} {cat.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-slate-800" style={{ fontWeight: 500 }}>{formatCOP(p.price)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleActive(p.id)} className={`text-xs px-2 py-1 rounded-full transition-all ${p.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                            {p.active ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No se encontraron productos</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "categories" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const prodCount = products.filter(p => p.categoryId === cat.id).length;
            return (
              <div key={cat.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: cat.color + "20" }}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 text-sm" style={{ fontWeight: 500 }}>{cat.name}</p>
                  <p className="text-slate-400 text-xs">{prodCount} productos</p>
                </div>
                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-slate-800">{editingId ? "Editar Producto" : "Nuevo Producto"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Ícono</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      className={`w-9 h-9 text-xl rounded-lg border-2 transition-all ${form.emoji === e ? "border-orange-400 bg-orange-50" : "border-transparent bg-slate-50 hover:bg-orange-50"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nombre del producto" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Precio *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Categoría *</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" placeholder="Descripción corta" />
              </div>
              {/* Supplies / Ingredients */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block flex items-center gap-2"><Tag size={14} /> Insumos (ingredientes)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {supplies.map(s => {
                    const req = form.supplies.find(sr => sr.supplyId === s.id);
                    return (
                      <div key={s.id} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 flex-1">{s.name} ({s.unit})</span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={req?.quantity || ""}
                          onChange={e => updateSupply(s.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 text-center"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                <label htmlFor="active" className="text-sm text-slate-600">Producto activo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Cancelar</button>
                <button onClick={saveProduct} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                  <Check size={16} /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category form modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-slate-800">Nueva Categoría</h3>
              <button onClick={() => setShowCatForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nombre *</label>
                <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nombre de la categoría" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Ícono</label>
                  <input value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="🍔" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Color</label>
                  <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} className="w-full h-10 border border-slate-200 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCatForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancelar</button>
                <button onClick={saveCategory} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                  <Check size={16} /> Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
