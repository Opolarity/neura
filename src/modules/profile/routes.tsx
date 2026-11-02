import type { RouteObject } from 'react-router-dom';
import MyProfilePage from './pages/MyProfilePage';

// Fuera del sistema de permisos, igual que Soporte: todo usuario con sesión
// puede editar su propio perfil.
export const profileRoutes: RouteObject[] = [
  { path: 'profile', element: <MyProfilePage /> },
];
