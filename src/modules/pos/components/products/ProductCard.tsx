import { Product } from "../../../products/products.types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ProductCardProps {
    product: Product;
    onAdd: (product: Product) => void;
}

export const ProductCard = ({ product, onAdd }: ProductCardProps) => {
    return (
        <Card
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group flex flex-col h-full bg-white border-slate-100"
            onClick={() => onAdd(product)}
        >
            <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-blue-700 font-bold border-none shadow-sm capitalize">
                        S/ {product.price}
                    </Badge>
                    {product.is_variable && (
                        <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-200/50 text-[9px] font-bold uppercase backdrop-blur-sm">
                            Variable
                        </Badge>
                    )}
                </div>
            </div>
            <div className="p-3 flex flex-col flex-1 gap-1">
                <h3 className="font-semibold text-sm text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-slate-400 font-medium">
                        Stock: <span className={product.stock > 0 ? "text-slate-600" : "text-red-500"}>{product.stock} units</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        NM-402
                    </span>
                </div>
            </div>
        </Card>
    );
};
