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
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [rooms, setRooms] = useState<RoomConfig[]>([]);

  // Cargar datos mockeados desde los servicios al montar
  useEffect(() => {
    (async () => {
      const [usersData, categoriesData, productsData, suppliesData, suppliersData, salesData, roomsData] = await Promise.all([
        (await import("../../services/users.service")).fetchUsers(),
        (await import("../../services/categories.service")).fetchCategories(),
        (await import("../../services/products.service")).fetchProducts(),
        (await import("../../services/supplies.service")).fetchSupplies(),
        (await import("../../services/suppliers.service")).fetchSuppliers(),
        (await import("../../services/sales.service")).fetchSales(),
        (await import("../../services/rooms.service")).fetchRooms(),
      ]);
      setUsers(usersData);
      setCategories(categoriesData);
      setProducts(productsData);
      setSupplies(suppliesData);
      setSuppliers(suppliersData);
      setSales(salesData);
      setRooms(roomsData);
    })();
  }, []);

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
