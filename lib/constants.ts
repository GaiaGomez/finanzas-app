// lib/constants.ts — constantes de negocio de la app

export const LIMITE_VARIABLES_PCT = 0.20; // 20% del ingreso como tope recomendado para gastos variables
export const ALERTA_ROJA          = 90;   // % de gasto sobre ingresos que activa alerta roja
export const ALERTA_AMBER         = 70;   // % de gasto sobre ingresos que activa alerta amarilla

export const CATS_FIJOS = [
  "Suscripciones","Casa","Nicotina","Educación",
  "Transporte","Deuda","Apoyo profesional","Ahorro","Otro",
] as const;

export const CATS_VARIABLES = [
  "Cuidado personal","Comida fuera","Entretenimiento",
  "Ropa","Salud","Transporte extra","Nicotina","Otro",
] as const;

// Clase base reutilizable para inputs del dashboard
export const INPUT_CLS = "bg-[#1a1730] border border-[#2a2440] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-purple transition-colors w-full";
