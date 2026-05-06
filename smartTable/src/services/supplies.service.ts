import { SUPPLIES } from '../mocks/supplies.mock';
import { Supply } from '../app/context/AppContext';

export async function fetchSupplies(): Promise<Supply[]> {
  return new Promise(resolve => setTimeout(() => resolve(SUPPLIES), 300));
}
