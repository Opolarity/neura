import { useState } from "react";

interface ApiResponse {
  data: Product[];
  page: PageInfo;
}
interface Product {
  sku: string;
  product_name: string;
  variation_id: number;
  variation_name: string;
  stock_by_warehouse: StockByWarehouse[];
}
interface StockByWarehouse {
  stock: number | null;
  stock_type: string;
  warehouse_id: number;
  warehouse_name: string;
}
interface PageInfo {
  page: number;
  size: number;
  total: number;
}
const inventoryResponse: ApiResponse = {
  data: [
    {
      sku: "100000110053",
      product_name: "Producto de prueba 1",
      variation_id: 53,
      variation_name: "L",
      stock_by_warehouse: [
        {
          stock: 1040,
          stock_type: "PRD",
          warehouse_id: 1,
          warehouse_name: "Jesús María",
        },
        {
          stock: 25,
          stock_type: "PRD",
          warehouse_id: 2,
          warehouse_name: "Gamarra",
        },
      ],
    },
  ],
  page: {
    page: 1,
    size: 20,
    total: 48,
  },
};
interface Warehouse {
  id: number;
  name: string;
}
const warehousesResponse: Warehouse[] = [
  { id: 2, name: "Gamarra" },
  { id: 1, name: "Jesús María" },
];
interface InventoryPayload {
  product_variation_id: number;
  quantity: number | null;
  stock_type_code: string;
  movement_type_code: string;
  warehouse_id: number;
  created_by: string;
}

const Table = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [stockChanges, setStockChanges] = useState<Map<string, number | null>>(
    new Map(),
  );

  const getStockKey = (variationId: number, warehouseId: number) => {
    return `${variationId}-${warehouseId}`;
  };

  const handleStockChange = (
    variationId: number,
    warehouseId: number,
    value: string,
  ) => {
    const key = getStockKey(variationId, warehouseId);
    const numericValue = value === "" ? null : parseInt(value) || 0;

    setStockChanges((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, numericValue);
      return newMap;
    });
  };

  const getStockValue = (
    item: Product,
    warehouseId: number,
    originalStock?: number | null,
  ): number | null | "" => {
    const key = getStockKey(item.variation_id, warehouseId);
    if (stockChanges.has(key)) {
      const value = stockChanges.get(key);
      return value === null ? "" : value;
    }
    return originalStock ?? 0;
  };

  const prepareInventoryPayload = (): InventoryPayload[] => {
    const payload: InventoryPayload[] = [];

    inventoryResponse.data.forEach((item) => {
      warehousesResponse.forEach((warehouse) => {
        const key = getStockKey(item.variation_id, warehouse.id);
        const quantity = stockChanges.get(key);

        if (quantity !== undefined) {
          const stockInfo = item.stock_by_warehouse.find(
            (s) => s.warehouse_id === warehouse.id,
          );

          payload.push({
            product_variation_id: item.variation_id,
            quantity: quantity,
            stock_type_code: stockInfo?.stock_type ?? "PRD",
            movement_type_code: "ADJ", // Ajustar según tu lógica
            warehouse_id: warehouse.id,
            created_by: "user@example.com", // Ajustar según tu usuario
          });
        }
      });
    });

    return payload;
  };

  const handleUpdate = async () => {
    if (isEditing) {
      const payload = prepareInventoryPayload();
      console.log("Enviando a API:", payload);

      // Aquí llamas a tu API
      // await fetch('/api/inventory', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setStockChanges(new Map());
    setIsEditing(false);
  };

  const handleEdit = (variationId: number) => {
    setIsEditing(true);
    console.log("Modo edición activado para producto:", variationId);
  };

  const calculateRowTotal = (item: Product): number => {
    return warehousesResponse.reduce((sum, warehouse) => {
      const value = getStockValue(
        item,
        warehouse.id,
        item.stock_by_warehouse.find((s) => s.warehouse_id === warehouse.id)
          ?.stock,
      );
      if (value !== null && value !== "") {
        return sum + Number(value);
      }
      return sum;
    }, 0);
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={handleUpdate}>
          {isEditing ? "Actualizar" : "Editar"}
        </button>
        {isEditing && (
          <button onClick={handleCancel} style={{ marginLeft: "10px" }}>
            Cancelar
          </button>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Producto</th>
            <th>Variación</th>
            {warehousesResponse.map((wr) => (
              <th key={wr.id}>{wr.name}</th>
            ))}
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inventoryResponse.data.map((item) => {
            const total = calculateRowTotal(item);

            return (
              <tr key={item.variation_id}>
                <td>{item.sku}</td>
                <td>{item.product_name}</td>
                <td>{item.variation_name}</td>
                {warehousesResponse.map((wr) => {
                  const stock = item.stock_by_warehouse.find(
                    (s) => s.warehouse_id === wr.id,
                  );
                  const currentValue = getStockValue(item, wr.id, stock?.stock);

                  return (
                    <td key={wr.id}>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) =>
                          handleStockChange(
                            item.variation_id,
                            wr.id,
                            e.target.value,
                          )
                        }
                        disabled={!isEditing}
                      />
                    </td>
                  );
                })}
                <td>{total}</td>
                <td>
                  <button onClick={() => handleEdit(item.variation_id)}>
                    Editar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
