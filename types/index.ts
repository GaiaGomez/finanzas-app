export type Categoria =
  | "Suscripciones" | "Casa" | "Nicotina" | "Educación"
  | "Transporte" | "Deuda" | "Apoyo profesional" | "Ahorro" | "Otro";

export type CategoriaVariable =
  | "Cuidado personal" | "Comida fuera" | "Entretenimiento"
  | "Ropa" | "Salud" | "Transporte extra" | "Nicotina" | "Otro";

export interface GastoFijo {
  id: string;
  user_id: string;
  nombre: string;
  categoria: Categoria;
  monto: number;
  pagado: boolean;
  quincena: string;   // "2024-01-Q1" o "2024-01-Q2"
  created_at: string;
}

export interface GastoVariable {
  id: string;
  user_id: string;
  descripcion: string;
  categoria: CategoriaVariable;
  monto: number;
  fecha: string;
  quincena: string;
  created_at: string;
}

export interface Perfil {
  id: string;
  nombre: string;
  ingreso_quincenal: number;
  updated_at: string;
}

export interface Deuda {
  id: string;
  user_id: string;
  nombre: string;
  monto_total: number;
  created_at: string;
}

export interface Abono {
  id: string;
  deuda_id: string;
  user_id: string;
  monto: number;
  nota: string;
  fecha: string;
  created_at: string;
}
