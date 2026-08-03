import { useAuth } from "@/modules/auth";

type ComponentPermissionProps = {
  /** Basta con que UNO de estos codes esté concedido. Manda sobre codeEqual. */
  codeIn?: string[];
  /** Tienen que estar TODOS. Solo se evalúa si no llegó codeIn. */
  codeEqual?: string[];
  children: React.ReactNode;
};

export function ComponentPermission({
  codeIn,
  codeEqual,
  children,
}: ComponentPermissionProps) {
  const { permissionCodes, permissionsLoading } = useAuth();

  // Los códigos llegan por RPC: sin esto la acción se vería antes de saber si
  // el usuario la tiene concedida.
  if (permissionsLoading) {
    return null;
  }

  // codeIn manda si se envían los dos. Sin ninguno de los dos no se muestra
  // nada: un prop mal escrito no debe abrir la acción a todos.
  let hasPermission = false;
  if (codeIn?.length) {
    hasPermission = codeIn.some((code) => permissionCodes.includes(code));
  } else if (codeEqual?.length) {
    hasPermission = codeEqual.every((code) => permissionCodes.includes(code));
  }

  if (!hasPermission) {
    return null;
  }

  return children;
}
