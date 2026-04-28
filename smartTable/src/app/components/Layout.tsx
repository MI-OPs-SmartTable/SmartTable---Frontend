import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { useApp, ROLE_LABELS, Expense, formatCOP } from "../context/AppContext";
import {
  ChefHat, LayoutDashboard, ShoppingCart, Package, BarChart3,
  Settings, Truck, DollarSign, LogOut, Menu, X, ChevronDown, AlertTriangle, Plus, Trash2
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "cashier", "waiter", "inventory"] },
  { to: "/sales", label: "Ventas / POS", icon: ShoppingCart, roles: ["admin", "cashier", "waiter"] },
  { to: "/products", label: "Productos", icon: Package, roles: ["admin", "inventory"] },
  { to: "/inventory", label: "Inventario", icon: AlertTriangle, roles: ["admin", "inventory"] },
  { to: "/cash", label: "Caja", icon: DollarSign, roles: ["admin", "cashier"] },
  { to: "/reports", label: "Reportes", icon: BarChart3, roles: ["admin"] },
  { to: "/settings", label: "Configuración", icon: Settings, roles: ["admin"] },
  { to: "/suppliers", label: "Proveedores", icon: Truck, roles: ["admin", "inventory"] },
];

export default function Layout() {
  const { currentUser, logout, supplies, currentSession, closeSession, users } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });

  const lowStockCount = supplies.filter(s => s.quantity <= s.minStock).length;
  const userRole = currentUser?.role || "waiter";
  const filteredNav = navItems.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    if (currentSession) {
      // Initialize expenses with current session expenses
      setExpenses(currentSession.expenses || []);
      setShowCloseCashModal(true);
      setUserMenuOpen(false);
    } else {
      logout();
      navigate("/login");
    }
  };

  const addExpenseToClose = () => {
    if (!newExpense.description || !newExpense.amount) return;
    const expense: Expense = {
      id: `exp_${Date.now()}`,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      date: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, expense]);
    setNewExpense({ description: "", amount: "" });
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const confirmCloseCash = () => {
    if (!pin) {
      setPinError("Debe ingresar su PIN");
      return;
    }

    const user = users.find(u => u.id === currentUser?.id);
    if (user?.pin !== pin) {
      setPinError("PIN incorrecto");
      return;
    }

    if (currentSession) {
      closeSession(currentSession.id, expenses, currentUser?.name || "Usuario");
    }

    // Reset states
    setShowCloseCashModal(false);
    setPin("");
    setPinError("");
    setExpenses([]);
    setNewExpense({ description: "", amount: "" });

    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative z-30 flex flex-col w-64 h-full bg-slate-900 text-white transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm" style={{ fontWeight: 600 }}>Smartable</p>
            <p className="text-slate-400 text-xs">Restaurante</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Session status */}
        <div className={`mx-3 mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${currentSession ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
          <div className={`w-2 h-2 rounded-full ${currentSession ? "bg-green-400" : "bg-red-400"}`} />
          {currentSession ? `Caja abierta · ${currentSession.date}` : "Caja cerrada"}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNav.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.to === "/inventory" && lowStockCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{lowStockCount}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-slate-700 p-3">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-all"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-white text-xs truncate">{currentUser?.name}</p>
              <p className="text-slate-400 text-xs">{ROLE_LABELS[currentUser?.role || "waiter"]}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {userMenuOpen && (
            <button
              onClick={handleLogout}
              className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg text-sm transition-all"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <ChefHat size={18} className="text-orange-500" />
            <span className="text-slate-800 text-sm">Smartable</span>
          </div>
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">
            {currentUser?.name.charAt(0)}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Close Cash & Logout Modal */}
      {showCloseCashModal && currentSession && (() => {
        const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
        const netBalance = currentSession.openingBalance + currentSession.totalSales - totalExpenses;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
                <h3 className="text-slate-800">Cerrar Caja y Sesión</h3>
                <button onClick={() => { setShowCloseCashModal(false); setPin(""); setPinError(""); setExpenses([]); setNewExpense({ description: "", amount: "" }); }} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  ⚠️ Debe cerrar la caja antes de cerrar sesión
                </div>

                {/* Session summary with colors */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base inicial:</span>
                    <span className="text-slate-800">{formatCOP(currentSession.openingBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total en efectivo:</span>
                    <span className="text-green-600">{formatCOP(currentSession.totalCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total transferencias:</span>
                    <span className="text-blue-600">{formatCOP(currentSession.totalTransfer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total ventas:</span>
                    <span className="text-green-600">{formatCOP(currentSession.totalSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gastos:</span>
                    <span className="text-red-600">- {formatCOP(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-800" style={{ fontWeight: 600 }}>Saldo neto:</span>
                    <span className="text-slate-900 text-lg" style={{ fontWeight: 700 }}>{formatCOP(netBalance)}</span>
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <p className="text-sm text-slate-600 mb-2">Gastos del día</p>
                  {expenses.length > 0 ? (
                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                      {expenses.map((exp, idx) => (
                        <div key={exp.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                          <div className="flex-1">
                            <p className="text-sm text-slate-700">{exp.description}</p>
                            <p className="text-xs text-red-500">{formatCOP(exp.amount)}</p>
                          </div>
                          {/* Only allow deletion of newly added expenses (beyond the original session expenses) */}
                          {idx >= (currentSession?.expenses?.length || 0) && (
                            <button onClick={() => removeExpense(exp.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-3 text-center text-xs text-slate-400 mb-3">
                      Sin gastos registrados
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mb-2">Agregar gasto adicional (opcional)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="$0"
                      className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button onClick={addExpenseToClose} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* PIN verification */}
                <div>
                  <p className="text-xs text-slate-500 mb-3">¿Estás seguro de cerrar la caja y salir? Esta acción no se puede deshacer.</p>
                  <label className="text-sm text-slate-600 mb-1 block">Confirme su PIN para cerrar *</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={e => { setPin(e.target.value); setPinError(""); }}
                    placeholder="••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  {pinError && <p className="text-xs text-red-600 mt-1">{pinError}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowCloseCashModal(false); setPin(""); setPinError(""); setExpenses([]); setNewExpense({ description: "", amount: "" }); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">
                    Cancelar
                  </button>
                  <button onClick={confirmCloseCash} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                    <LogOut size={16} /> Cerrar y Salir
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
