import { ShoppingCart, Banknote, Smartphone, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem } from "./CartItem";
import { CartItem as CartItemType } from "../../types/pos.types";

interface CartSidebarProps {
    cart: CartItemType[];
    totals: {
        subtotal: number;
        tax: number;
        total: number;
    };
    onUpdateQuantity: (cartItemId: string, delta: number) => void;
    onRemove: (cartItemId: string) => void;
}

export const CartSidebar = ({ cart, totals, onUpdateQuantity, onRemove }: CartSidebarProps) => {
    return (
        <div className="w-[380px] bg-white border-l border-slate-100 flex flex-col h-full shadow-2xl shadow-slate-200/50">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="font-bold text-lg text-slate-800">Current Order</h2>
                </div>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {cart.length} Items
                </span>
            </div>

            <ScrollArea className="flex-1 px-5">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 gap-3 grayscale opacity-60">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8" />
                        </div>
                        <p className="font-medium text-sm">Your order is empty</p>
                    </div>
                ) : (
                    <div className="py-2">
                        {cart.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={onUpdateQuantity}
                                onRemove={onRemove}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Subtotal</span>
                        <span className="text-slate-700 font-semibold italic">S/ {totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">IGV (18%)</span>
                        <span className="text-slate-700 font-semibold italic">S/ {totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Discounts</span>
                        <span className="text-red-400 font-semibold italic">- S/ 0.00</span>
                    </div>
                    <div className="pt-3 flex justify-between">
                        <span className="text-lg font-bold text-slate-800">Total Amount</span>
                        <span className="text-2xl font-black text-blue-700">S/ {totals.total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="h-16 flex-col gap-1 border-slate-200 hover:border-blue-500 hover:bg-blue-50 group rounded-xl transition-all shadow-sm">
                        <Banknote className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-blue-700">CASH</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col gap-1 border-slate-200 hover:border-blue-500 hover:bg-blue-50 group rounded-xl transition-all shadow-sm">
                        <Smartphone className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-blue-700">YAPE / PLIN</span>
                    </Button>
                </div>

                <Button className="w-full h-14 text-sm font-bold uppercase tracking-widest gap-3 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                    <Zap className="w-5 h-5 fill-current" />
                    Process Checkout
                </Button>
            </div>
        </div>
    );
};
