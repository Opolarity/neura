import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product, Variation } from "../../../products/products.types";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface VariationSelectorProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Product, variation: Variation, quantity: number) => void;
}

export const VariationSelector = ({ product, isOpen, onClose, onAddToCart }: VariationSelectorProps) => {
    const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
    const [quantity, setQuantity] = useState(1);

    if (!product) return null;

    const handleConfirm = () => {
        if (selectedVariation) {
            onAddToCart(product, selectedVariation, quantity);
            onClose();
            resetState();
        }
    };

    const resetState = () => {
        setSelectedVariation(null);
        setQuantity(1);
    };

    const totalPrice = useMemo(() => {
        if (!selectedVariation) return 0;
        return parseFloat(selectedVariation.price) * quantity;
    }, [selectedVariation, quantity]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="flex h-full max-h-[90vh]">
                    {/* Left: Product Image Preview */}
                    <div className="hidden sm:block w-48 bg-slate-50 border-r border-slate-100">
                        <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-xl font-extrabold text-slate-800 leading-tight">
                                {product.name}
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium text-slate-400">
                                Select your preferred variation and quantity
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Available Models</p>
                            {product.variations?.map((v) => (
                                <div
                                    key={v.id}
                                    onClick={() => setSelectedVariation(v)}
                                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${selectedVariation?.id === v.id
                                        ? 'border-blue-600 bg-blue-50/40 shadow-sm shadow-blue-100'
                                        : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className={`font-bold text-sm ${selectedVariation?.id === v.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {v.sku || `Model ${v.id}`}
                                        </span>
                                        <Badge variant="outline" className={`h-5 text-[9px] w-fit border-none px-0 font-bold ${v.stock > 0 ? 'text-slate-400' : 'text-red-400'}`}>
                                            {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-black italic ${selectedVariation?.id === v.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                            S/ {v.price}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-slate-100"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-8 text-center text-sm font-black text-slate-800">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-slate-100"
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Subtotal</p>
                                    <p className="text-2xl font-black text-blue-700 leading-none">
                                        S/ {totalPrice.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirm}
                                disabled={!selectedVariation}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] gap-2"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
