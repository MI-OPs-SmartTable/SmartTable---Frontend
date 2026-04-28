import { useState, useMemo } from "react";
import { useApp, formatCOP } from "../context/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { BarChart3, TrendingUp, Package, Calendar, Download } from "lucide-react";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16"];

export default function Reports() {
  const { sales, products, categories } = useApp();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<"daily" | "products" | "categories">("daily");

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (s.status !== "completed") return false;
      const date = s.date.split("T")[0];
      return date >= dateFrom && date <= dateTo;
    });
  }, [sales, dateFrom, dateTo]);

  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + s.total, 0), [filteredSales]);
  const totalCash = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.cashAmount || 0), 0), [filteredSales]);
  const totalTransfer = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.transferAmount || 0), 0), [filteredSales]);
  const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  // Daily sales chart
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; label: string; total: number; cash: number; transfer: number; count: number }> = {};
    for (const sale of filteredSales) {
      const date = sale.date.split("T")[0];
      if (!map[date]) {
        const d = new Date(date + "T12:00:00");
        map[date] = { date, label: d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }), total: 0, cash: 0, transfer: 0, count: 0 };
      }
      map[date].total += sale.total;
      map[date].cash += sale.cashAmount || 0;
      map[date].transfer += sale.transferAmount || 0;
      map[date].count += 1;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number; emoji: string }> = {};
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        if (!map[item.productId]) {
          const p = products.find(p => p.id === item.productId);
          map[item.productId] = { name: item.productName, qty: 0, total: 0, emoji: p?.emoji || "🍽️" };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].total += item.price * item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredSales, products]);

  // By category
  const categoryData = useMemo(() => {
    const productMap = new Map(products.map(p => [p.id, p]));
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const map: Record<string, { name: string; total: number; qty: number; color: string }> = {};
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const cat = categoryMap.get(product.categoryId);
        const key = product.categoryId;
        if (!map[key]) map[key] = { name: cat?.name || "Sin categoría", total: 0, qty: 0, color: cat?.color || "#94a3b8" };
        map[key].total += item.price * item.quantity;
        map[key].qty += item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredSales, products, categories]);

  const tabs = [
    { key: "daily", label: "Ventas por Día", icon: Calendar },
    { key: "products", label: "Por Producto", icon: Package },
    { key: "categories", label: "Por Categoría", icon: BarChart3 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">Reportes</h1>
          <p className="text-slate-500 text-sm">Análisis de ventas y rendimiento</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm text-slate-600">Período:</span>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <span className="text-slate-400 text-sm">hasta</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div className="flex gap-2 ml-auto">
          {[7, 15, 30].map(days => (
            <button key={days} onClick={() => {
              const to = new Date(); const from = new Date();
              from.setDate(from.getDate() - days);
              setDateFrom(from.toISOString().split("T")[0]);
              setDateTo(to.toISOString().split("T")[0]);
            }} className="px-2.5 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-600 text-slate-600 rounded-lg text-xs transition-all">
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-orange-500" />
            <span className="text-xs text-slate-500">Total Ingresos</span>
          </div>
          <p className="text-slate-800 text-xl" style={{ fontWeight: 700 }}>{formatCOP(totalRevenue)}</p>
          <p className="text-xs text-slate-400">{filteredSales.length} ventas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-500">Ticket Promedio</span>
          </div>
          <p className="text-slate-800 text-xl" style={{ fontWeight: 700 }}>{formatCOP(avgTicket)}</p>
          <p className="text-xs text-slate-400">por pedido</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-green-600">Efectivo</span>
          </div>
          <p className="text-green-700 text-xl" style={{ fontWeight: 700 }}>{formatCOP(totalCash)}</p>
          <p className="text-xs text-green-400">{totalRevenue > 0 ? Math.round(totalCash / totalRevenue * 100) : 0}% del total</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-blue-600">Transferencias</span>
          </div>
          <p className="text-blue-700 text-xl" style={{ fontWeight: 700 }}>{formatCOP(totalTransfer)}</p>
          <p className="text-xs text-blue-400">{totalRevenue > 0 ? Math.round(totalTransfer / totalRevenue * 100) : 0}% del total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily sales */}
      {activeTab === "daily" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-slate-700 mb-4">Ventas Diarias</h3>
            {dailyData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos para el período seleccionado</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number, name: string) => [formatCOP(value), name === "cash" ? "Efectivo" : name === "transfer" ? "Transferencia" : "Total"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                  <Legend formatter={v => v === "cash" ? "Efectivo" : v === "transfer" ? "Transferencia" : "Total"} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="cash" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" name="cash" />
                  <Bar dataKey="transfer" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" name="transfer" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Daily table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-slate-700 text-sm">Detalle por Día</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs text-slate-500">Fecha</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500">Pedidos</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500">Efectivo</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500">Transferencia</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dailyData.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">Sin datos</td></tr>
                  ) : dailyData.map(d => (
                    <tr key={d.date} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{new Date(d.date + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long" })}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">{d.count}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-600">{formatCOP(d.cash)}</td>
                      <td className="px-4 py-3 text-right text-sm text-blue-600">{formatCOP(d.transfer)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-800" style={{ fontWeight: 600 }}>{formatCOP(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {dailyData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td className="px-4 py-3 text-sm text-slate-600" style={{ fontWeight: 600 }}>Total</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600" style={{ fontWeight: 600 }}>{filteredSales.length}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-700" style={{ fontWeight: 600 }}>{formatCOP(totalCash)}</td>
                      <td className="px-4 py-3 text-right text-sm text-blue-700" style={{ fontWeight: 600 }}>{formatCOP(totalTransfer)}</td>
                      <td className="px-4 py-3 text-right text-slate-900 text-sm" style={{ fontWeight: 700 }}>{formatCOP(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top products */}
      {activeTab === "products" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-slate-700 mb-4">Unidades Vendidas</h3>
            {topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v: number) => [v, "Unidades"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="qty" fill="#f97316" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-slate-700 text-sm">Ranking de Productos</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos</div>
              ) : topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-600/70 text-white" : "bg-slate-100 text-slate-500"}`} style={{ fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-sm text-slate-700 flex-1">{p.name}</span>
                  <span className="text-xs text-slate-400">{p.qty} uds</span>
                  <span className="text-sm text-slate-800" style={{ fontWeight: 500 }}>{formatCOP(p.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By category */}
      {activeTab === "categories" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-slate-700 mb-4">Ingresos por Categoría</h3>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="total" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                      {categoryData.map((cat, i) => (
                        <Cell key={cat.name} fill={cat.color || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCOP(value), "Ingresos"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-600 flex-1">{cat.name}</span>
                      <span className="text-xs text-slate-400">{cat.qty} uds</span>
                      <span className="text-sm text-slate-700" style={{ fontWeight: 500 }}>{formatCOP(cat.total)}</span>
                      <span className="text-xs text-slate-400">({totalRevenue > 0 ? Math.round(cat.total / totalRevenue * 100) : 0}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-slate-700 mb-4">Total por Categoría</h3>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCOP(value), "Ingresos"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {categoryData.map((cat, i) => (
                      <Cell key={cat.name} fill={cat.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
