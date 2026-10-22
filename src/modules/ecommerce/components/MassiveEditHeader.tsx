import type { ReactNode } from "react";

interface MassiveEditHeaderProps {
  children?: ReactNode;
}

const MassiveEditHeader = ({ children }: MassiveEditHeaderProps) => {
  return (
    <div className="flex flex-wrap gap-4 justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Edición masiva</h1>
      {children}
    </div>
  );
};

export default MassiveEditHeader;
