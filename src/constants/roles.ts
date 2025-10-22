// Constantes para roles de usuario
export const ROLES = {
  USER: 1,
  ADMIN: 2
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

// Funciones helper para verificar roles
export const isAdmin = (roleId: number): boolean => roleId === ROLES.ADMIN;
export const isUser = (roleId: number): boolean => roleId === ROLES.USER;
export const canDeleteBets = (roleId: number): boolean => roleId >= ROLES.ADMIN;
