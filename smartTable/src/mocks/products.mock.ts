// Mock de productos
import { Product } from '../app/context/AppContext';

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Hamburguesa Clásica", price: 15000, categoryId: "c1", description: "Carne, lechuga, tomate y queso", emoji: "🍔", active: true, supplies: [{ supplyId: "sup1", quantity: 1 }, { supplyId: "sup2", quantity: 1 }, { supplyId: "sup3", quantity: 30 }, { supplyId: "sup4", quantity: 30 }, { supplyId: "sup5", quantity: 1 }] },
  // ...agrega el resto de productos aquí, igual que en AppContext
];
