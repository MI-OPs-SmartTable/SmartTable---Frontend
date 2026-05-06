// Mock de salones y mesas
import { RoomConfig } from '../app/context/AppContext';

export const ROOMS: RoomConfig[] = [
  { id: "r1", name: "Salón Principal", tables: [
    { id: "t1", name: "Mesa 1" },
    // ...agrega el resto de mesas aquí
  ]},
  // ...agrega el resto de salones aquí
];
