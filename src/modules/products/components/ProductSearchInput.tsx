import { Search } from "lucide-react";

interface ProductFilterInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProductFilterInput({
  value,
  onChange,
}: ProductFilterInputProps) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        placeholder="Buscar productos..."
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}
