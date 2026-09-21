import { Outlet } from "react-router-dom";

// Layout del módulo: cada pantalla (Proveedores, Materiales) es una vista propia
// del sidebar, igual que en Configuración.
const Suppliers = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default Suppliers;
