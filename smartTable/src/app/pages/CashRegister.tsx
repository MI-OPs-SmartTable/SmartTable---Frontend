import { useState, useMemo } from "react";
import { useApp, formatCOP, Expense, CashSession } from "../context/AppContext";
import { DollarSign, Plus, X, Check, Lock, Unlock, TrendingUp, TrendingDown, CreditCard, Banknote, Eye, ChevronDown } from "lucide-react";

export default function CashRegister() {
  const { currentSession, sessions, openSession, closeSession, addExpense, currentUser, sales } = useApp();
  const [openingBalance, setOpeningBalance] = useState("");
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [viewingSession, setViewingSession] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  const handleOpenCash = () => {
    const bal = parseFloat(openingBalance);
    if (isNaN(bal) || bal < 0) return;
    openSession(bal);
    setOpeningBalance("");
    setShowOpen(false);
  };

  const handleCloseCash = () => {
    if (!currentSession) return;
    closeSession(currentSession.id, currentSession.expenses, currentUser?.name || "");
    setShowClose(false);
  };

  const handleAddExpense = () => {
    if (!currentSession || !newExpense.description || !newExpense.amount) return;
    const expense: Expense = {
      id: `exp_${Date.now()}`,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount) || 0,
      date: new Date().toISOString(),
    };
    addExpense(currentSession.id, expense);
    setNewExpense({ description: "", amount: "" });
    setShowExpenseForm(false);
  };

  const sessionSales = useMemo(() => {
    if (!currentSession) return [];
    return sales.filter(s => s.sessionId === currentSession.id && s.status === "completed");
  }, [currentSession, sales]);

  const totalExpenses = useMemo(() => {
    if (!currentSession) return 0;
    return currentSession.expenses.reduce((acc, e) => acc + e.amount, 0);
  }, [currentSession]);

  const netBalance = currentSession
    ? currentSession.openingBalance + currentSession.totalSales - totalExpenses
    : 0;

  const filteredSessions = useMemo(() => {
    let result = sessions.filter(s => s.status === "closed");
    if (dateFilter) result = result.filter(s => s.date === dateFilter);
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, dateFilter]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">Caja</h1>
          <p className="text-slate-500 text-sm">Control de apertura, ventas y cierre de caja</p>
        </div>
        {!currentSession ? (
          <button onClick={() => setShowOpen(true)} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
            <Unlock size={16} /> Abrir Caja
          </button>
        ) : (
          <button onClick={() => setShowClose(true)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
            <Lock size={16} /> Cerrar Caja
          </button>
        )}
      </div>

      {/* Current session */}
      {currentSession ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-600 text-sm">Caja Abierta desde {currentSession.date}</span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-slate-400" />
                <span className="text-xs text-slate-500">Base inicial</span>
              </div>
              <p className="text-slate-800 text-xl" style={{ fontWeight: 600 }}>{formatCOP(currentSession.openingBalance)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-xs text-green-600">Total vendido</span>
              </div>
              <p className="text-green-700 text-xl" style={{ fontWeight: 600 }}>{formatCOP(currentSession.totalSales)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} className="text-red-500" />
                <span className="text-xs text-red-600">Gastos</span>
              </div>
              <p className="text-red-700 text-xl" style={{ fontWeight: 600 }}>{formatCOP(totalExpenses)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-blue-500" />
                <span className="text-xs text-blue-600">Saldo neto</span>
              </div>
              <p className="text-blue-700 text-xl" style={{ fontWeight: 600 }}>{formatCOP(netBalance)}</p>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={16} className="text-green-500" />
                <span className="text-sm text-slate-700">Efectivo recibido</span>
              </div>
              <p className="text-2xl text-slate-800" style={{ fontWeight: 600 }}>{formatCOP(currentSession.totalCash)}</p>
              <p className="text-xs text-slate-400 mt-1">{sessionSales.filter(s => s.paymentMethod === "cash" || s.cashAmount).length} transacciones</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-blue-500" />
                <span className="text-sm text-slate-700">Transferencias</span>
              </div>
              <p className="text-2xl text-slate-800" style={{ fontWeight: 600 }}>{formatCOP(currentSession.totalTransfer)}</p>
              <p className="text-xs text-slate-400 mt-1">{sessionSales.filter(s => s.paymentMethod === "transfer" || s.transferAmount).length} transacciones</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Sales list */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-slate-700 text-sm">Ventas de esta sesión ({sessionSales.length})</h3>
                <Eye size={14} className="text-slate-400" />
              </div>
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {sessionSales.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Sin ventas</div>
                ) : sessionSales.map(sale => (
                  <div key={sale.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-slate-700">{sale.table} · {sale.room}</p>
                      <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sale.paymentMethod === "cash" ? "bg-green-100 text-green-700" : sale.paymentMethod === "transfer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {sale.paymentMethod === "cash" ? "Efectivo" : sale.paymentMethod === "transfer" ? "Transferencia" : "Mixto"}
                    </span>
                    <span className="text-sm text-slate-800" style={{ fontWeight: 500 }}>{formatCOP(sale.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-slate-700 text-sm">Gastos / Caja menor</h3>
                <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600">
                  <Plus size={14} /> Agregar
                </button>
              </div>
              {showExpenseForm && (
                <div className="px-4 py-3 border-b border-slate-50 bg-orange-50">
                  <div className="flex gap-2 mb-2">
                    <input value={newExpense.description} onChange={e => setNewExpense(n => ({ ...n, description: e.target.value }))} placeholder="Descripción del gasto" className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    <input type="number" value={newExpense.amount} onChange={e => setNewExpense(n => ({ ...n, amount: e.target.value }))} placeholder="Monto" className="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddExpense} className="flex-1 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600">Guardar</button>
                    <button onClick={() => setShowExpenseForm(false)} className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs">Cancelar</button>
                  </div>
                </div>
              )}
              <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                {currentSession.expenses.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Sin gastos registrados</div>
                ) : currentSession.expenses.map(exp => (
                  <div key={exp.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-700">{exp.description}</p>
                      <p className="text-xs text-slate-400">{new Date(exp.date).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className="text-sm text-red-600" style={{ fontWeight: 500 }}>- {formatCOP(exp.amount)}</span>
                  </div>
                ))}
              </div>
              {currentSession.expenses.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 flex justify-between">
                  <span className="text-xs text-slate-500">Total gastos</span>
                  <span className="text-sm text-red-600" style={{ fontWeight: 600 }}>- {formatCOP(totalExpenses)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mb-6">
          <Lock size={32} className="text-amber-500 mx-auto mb-3" />
          <h3 className="text-amber-800 mb-2">Caja Cerrada</h3>
          <p className="text-amber-600 text-sm mb-4">No hay una sesión de caja activa. Abre la caja para registrar ventas.</p>
          <button onClick={() => setShowOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm transition-all">
            Abrir Caja Ahora
          </button>
        </div>
      )}

      {/* Session history */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-slate-700">Historial de Cierres de Caja</h3>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div className="divide-y divide-slate-50">
          {filteredSessions.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-slate-400 text-sm">No hay cierres de caja</div>
          ) : filteredSessions.map(session => (
            <div key={session.id} className="px-5 py-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setViewingSession(viewingSession === session.id ? null : session.id)}>
                <div>
                  <p className="text-sm text-slate-700" style={{ fontWeight: 500 }}>{new Date(session.date).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="text-xs text-slate-400">Cerrado por {session.closedBy} · {session.closingTime ? new Date(session.closingTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>{formatCOP(session.totalSales)}</p>
                    <p className="text-xs text-slate-400">Total vendido</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${viewingSession === session.id ? "rotate-180" : ""}`} />
                </div>
              </div>
              {viewingSession === session.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Resumen</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Base inicial:</span><span>{formatCOP(session.openingBalance)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Total ventas:</span><span className="text-green-600">{formatCOP(session.totalSales)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Gastos:</span><span className="text-red-600">- {formatCOP(session.expenses.reduce((a, e) => a + e.amount, 0))}</span></div>
                      <div className="flex justify-between border-t pt-1"><span className="text-slate-700" style={{ fontWeight: 500 }}>Neto:</span><span style={{ fontWeight: 600 }}>{formatCOP(session.openingBalance + session.totalSales - session.expenses.reduce((a, e) => a + e.amount, 0))}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Por método de pago</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500 flex items-center gap-1"><Banknote size={10} /> Efectivo:</span><span className="text-green-600">{formatCOP(session.totalCash)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 flex items-center gap-1"><CreditCard size={10} /> Transferencia:</span><span className="text-blue-600">{formatCOP(session.totalTransfer)}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Gastos ({session.expenses.length})</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {session.expenses.length === 0 ? <p className="text-xs text-slate-400">Sin gastos</p> :
                        session.expenses.map(e => (
                          <div key={e.id} className="flex justify-between text-xs">
                            <span className="text-slate-500 truncate">{e.description}</span>
                            <span className="text-red-500 ml-2 flex-shrink-0">{formatCOP(e.amount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Open cash modal */}
      {showOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-slate-800">Apertura de Caja</h3>
              <button onClick={() => setShowOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Ingresa el dinero base con el que inicias el día (efectivo en caja).</p>
              <div className="mb-5">
                <label className="text-sm text-slate-600 mb-1 block">Dinero base (COP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    placeholder="100.000"
                    className="w-full pl-7 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    onKeyDown={e => e.key === "Enter" && handleOpenCash()}
                  />
                </div>
                {openingBalance && <p className="text-xs text-slate-400 mt-1">{formatCOP(parseFloat(openingBalance) || 0)}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancelar</button>
                <button onClick={handleOpenCash} disabled={!openingBalance} className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                  <Unlock size={16} /> Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close cash modal */}
      {showClose && currentSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-slate-800">Cierre de Caja</h3>
              <button onClick={() => setShowClose(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-5">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Base inicial:</span><span>{formatCOP(currentSession.openingBalance)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total en efectivo:</span><span className="text-green-600">{formatCOP(currentSession.totalCash)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total transferencias:</span><span className="text-blue-600">{formatCOP(currentSession.totalTransfer)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total ventas:</span><span className="text-green-600">{formatCOP(currentSession.totalSales)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Gastos:</span><span className="text-red-600">- {formatCOP(totalExpenses)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-800" style={{ fontWeight: 600 }}>Saldo neto:</span><span className="text-slate-900 text-lg" style={{ fontWeight: 700 }}>{formatCOP(netBalance)}</span></div>
              </div>
              <p className="text-xs text-slate-500 mb-5">¿Estás seguro de cerrar la caja? Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClose(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancelar</button>
                <button onClick={handleCloseCash} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                  <Lock size={16} /> Cerrar Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
