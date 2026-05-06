import { USERS } from '../mocks/users.mock';
import { User } from '../app/context/AppContext';

export async function fetchUsers(): Promise<User[]> {
  return new Promise(resolve => setTimeout(() => resolve(USERS), 300));
}
