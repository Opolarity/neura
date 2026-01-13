import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageSizeSelectorProps {
  size: number;
  onPageSizeChange: (value: number) => void;
}

function PageSizeSelector({ size, onPageSizeChange }: PageSizeSelectorProps) {
  const values = [20, 50, 100];

  return (
    <Select
      value={size.toString()}
      onValueChange={(value) => onPageSizeChange(Number(value))}
    >
      <SelectTrigger className="w-[80px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values.map((option) => (
          <SelectItem key={option} value={option.toString()}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default PageSizeSelector;
