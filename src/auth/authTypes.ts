// ============================================
// TIPOS DE AUTENTICACIÓN
// ============================================

export interface User {
  id: string;
  nombre: string;
  rol: "cajero" | "mesero" | "administrador";  
  email: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
}