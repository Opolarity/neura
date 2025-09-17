import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Minus, ShoppingCart, CreditCard, DollarSign, Trash } from 'lucide-react';

const POS = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  const products = [
    { id: 1, name: 'Camiseta OVERTAKE Classic', price: 29.99, image: '/placeholder.svg' },
    { id: 2, name: 'Pantalón Deportivo Pro', price: 89.99, image: '/placeholder.svg' },
    { id: 3, name: 'Sudadera Urban Style', price: 65.99, image: '/placeholder.svg' },
    { id: 4, name: 'Gorra Streetwear', price: 24.99, image: '/placeholder.svg' },
    { id: 5, name: 'Zapatillas OVERTAKE', price: 129.99, image: '/placeholder.svg' },
    { id: 6, name: 'Chaqueta Bomber', price: 99.99, image: '/placeholder.svg' }
  ];

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setTotal(prev => prev + product.price);
  };

  const updateQuantity = (id, change) => {
    setCartItems(prev => {
      const item = prev.find(item => item.id === id);
      if (!item) return prev;
      
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        setTotal(prev => prev - (item.price * item.quantity));
        return prev.filter(item => item.id !== id);
      }
      
      setTotal(prev => prev + (item.price * change));
      return prev.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setTotal(0);
  };

  const processPayment = (method) => {
    // Aquí se procesaría el pago
    alert(`Procesando pago de $${total.toFixed(2)} con ${method}`);
    clearCart();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
        <p className="text-gray-600">Sistema de ventas rápido y eficiente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Productos</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                    <p className="text-lg font-bold text-blue-600">${product.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrito y Pago */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Carrito de Compras</h3>
                {cartItems.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Carrito vacío</p>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-blue-600">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total y Pago */}
          {cartItems.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600">Total a Pagar</p>
                  <p className="text-3xl font-bold text-green-600">${total.toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full gap-2"
                    onClick={() => processPayment('Efectivo')}
                  >
                    <DollarSign className="w-4 h-4" />
                    Pagar en Efectivo
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => processPayment('Tarjeta')}
                  >
                    <CreditCard className="w-4 h-4" />
                    Pagar con Tarjeta
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
