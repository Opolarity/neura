import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "./ProductCard";
import { Product } from "../../../products/products.types";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
    products: Product[];
    loading: boolean;
    onAddToCart: (p: Product) => void;
}

const CATEGORIES = [
    "All Collections",
    "Summer '24",
    "Denim Essential",
    "Accessories",
    "Urban Style"
];

export const ProductGrid = ({
    products,
    loading,
    onAddToCart
}: ProductGridProps) => {
    return (
        <div className="flex flex-col gap-6">
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <p className="font-medium">No products found for this criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAdd={onAddToCart}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
