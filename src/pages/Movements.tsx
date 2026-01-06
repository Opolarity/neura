import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface Movement {
  id: number;
  amount: number;
  movement_date: string;
  description: string | null;
  movement_types: {
    name: string;
  };
  movement_categories: {
    name: string;
  };
  payment_methods: {
    name: string;
  };
  business_accounts: {
    name: string;
  };
  profiles: {
    name: string;
    last_name: string;
  } | null;
}

interface MovementType {
  id: number;
  name: string;
}

interface MovementCategory {
  id: number;
  name: string;
}

export default function Movements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [categories, setCategories] = useState<MovementCategory[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [
    movements,
    searchTerm,
    selectedType,
    selectedCategory,
    startDate,
    endDate,
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch movements
      const { data: movementsData, error: movementsError } = await (
        supabase as any
      )
        .from("movements")
        .select(
          `
          id,
          amount,
          movement_date,
          description,
          movement_types(name),
          movement_categories(name),
          payment_methods(name),
          business_accounts(name),
          profiles(name, last_name)
        `
        )
        .order("movement_date", { ascending: false })
        .order("id", { ascending: false });

      if (movementsError) throw movementsError;
      setMovements(movementsData || []);

      // Fetch movement types
      const { data: typesData, error: typesError } = await (supabase as any)
        .from("movement_types")
        .select("id, name")
        .order("name");

      if (typesError) throw typesError;
      setMovementTypes(typesData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await (
        supabase as any
      )
        .from("movement_categories")
        .select("id, name")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.movement_categories.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          m.payment_methods.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((m) => m.movement_types.name === selectedType);
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (m) => m.movement_categories.name === selectedCategory
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(
        (m) => new Date(m.movement_date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (m) => new Date(m.movement_date) <= new Date(endDate)
      );
    }

    setFilteredMovements(filtered);
  };

  const getTotalAmount = () => {
    return filteredMovements.reduce((sum, m) => {
      const amount = m.movement_types.name === "Ingreso" ? m.amount : -m.amount;
      return sum + amount;
    }, 0);
  };

  const getIncomeTotal = () => {
    return filteredMovements
      .filter((m) => m.movement_types.name === "Ingreso")
      .reduce((sum, m) => sum + m.amount, 0);
  };

  const getExpenseTotal = () => {
    return filteredMovements
      .filter((m) => m.movement_types.name === "Egreso")
      .reduce((sum, m) => sum + m.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movimientos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los ingresos y gastos
          </p>
        </div>
        <Button onClick={() => navigate("/movements/add/expenses")}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Gasto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Ingresos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              $
              {getIncomeTotal().toLocaleString("es-CO", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              $
              {getExpenseTotal().toLocaleString("es-CO", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                getTotalAmount() >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              $
              {getTotalAmount().toLocaleString("es-CO", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Descripción, categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {movementTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Movimientos ({filteredMovements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Cargando movimientos...
              </div>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                No se encontraron movimientos
              </p>
              <Button
                variant="link"
                onClick={() => navigate("/movements/add/expenses")}
                className="mt-2"
              >
                Registrar primer movimiento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {format(new Date(movement.movement_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            movement.movement_types.name === "Ingreso"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {movement.movement_types.name === "Ingreso" ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {movement.movement_types.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.movement_categories.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {movement.description || "-"}
                      </TableCell>
                      <TableCell>{movement.payment_methods.name}</TableCell>
                      <TableCell>{movement.business_accounts.name}</TableCell>
                      <TableCell>
                        {movement.profiles
                          ? `${movement.profiles.name} ${movement.profiles.last_name}`
                          : "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          movement.movement_types.name === "Ingreso"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {movement.movement_types.name === "Ingreso" ? "+" : "-"}
                        $
                        {movement.amount.toLocaleString("es-CO", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
