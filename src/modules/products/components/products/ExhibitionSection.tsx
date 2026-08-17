import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ExhibitionSectionProps {
  isExhibition: boolean;
  setIsExhibition: (value: boolean) => void;
  exhibitionFrom: string;
  setExhibitionFrom: (value: string) => void;
  exhibitionTo: string;
  setExhibitionTo: (value: string) => void;
  disabled?: boolean;
}

/**
 * Marca el producto como "en exhibición" y, si lo está, captura el rango de fechas.
 * Las fechas se conservan al apagar el switch: es el switch el que decide si el
 * rango se envía o se manda en null.
 */
const ExhibitionSection = ({
  isExhibition,
  setIsExhibition,
  exhibitionFrom,
  setExhibitionFrom,
  exhibitionTo,
  setExhibitionTo,
  disabled,
}: ExhibitionSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exhibición</CardTitle>
      </CardHeader>
      <CardContent>
        <Collapsible
          open={isExhibition}
          onOpenChange={setIsExhibition}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="isExhibition" className="cursor-pointer">
              Producto en exhibición
            </Label>
            <Switch
              id="isExhibition"
              checked={isExhibition}
              onCheckedChange={setIsExhibition}
              disabled={disabled}
            />
          </div>

          <CollapsibleContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exhibitionFrom">Fecha de inicio</Label>
              <Input
                id="exhibitionFrom"
                type="datetime-local"
                value={exhibitionFrom}
                onChange={(e) => setExhibitionFrom(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exhibitionTo">Fecha de fin</Label>
              <Input
                id="exhibitionTo"
                type="datetime-local"
                value={exhibitionTo}
                min={exhibitionFrom || undefined}
                onChange={(e) => setExhibitionTo(e.target.value)}
                disabled={disabled}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default ExhibitionSection;
