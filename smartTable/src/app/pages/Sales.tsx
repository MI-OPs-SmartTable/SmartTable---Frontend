import { useState, useMemo, useEffect } from "react";
import { useApp, formatCOP, OrderItem, Sale } from "../context/AppContext";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, X, ChevronDown, CreditCard, Banknote, Blend } from "lucide-react";

export default function Sales() {
  const { products, categories, currentUser, currentSession, addSale, rooms } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");

  // Initialize room and table when rooms are loaded
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoomId) {
      const firstRoom = rooms[0];
      setSelectedRoomId(firstRoom.id);
      if (firstRoom.tables && firstRoom.tables.length > 0) {
        setSelectedTableId(firstRoom.tables[0].id);
      }
    }
  }, [rooms, selectedRoomId]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "mixed">("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.active) return false;
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategory, search]);

  const orderTotal = useMemo(() => orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [orderItems]);
  const itemCount = useMemo(() => orderItems.reduce((sum, i) => sum + i.quantity, 0), [orderItems]);

  const addItem = (product: typeof products[0]) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setOrderItems(prev => {
      const updated = prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i);
      return updated.filter(i => i.quantity > 0);
    });
  };

  const clearOrder = () => { setOrderItems([]); setShowCheckout(false); };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = rooms?.find(r => r.id === roomId);
    if (room && room.tables && room.tables.length > 0) {
      setSelectedTableId(room.tables[0].id);
    }
  };

  const currentRoom = rooms?.find(r => r.id === selectedRoomId);
  const currentTable = currentRoom?.tables?.find(t => t.id === selectedTableId);

  // If no rooms configured, show warning
  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <p className="text-slate-600 mb-4">No hay ubicaciones configuradas</p>
          <p className="text-sm text-slate-400">Ve a Configuración → Restaurante para configurar mesas</p>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    const cashAmt = paymentMethod === "cash" ? orderTotal : paymentMethod === "mixed" ? parseFloat(cashAmount) || 0 : 0;
    const transferAmt = paymentMethod === "transfer" ? orderTotal : paymentMethod === "mixed" ? parseFloat(transferAmount) || 0 : 0;

    if (paymentMethod === "mixed") {
      const totalPaid = cashAmt + transferAmt;
      if (totalPaid < orderTotal) {
        alert("El monto total no cubre el valor del pedido");
        return;
      }
      if (totalPaid > orderTotal) {
        alert("La suma de efectivo y transferencia no puede ser mayor al total del pedido");
        return;
      }
    }

    const sale: Sale = {
      id: `sale_${Date.now()}`,
      date: new Date().toISOString(),
      items: orderItems,
      subtotal: orderTotal,
      total: orderTotal,
      paymentMethod,
      cashAmount: cashAmt || undefined,
      transferAmount: transferAmt || undefined,
      table: currentTable?.name || "Mesa",
      room: currentRoom?.name || "Ubicación",
      status: "completed",
      cashierId: currentUser?.id || "",
      cashierName: currentUser?.name || "",
      sessionId: currentSession?.id || "",
    };

    addSale(sale);
    setLastSale(sale);
    setOrderItems([]);
    setShowCheckout(false);
    setShowSuccess(true);
    setCashAmount("");
    setTransferAmount("");
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const canCheckout = currentSession && orderItems.length > 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            {/* Room & Table selectors */}
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={selectedRoomId}
                  onChange={e => handleRoomChange(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none"
                >
                  {rooms && rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none"
                >
                  {currentRoom && currentRoom.tables && currentRoom.tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${selectedCategory === "all" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${selectedCategory === cat.id ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Search size={40} className="mb-3 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => {
                const inOrder = orderItems.find(i => i.productId === product.id);
                const cat = categories.find(c => c.id === product.categoryId);
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className={`relative bg-white rounded-xl p-3 text-left border-2 transition-all hover:shadow-md active:scale-95 ${inOrder ? "border-orange-400 shadow-md" : "border-transparent shadow-sm hover:border-orange-200"}`}
                  >
                    {inOrder && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs" style={{ fontWeight: 600 }}>
                        {inOrder.quantity}
                      </div>
                    )}
                    <div className="text-3xl mb-2 text-center">{product.emoji}</div>
                    <p className="text-slate-800 text-xs mb-1 line-clamp-2" style={{ fontWeight: 500 }}>{product.name}</p>
                    <p className="text-orange-500 text-sm" style={{ fontWeight: 600 }}>{formatCOP(product.price)}</p>
                    {cat && (
                      <span className="text-xs text-slate-400">{cat.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Order */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-slate-600" />
            <h3 className="text-slate-800">Pedido</h3>
          </div>
          <div>
            <span className="text-xs text-slate-500">{currentTable?.name} · {currentRoom?.name}</span>
          </div>
        </div>

        {!currentSession && (
          <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            ⚠️ Debe abrir la caja antes de registrar ventas
          </div>
        )}

        {/* Order items */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <ShoppingCart size={36} className="mb-2 opacity-40" />
              <p className="text-sm">Agrega productos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orderItems.map(item => (
                <div key={item.productId} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm text-slate-700 flex-1" style={{ fontWeight: 500 }}>{item.productName}</span>
                    <button onClick={() => updateQty(item.productId, -item.quantity)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-orange-100 hover:text-orange-600 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="text-slate-700 text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-orange-100 hover:text-orange-600 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-slate-800 text-sm" style={{ fontWeight: 500 }}>{formatCOP(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order total */}
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600">Total ({itemCount} items)</span>
            <span className="text-slate-900 text-xl" style={{ fontWeight: 700 }}>{formatCOP(orderTotal)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearOrder}
              disabled={orderItems.length === 0}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              Limpiar
            </button>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={!canCheckout}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm transition-all"
            >
              Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-slate-800">Cobrar Pedido</h3>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{currentTable?.name} · {currentRoom?.name}</span>
                  <span>{itemCount} productos</span>
                </div>
                <div className="space-y-1 mb-3">
                  {orderItems.map(item => (
                    <div key={item.productId} className="flex justify-between text-xs text-slate-500">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{formatCOP(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="text-slate-700">Total</span>
                  <span className="text-slate-900 text-lg" style={{ fontWeight: 700 }}>{formatCOP(orderTotal)}</span>
                </div>
              </div>

              {/* Payment method */}
              <p className="text-sm text-slate-600 mb-3">Forma de pago</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { value: "cash", label: "Efectivo", icon: Banknote },
                  { value: "transfer", label: "Transferencia", icon: CreditCard },
                  { value: "mixed", label: "Mixto", icon: Blend },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMethod(value as typeof paymentMethod)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs transition-all ${paymentMethod === value ? "border-orange-400 bg-orange-50 text-orange-600" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Mixed amounts */}
              {paymentMethod === "mixed" && (() => {
                const cashVal = parseFloat(cashAmount) || 0;
                const transferVal = parseFloat(transferAmount) || 0;
                const totalPaid = cashVal + transferVal;
                const isValid = totalPaid === orderTotal;
                const isOver = totalPaid > orderTotal;
                const isUnder = totalPaid < orderTotal;
                return (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Efectivo</label>
                        <input
                          type="number"
                          value={cashAmount}
                          onChange={e => setCashAmount(e.target.value)}
                          placeholder="$0"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Transferencia</label>
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={e => setTransferAmount(e.target.value)}
                          placeholder="$0"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>
                    {(cashAmount || transferAmount) && (
                      <div className={`mt-2 p-2 rounded-lg text-xs ${isValid ? "bg-green-50 text-green-700" : isOver ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                        <div className="flex justify-between items-center">
                          <span>{isValid ? "✓ Monto correcto" : isOver ? "⚠ Monto excedido" : "⚠ Falta pagar"}</span>
                          <span style={{ fontWeight: 500 }}>
                            {formatCOP(totalPaid)} / {formatCOP(orderTotal)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={handleCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all"
                style={{ fontWeight: 500 }}
              >
                Confirmar Venta · {formatCOP(orderTotal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && lastSale && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4">
          <CheckCircle size={24} />
          <div>
            <p style={{ fontWeight: 600 }}>¡Venta registrada!</p>
            <p className="text-green-200 text-sm">{formatCOP(lastSale.total)} · {lastSale.table}</p>
          </div>
        </div>
      )}
    </div>
  );
}
