import { PRODUCTS } from '../mocks/products.mock';
import { Product } from '../app/context/AppContext';

export async function fetchProducts(): Promise<Product[]> {
  // Simula una petición real
  return new Promise(resolve => setTimeout(() => resolve(PRODUCTS), 300));
}
