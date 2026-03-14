import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCustomerPoints } from "../hooks/useCustomerPoints";
import { CustomerPointsTable } from "../components/CustomerPointsTable";

const CustomerPoints = () => {
  const { data, loading, search, setSearch } = useCustomerPoints();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Puntos de Clientes</h1>
        <p className="text-muted-foreground">Ranking de puntos por cliente</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CustomerPointsTable data={data} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPoints;
