import { CATEGORIES } from '../mocks/categories.mock';
import { Category } from '../app/context/AppContext';

export async function fetchCategories(): Promise<Category[]> {
  return new Promise(resolve => setTimeout(() => resolve(CATEGORIES), 300));
}
