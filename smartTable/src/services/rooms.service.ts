import { ROOMS } from '../mocks/rooms.mock';
import { RoomConfig } from '../app/context/AppContext';

export async function fetchRooms(): Promise<RoomConfig[]> {
  return new Promise(resolve => setTimeout(() => resolve(ROOMS), 300));
}
