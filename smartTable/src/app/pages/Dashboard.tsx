import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useApp, formatCOP } from "../context/AppContext";
import { ShoppingCart, DollarSign, TrendingUp, AlertTriangle, Package, Clock, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function Dashboard() {
  const { sales, supplies, currentSession, products, categories, currentUser } = useApp();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const todaySales = useMemo(() => sales.filter(s => s.date.startsWith(today) && s.status === "completed"), [sales, today]);
  const todayTotal = useMemo(() => todaySales.reduce((acc, s) => acc + s.total, 0), [todaySales]);
  const todayCash = useMemo(() => todaySales.reduce((acc, s) => acc + (s.cashAmount || 0), 0), [todaySales]);
  const todayTransfer = useMemo(() => todaySales.reduce((acc, s) => acc + (s.transferAmount || 0), 0), [todaySales]);

  const lowStock = supplies.filter(s => s.quantity <= s.minStock);

  // Sales by category
  const salesByCategory = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    const productMap = new Map(products.map(p => [p.id, p]));
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    for (const sale of sales.filter(s => s.status === "completed")) {
      for (const item of sale.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const cat = categoryMap.get(product.categoryId);
        const catName = cat?.name || "Sin categoría";
        if (!map[catName]) map[catName] = { name: catName, total: 0, count: 0 };
        map[catName].total += item.price * item.quantity;
        map[catName].count += item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [sales, products, categories]);

  // Last 7 days sales
  const last7Days = useMemo(() => {
    const days: { date: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayTotal = sales
        .filter(s => s.date.startsWith(dateStr) && s.status === "completed")
        .reduce((acc, s) => acc + s.total, 0);
      days.push({ date: dateStr, label: d.toLocaleDateString("es-CO", { weekday: "short" }), total: dayTotal });
    }
    return days;
  }, [sales]);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {};
    for (const sale of sales.filter(s => s.status === "completed")) {
      for (const item of sale.items) {
        if (!map[item.productId]) map[item.productId] = { name: item.productName, qty: 0, total: 0 };
        map[item.productId].qty += item.quantity;
        map[item.productId].total += item.price * item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales]);

  // Recent sales
  const recentSales = sales.filter(s => s.status === "completed").slice(0, 5);

  const canSeeCash = currentUser?.role === "admin" || currentUser?.role === "cashier";
  const canSeeReports = currentUser?.role === "admin";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm">Bienvenido, {currentUser?.name}. Hoy es {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs">Ventas Hoy</span>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-orange-500" />
            </div>
          </div>
          <p className="text-slate-800 text-xl" style={{ fontWeight: 600 }}>{formatCOP(todayTotal)}</p>
          <p className="text-slate-400 text-xs mt-1">{todaySales.length} pedidos</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs">Efectivo</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-500" />
            </div>
          </div>
          <p className="text-slate-800 text-xl" style={{ fontWeight: 600 }}>{formatCOP(todayCash)}</p>
          <p className="text-slate-400 text-xs mt-1">En caja</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs">Transferencia</span>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-blue-500" />
            </div>
          </div>
          <p className="text-slate-800 text-xl" style={{ fontWeight: 600 }}>{formatCOP(todayTransfer)}</p>
          <p className="text-slate-400 text-xs mt-1">Pagos digitales</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs">Stock Bajo</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStock.length > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <AlertTriangle size={16} className={lowStock.length > 0 ? "text-red-500" : "text-green-500"} />
            </div>
          </div>
          <p className="text-slate-800 text-xl" style={{ fontWeight: 600 }}>{lowStock.length}</p>
          <p className="text-slate-400 text-xs mt-1">Insumos por reponer</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-slate-700 mb-4">Ventas Últimos 7 Días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [formatCOP(value), "Ventas"]} labelStyle={{ color: "#475569" }} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-slate-700 mb-4">Por Categoría</h3>
          {salesByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={salesByCategory} dataKey="total" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {salesByCategory.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCOP(value), "Total"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {salesByCategory.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600 truncate flex-1">{cat.name}</span>
                    <span className="text-slate-500">{formatCOP(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Sin ventas registradas</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-700">Productos Más Vendidos</h3>
            <Package size={16} className="text-slate-400" />
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xs" style={{ fontWeight: 600 }}>
                    {i + 1}
                  </div>
                  <span className="text-slate-600 text-sm flex-1">{p.name}</span>
                  <span className="text-slate-400 text-xs">{p.qty} uds</span>
                  <span className="text-slate-700 text-sm">{formatCOP(p.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Sin datos</div>
          )}
        </div>

        {/* Recent sales + alerts */}
        <div className="space-y-4">
          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-red-700 text-sm">Stock Bajo - Requiere Atención</span>
              </div>
              <div className="space-y-1">
                {lowStock.slice(0, 3).map(s => (
                  <div key={s.id} className="flex justify-between text-xs text-red-600">
                    <span>{s.name}</span>
                    <span>{s.quantity} {s.unit} (mín: {s.minStock})</span>
                  </div>
                ))}
                {lowStock.length > 3 && (
                  <button onClick={() => navigate("/inventory")} className="text-xs text-red-500 hover:underline mt-1 flex items-center gap-1">
                    Ver {lowStock.length - 3} más <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent sales */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-700">Últimas Ventas</h3>
              <Clock size={16} className="text-slate-400" />
            </div>
            {recentSales.length > 0 ? (
              <div className="space-y-2">
                {recentSales.map(sale => (
                  <div key={sale.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{sale.table} · {sale.room}</p>
                      <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sale.paymentMethod === "cash" ? "bg-green-100 text-green-700" : sale.paymentMethod === "transfer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {sale.paymentMethod === "cash" ? "Efectivo" : sale.paymentMethod === "transfer" ? "Transferencia" : "Mixto"}
                    </span>
                    <span className="text-slate-800 text-sm">{formatCOP(sale.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Sin ventas hoy</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
