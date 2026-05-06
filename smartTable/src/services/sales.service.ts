import { SALES } from '../mocks/sales.mock';
import { Sale } from '../app/context/AppContext';

export async function fetchSales(): Promise<Sale[]> {
  return new Promise(resolve => setTimeout(() => resolve(SALES), 300));
}
