import type { ReactNode } from "react";

interface EditorDashboardHeaderProps {
  /** Canal, "Ver sitio" y el botón de crear de la sección abierta. */
  children?: ReactNode;
}

const EditorDashboardHeader = ({ children }: EditorDashboardHeaderProps) => {
  return (
    <div className="flex flex-wrap gap-4 justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Editor de sitio</h1>
      {children}
    </div>
  );
};

export default EditorDashboardHeader;
