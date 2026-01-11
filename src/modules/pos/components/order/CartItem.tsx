import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType } from "../../types/pos.types";

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (cartItemId: string, delta: number) => void;
    onRemove: (cartItemId: string) => void;
}

export const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 group animate-in slide-in-from-right-2 duration-300">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 truncate">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-medium">
                    {item.variation_sku ? `Variation: ${item.variation_sku}` : "Standard Model"} • SKU: NM-402
                </p>

                <div className="flex items-center gap-1 mt-1.5">
                    <button
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                    <button
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-slate-800">S/ {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                <button
                    onClick={() => onRemove(item.cartItemId)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
