import { SUPPLIERS } from '../mocks/suppliers.mock';
import { Supplier } from '../app/context/AppContext';

export async function fetchSuppliers(): Promise<Supplier[]> {
  return new Promise(resolve => setTimeout(() => resolve(SUPPLIERS), 300));
}
