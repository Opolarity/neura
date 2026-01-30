import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  getMovementsTypesByModule,
  getSaleProducts,
  getUserWarehouse,
} from "../services/Movements.service";
import CMovementTypeModal from "../components/create-movements/CMovementTypeModal";
import CMovementSummary from "../components/create-movements/CMovementSummary";
import CMovementSelectProducts from "../components/create-movements/CMovementSelectProducts";
import CMovementTable from "../components/create-movements/CMovementTable";
import { Link } from "react-router-dom";
import { cMovementsUserWarehouseAdapter } from "../adapters/Movements.adapter";
import { CMovementsFilters } from "../types/CreateMovements.types";

const CreateMovement = () => {
  const [typeStock, setTypeStock] = useState<string | undefined>(undefined);
  const typesStock = [
    { id: 9, name: "Producción", code: "PRD" },
    { id: 10, name: "Fallido", code: "FAL" },
  ];
  const [userSummary, setUserSummary] = useState(null);

  const handleTypeStock = (value: string) => {
    setTypeStock(value);
  };

  const load = async () => {
    const dataUser = await getUserWarehouse();
    const userWarehouse = cMovementsUserWarehouseAdapter(dataUser);
    console.log(userWarehouse);

    setUserSummary(userWarehouse);

    const filtersInitial: CMovementsFilters = {
      p_warehouse_id: userWarehouse.warehouse_id,
    };

    const dataProducts = await getSaleProducts(filtersInitial);
    console.log(dataProducts);

    const data = await getMovementsTypesByModule();
    console.log("types", data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Crear Movimiento
        </h1>
        <div className="flex gap-3">
          <Link to="/inventory/movements">
            <Button variant="outline">Cancelar</Button>
          </Link>

          <Button type="submit" form="movement-form">
            Crear
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <CMovementSummary
          currentDate={new Date().toISOString().split("T")[0]}
          userName={`${userSummary?.account_name} ${userSummary?.account_last_name} ${userSummary?.account_last_name2}`}
          warehouseName={userSummary?.warehouse_name}
          movementType=""
        />
        <CMovementSelectProducts
          typeStock={typeStock}
          typesStock={typesStock}
          onTypeStock={handleTypeStock}
        />
        <CMovementTable
          typeStock={typeStock}
          typesStock={typesStock}
          onTypeStock={handleTypeStock}
        />
      </Card>

      <CMovementTypeModal />
    </div>
  );
};

export default CreateMovement;
