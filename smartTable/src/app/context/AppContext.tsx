import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Role = "admin" | "cashier" | "waiter" | "inventory";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  pin: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface SupplyRequirement {
  supplyId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description: string;
  emoji: string;
  active: boolean;
  supplies: SupplyRequirement[];
}

export interface PurchaseHistory {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Supply {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
  cost: number;
  supplierId: string;
  purchaseHistory?: PurchaseHistory[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  products: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = "cash" | "transfer" | "mixed";
export type SaleStatus = "pending" | "completed" | "cancelled";

export interface Sale {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  transferAmount?: number;
  table: string;
  room: string;
  status: SaleStatus;
  cashierId: string;
  cashierName: string;
  sessionId: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface CashSession {
  id: string;
  date: string;
  openingBalance: number;
  openedBy: string;
  closedBy?: string;
  closingTime?: string;
  totalSales: number;
  totalCash: number;
  totalTransfer: number;
  expenses: Expense[];
  status: "open" | "closed";
}

export interface TableConfig {
  id: string;
  name: string;
}

export interface RoomConfig {
  id: string;
  name: string;
  tables: TableConfig[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_CATEGORIES: Category[] = [
  { id: "c1", name: "Comidas Rápidas", color: "#f97316", icon: "🍔" },
  { id: "c2", name: "Platos del Día", color: "#10b981", icon: "🍽️" },
  { id: "c3", name: "Acompañantes", color: "#f59e0b", icon: "🍟" },
  { id: "c4", name: "Bebidas", color: "#3b82f6", icon: "🥤" },
  { id: "c5", name: "Postres", color: "#ec4899", icon: "🍰" },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: "s1", name: "Distribuidora El Sol", contact: "Juan Pérez", phone: "3201234567", email: "elsol@email.com", address: "Cra 45 #12-34", products: "Harinas, papas, verduras" },
  { id: "s2", name: "Frigorífico Andino", contact: "María Torres", phone: "3109876543", email: "andino@email.com", address: "Av 68 #23-45", products: "Carnes, embutidos" },
  { id: "s3", name: "Bebidas Colombia", contact: "Carlos Ríos", phone: "3157654321", email: "bebidas@email.com", address: "Cll 80 #56-78", products: "Gaseosas, aguas, cervezas" },
];

const INITIAL_SUPPLIES: Supply[] = [
  { id: "sup1", name: "Pan de hamburguesa", unit: "unidad", quantity: 120, minStock: 30, cost: 500, supplierId: "s1" },
  { id: "sup2", name: "Carne de res (100g)", unit: "porción", quantity: 80, minStock: 20, cost: 3500, supplierId: "s2" },
  { id: "sup3", name: "Lechuga", unit: "gramos", quantity: 2000, minStock: 500, cost: 15, supplierId: "s1" },
  { id: "sup4", name: "Tomate", unit: "gramos", quantity: 3000, minStock: 500, cost: 10, supplierId: "s1" },
  { id: "sup5", name: "Queso tajado", unit: "tajada", quantity: 150, minStock: 40, cost: 800, supplierId: "s2" },
  { id: "sup6", name: "Papa", unit: "kg", quantity: 25, minStock: 5, cost: 2200, supplierId: "s1" },
  { id: "sup7", name: "Arroz", unit: "kg", quantity: 30, minStock: 5, cost: 3000, supplierId: "s1" },
  { id: "sup8", name: "Frijoles", unit: "kg", quantity: 15, minStock: 3, cost: 4500, supplierId: "s1" },
  { id: "sup9", name: "Chicharrón", unit: "porción", quantity: 40, minStock: 10, cost: 4000, supplierId: "s2" },
  { id: "sup10", name: "Salchicha", unit: "unidad", quantity: 90, minStock: 20, cost: 1200, supplierId: "s2" },
  { id: "sup11", name: "Pan perro", unit: "unidad", quantity: 90, minStock: 20, cost: 400, supplierId: "s1" },
  { id: "sup12", name: "Coca Cola 350ml", unit: "unidad", quantity: 8, minStock: 24, cost: 1800, supplierId: "s3" },
  { id: "sup13", name: "Agua 500ml", unit: "unidad", quantity: 60, minStock: 20, cost: 800, supplierId: "s3" },
  { id: "sup14", name: "Cerveza 330ml", unit: "unidad", quantity: 48, minStock: 12, cost: 2500, supplierId: "s3" },
  { id: "sup15", name: "Jugo natural", unit: "unidad", quantity: 30, minStock: 10, cost: 1500, supplierId: "s1" },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "Hamburguesa Clásica", price: 15000, categoryId: "c1", description: "Carne, lechuga, tomate y queso", emoji: "🍔", active: true, supplies: [{ supplyId: "sup1", quantity: 1 }, { supplyId: "sup2", quantity: 1 }, { supplyId: "sup3", quantity: 30 }, { supplyId: "sup4", quantity: 30 }, { supplyId: "sup5", quantity: 1 }] },
  { id: "p2", name: "Hamburguesa Doble", price: 18000, categoryId: "c1", description: "Doble carne, doble queso", emoji: "🍔", active: true, supplies: [{ supplyId: "sup1", quantity: 1 }, { supplyId: "sup2", quantity: 2 }, { supplyId: "sup3", quantity: 30 }, { supplyId: "sup4", quantity: 30 }, { supplyId: "sup5", quantity: 2 }] },
  { id: "p3", name: "Hot Dog", price: 10000, categoryId: "c1", description: "Salchicha, mostaza y ketchup", emoji: "🌭", active: true, supplies: [{ supplyId: "sup10", quantity: 1 }, { supplyId: "sup11", quantity: 1 }] },
  { id: "p4", name: "Perro con Todo", price: 12000, categoryId: "c1", description: "Salchicha con todos los aderezos", emoji: "🌭", active: true, supplies: [{ supplyId: "sup10", quantity: 1 }, { supplyId: "sup11", quantity: 1 }] },
  { id: "p5", name: "Bandeja Paisa", price: 22000, categoryId: "c2", description: "Arroz, frijoles, chicharrón, carne y huevo", emoji: "🍽️", active: true, supplies: [{ supplyId: "sup7", quantity: 0.2 }, { supplyId: "sup8", quantity: 0.15 }, { supplyId: "sup9", quantity: 1 }, { supplyId: "sup2", quantity: 1 }] },
  { id: "p6", name: "Sopa del Día", price: 15000, categoryId: "c2", description: "Sopa casera según el día", emoji: "🍲", active: true, supplies: [] },
  { id: "p7", name: "Almuerzo Corriente", price: 18000, categoryId: "c2", description: "Sopa, seco, jugo y postre", emoji: "🍛", active: true, supplies: [{ supplyId: "sup7", quantity: 0.2 }, { supplyId: "sup8", quantity: 0.15 }] },
  { id: "p8", name: "Papas Fritas", price: 8000, categoryId: "c3", description: "Papas fritas crocantes", emoji: "🍟", active: true, supplies: [{ supplyId: "sup6", quantity: 0.2 }] },
  { id: "p9", name: "Papas con Queso", price: 10000, categoryId: "c3", description: "Papas fritas con queso fundido", emoji: "🧀", active: true, supplies: [{ supplyId: "sup6", quantity: 0.2 }, { supplyId: "sup5", quantity: 2 }] },
  { id: "p10", name: "Ensalada", price: 7000, categoryId: "c3", description: "Ensalada fresca del día", emoji: "🥗", active: true, supplies: [{ supplyId: "sup3", quantity: 80 }, { supplyId: "sup4", quantity: 80 }] },
  { id: "p11", name: "Coca Cola", price: 4000, categoryId: "c4", description: "Gaseosa 350ml", emoji: "🥤", active: true, supplies: [{ supplyId: "sup12", quantity: 1 }] },
  { id: "p12", name: "Jugo Natural", price: 5000, categoryId: "c4", description: "Jugo de fruta natural", emoji: "🧃", active: true, supplies: [{ supplyId: "sup15", quantity: 1 }] },
  { id: "p13", name: "Agua", price: 2000, categoryId: "c4", description: "Agua mineral 500ml", emoji: "💧", active: true, supplies: [{ supplyId: "sup13", quantity: 1 }] },
  { id: "p14", name: "Cerveza", price: 6000, categoryId: "c4", description: "Cerveza fría 330ml", emoji: "🍺", active: true, supplies: [{ supplyId: "sup14", quantity: 1 }] },
  { id: "p15", name: "Café", price: 3000, categoryId: "c4", description: "Café tinto o con leche", emoji: "☕", active: true, supplies: [] },
  { id: "p16", name: "Torta del Día", price: 8000, categoryId: "c5", description: "Postre del día de la casa", emoji: "🍰", active: true, supplies: [] },
  { id: "p17", name: "Helado", price: 5000, categoryId: "c5", description: "Dos bolas de helado", emoji: "🍦", active: true, supplies: [] },
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

const fmt = (d: Date) => d.toISOString();

const INITIAL_SALES: Sale[] = [
  { id: "sale1", date: fmt(new Date(yesterday.setHours(12, 30))), items: [{ productId: "p5", productName: "Bandeja Paisa", price: 22000, quantity: 2 }, { productId: "p12", productName: "Jugo Natural", price: 5000, quantity: 2 }], subtotal: 54000, total: 54000, paymentMethod: "cash", cashAmount: 54000, table: "Mesa 3", room: "Salón Principal", status: "completed", cashierId: "u2", cashierName: "María López", sessionId: "ses1" },
  { id: "sale2", date: fmt(new Date(yesterday.setHours(13, 15))), items: [{ productId: "p1", productName: "Hamburguesa Clásica", price: 15000, quantity: 1 }, { productId: "p8", productName: "Papas Fritas", price: 8000, quantity: 1 }, { productId: "p11", productName: "Coca Cola", price: 4000, quantity: 1 }], subtotal: 27000, total: 27000, paymentMethod: "transfer", transferAmount: 27000, table: "Mesa 1", room: "Salón Principal", status: "completed", cashierId: "u2", cashierName: "María López", sessionId: "ses1" },
  { id: "sale3", date: fmt(new Date(yesterday.setHours(19, 45))), items: [{ productId: "p2", productName: "Hamburguesa Doble", price: 18000, quantity: 3 }, { productId: "p8", productName: "Papas Fritas", price: 8000, quantity: 3 }, { productId: "p14", productName: "Cerveza", price: 6000, quantity: 4 }], subtotal: 102000, total: 102000, paymentMethod: "cash", cashAmount: 102000, table: "Mesa 5", room: "Terraza", status: "completed", cashierId: "u2", cashierName: "María López", sessionId: "ses1" },
  { id: "sale4", date: fmt(new Date(yesterday.setHours(20, 30))), items: [{ productId: "p3", productName: "Hot Dog", price: 10000, quantity: 2 }, { productId: "p11", productName: "Coca Cola", price: 4000, quantity: 2 }], subtotal: 28000, total: 28000, paymentMethod: "cash", cashAmount: 28000, table: "Mesa 2", room: "Terraza", status: "completed", cashierId: "u2", cashierName: "María López", sessionId: "ses1" },
  { id: "sale5", date: fmt(new Date(twoDaysAgo.setHours(12, 0))), items: [{ productId: "p7", productName: "Almuerzo Corriente", price: 18000, quantity: 4 }, { productId: "p15", productName: "Café", price: 3000, quantity: 4 }], subtotal: 84000, total: 84000, paymentMethod: "mixed", cashAmount: 50000, transferAmount: 34000, table: "Mesa 4", room: "Salón Principal", status: "completed", cashierId: "u2", cashierName: "María López", sessionId: "ses2" },
  { id: "sale6", date: fmt(new Date(twoDaysAgo.setHours(13, 30))), items: [{ productId: "p1", productName: "Hamburguesa Clásica", price: 15000, quantity: 2 }, { productId: "p9", productName: "Papas con Queso", price: 10000, quantity: 2 }, { productId: "p12", productName: "Jugo Natural", price: 5000, quantity: 2 }], subtotal: 60000, total: 60000, paymentMethod: "transfer", transferAmount: 60000, table: "Mesa 6", room: "Salón Principal", status: "completed", cashierId: "u2", cashierName: "María López", sessionId: "ses2" },
  { id: "sale7", date: fmt(new Date(twoDaysAgo.setHours(21, 0))), items: [{ productId: "p4", productName: "Perro con Todo", price: 12000, quantity: 5 }, { productId: "p14", productName: "Cerveza", price: 6000, quantity: 5 }], subtotal: 90000, total: 90000, paymentMethod: "cash", cashAmount: 90000, table: "Mesa 7", room: "Terraza", status: "completed", cashierId: "u2", cashierName: "María López", sessionId: "ses2" },
];

const INITIAL_SESSIONS: CashSession[] = [
  {
    id: "ses2", date: twoDaysAgo.toISOString().split("T")[0], openingBalance: 150000, openedBy: "Lina Rivas",
    closedBy: "Lina Rivas", closingTime: new Date(twoDaysAgo.setHours(22, 0)).toISOString(),
    totalSales: 234000, totalCash: 90000, totalTransfer: 144000,
    expenses: [{ id: "e1", description: "Compra ingredientes", amount: 45000, date: twoDaysAgo.toISOString() }],
    status: "closed"
  },
  {
    id: "ses1", date: yesterday.toISOString().split("T")[0], openingBalance: 100000, openedBy: "Lina Rivas",
    closedBy: "Lina Rivas", closingTime: new Date(yesterday.setHours(22, 30)).toISOString(),
    totalSales: 211000, totalCash: 184000, totalTransfer: 27000,
    expenses: [{ id: "e2", description: "Jabón y desinfectante", amount: 18000, date: yesterday.toISOString() }, { id: "e3", description: "Gas", amount: 35000, date: yesterday.toISOString() }],
    status: "closed"
  },
];

const INITIAL_USERS: User[] = [
  { id: "u1", name: "Lina Marcela Rivas", email: "lina@restaurante.com", role: "admin", pin: "1234", active: true },
  { id: "u2", name: "María López", email: "maria@restaurante.com", role: "cashier", pin: "2222", active: true },
  { id: "u3", name: "Carlos García", email: "carlos@restaurante.com", role: "waiter", pin: "3333", active: true },
  { id: "u4", name: "Ana Pérez", email: "ana@restaurante.com", role: "inventory", pin: "4444", active: true },
];

const INITIAL_ROOMS: RoomConfig[] = [
  { id: "r1", name: "Salón Principal", tables: [
    { id: "t1", name: "Mesa 1" },
    { id: "t2", name: "Mesa 2" },
    { id: "t3", name: "Mesa 3" },
    { id: "t4", name: "Mesa 4" },
    { id: "t5", name: "Mesa 5" },
    { id: "t6", name: "Mesa 6" },
  ]},
  { id: "r2", name: "Terraza", tables: [
    { id: "t7", name: "Mesa 7" },
    { id: "t8", name: "Mesa 8" },
    { id: "t9", name: "Mesa 9" },
    { id: "t10", name: "Mesa 10" },
  ]},
  { id: "r3", name: "Salón VIP", tables: [
    { id: "t11", name: "Mesa VIP 1" },
    { id: "t12", name: "Mesa VIP 2" },
    { id: "t13", name: "Mesa VIP 3" },
  ]},
  { id: "r4", name: "Barra", tables: [
    { id: "t14", name: "Silla 1" },
    { id: "t15", name: "Silla 2" },
    { id: "t16", name: "Silla 3" },
    { id: "t17", name: "Silla 4" },
    { id: "t18", name: "Silla 5" },
  ]},
  { id: "r5", name: "Para Llevar", tables: [
    { id: "t19", name: "Pedido 1" },
    { id: "t20", name: "Pedido 2" },
    { id: "t21", name: "Pedido 3" },
  ]},
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  supplies: Supply[];
  setSupplies: React.Dispatch<React.SetStateAction<Supply[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  sales: Sale[];
  addSale: (sale: Sale) => void;
  sessions: CashSession[];
  currentSession: CashSession | null;
  openSession: (openingBalance: number) => CashSession;
  closeSession: (sessionId: string, expenses: Expense[], closedBy: string) => void;
  addExpense: (sessionId: string, expense: Expense) => void;
  rooms: RoomConfig[];
  setRooms: React.Dispatch<React.SetStateAction<RoomConfig[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      return loadFromStorage("pos_currentUser", null);
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<User[]>(() => {
    try {
      return loadFromStorage("pos_users", INITIAL_USERS);
    } catch {
      return INITIAL_USERS;
    }
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      return loadFromStorage("pos_categories", INITIAL_CATEGORIES);
    } catch {
      return INITIAL_CATEGORIES;
    }
  });
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      return loadFromStorage("pos_products", INITIAL_PRODUCTS);
    } catch {
      return INITIAL_PRODUCTS;
    }
  });
  const [supplies, setSupplies] = useState<Supply[]>(() => {
    try {
      return loadFromStorage("pos_supplies", INITIAL_SUPPLIES);
    } catch {
      return INITIAL_SUPPLIES;
    }
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      return loadFromStorage("pos_suppliers", INITIAL_SUPPLIERS);
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      return loadFromStorage("pos_sales", INITIAL_SALES);
    } catch {
      return INITIAL_SALES;
    }
  });
  const [sessions, setSessions] = useState<CashSession[]>(() => {
    try {
      return loadFromStorage("pos_sessions", INITIAL_SESSIONS);
    } catch {
      return INITIAL_SESSIONS;
    }
  });
  const [rooms, setRooms] = useState<RoomConfig[]>(() => {
    try {
      return loadFromStorage("pos_rooms", INITIAL_ROOMS);
    } catch {
      return INITIAL_ROOMS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("pos_currentUser", JSON.stringify(currentUser));
    } catch (e) {
      console.error("Error saving currentUser:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_users", JSON.stringify(users));
    } catch (e) {
      console.error("Error saving users:", e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_categories", JSON.stringify(categories));
    } catch (e) {
      console.error("Error saving categories:", e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_products", JSON.stringify(products));
    } catch (e) {
      console.error("Error saving products:", e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_supplies", JSON.stringify(supplies));
    } catch (e) {
      console.error("Error saving supplies:", e);
    }
  }, [supplies]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_suppliers", JSON.stringify(suppliers));
    } catch (e) {
      console.error("Error saving suppliers:", e);
    }
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_sales", JSON.stringify(sales));
    } catch (e) {
      console.error("Error saving sales:", e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_sessions", JSON.stringify(sessions));
    } catch (e) {
      console.error("Error saving sessions:", e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem("pos_rooms", JSON.stringify(rooms));
    } catch (e) {
      console.error("Error saving rooms:", e);
    }
  }, [rooms]);

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const currentSession = sessions.find(s => s.status === "open") || null;

  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    // Descontar insumos del inventario
    const productMap = new Map(products.map(p => [p.id, p]));
    setSessions(prev => prev.map(s => {
      if (s.id !== sale.sessionId) return s;
      const newTotal = s.totalSales + sale.total;
      const newCash = s.totalCash + (sale.cashAmount || 0);
      const newTransfer = s.totalTransfer + (sale.transferAmount || 0);
      return { ...s, totalSales: newTotal, totalCash: newCash, totalTransfer: newTransfer };
    }));
    // Update inventory
    const updatedSupplies = [...supplies];
    for (const item of sale.items) {
      const product = productMap.get(item.productId);
      if (product) {
        for (const req of product.supplies) {
          const idx = updatedSupplies.findIndex(s => s.id === req.supplyId);
          if (idx >= 0) {
            updatedSupplies[idx] = {
              ...updatedSupplies[idx],
              quantity: Math.max(0, updatedSupplies[idx].quantity - req.quantity * item.quantity)
            };
          }
        }
      }
    }
    setSupplies(updatedSupplies);
  };

  const openSession = (openingBalance: number): CashSession => {
    const newSession: CashSession = {
      id: `ses_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      openingBalance,
      openedBy: currentUser?.name || "Usuario",
      totalSales: 0,
      totalCash: 0,
      totalTransfer: 0,
      expenses: [],
      status: "open",
    };
    setSessions(prev => [newSession, ...prev]);
    return newSession;
  };

  const closeSession = (sessionId: string, expenses: Expense[], closedBy: string) => {
    setSessions(prev => prev.map(s => s.id !== sessionId ? s : {
      ...s,
      expenses,
      closedBy,
      closingTime: new Date().toISOString(),
      status: "closed",
    }));
  };

  const addExpense = (sessionId: string, expense: Expense) => {
    setSessions(prev => prev.map(s => s.id !== sessionId ? s : {
      ...s,
      expenses: [...s.expenses, expense],
    }));
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, setUsers,
      categories, setCategories,
      products, setProducts,
      supplies, setSupplies,
      suppliers, setSuppliers,
      sales, addSale,
      sessions, currentSession, openSession, closeSession, addExpense,
      rooms, setRooms,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  cashier: "Cajero",
  waiter: "Mesero",
  inventory: "Inventario",
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-700",
  cashier: "bg-blue-100 text-blue-700",
  waiter: "bg-green-100 text-green-700",
  inventory: "bg-amber-100 text-amber-700",
};
