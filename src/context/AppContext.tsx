import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PRODUCTS } from '@/data/products';

export interface OrderType {
  id: string;
  date: string;
  customer: string;
  amount: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Refunded';
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface AppState {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  cartCount: number;
  cartTotal: number;
  // Coupon shared between cart and checkout
  couponCode: string;
  couponApplied: boolean;
  couponDiscount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  orders: OrderType[];
  placeOrder: (order: OrderType) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ornavision_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<OrderType[]>(() => {
    try {
      const saved = localStorage.getItem('ornavision_orders');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Initial mock data if empty
    return [
      { id: 'ORD-8923', date: '2026-07-10', customer: 'Sarah Jenkins', amount: 850, status: 'Processing' },
      { id: 'ORD-8922', date: '2026-07-09', customer: 'Michael Chen', amount: 450, status: 'Shipped' },
      { id: 'ORD-8921', date: '2026-07-08', customer: 'Priya Sharma', amount: 1250, status: 'Delivered' },
      { id: 'ORD-8920', date: '2026-07-08', customer: 'David Miller', amount: 320, status: 'Delivered' },
      { id: 'ORD-8919', date: '2026-07-07', customer: 'Emma Lewis', amount: 850, status: 'Refunded' },
      { id: 'ORD-8918', date: '2026-07-05', customer: 'James Wilson', amount: 1100, status: 'Delivered' },
    ];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ornavision_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    localStorage.setItem('ornavision_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ornavision_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('ornavision_orders', JSON.stringify(orders));
  }, [orders]);

  const placeOrder = (order: OrderType) => {
    setOrders(prev => [order, ...prev]);
  };

  const addToCart = (productId: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { productId, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setCouponApplied(false);
  };

  // Valid coupons: ORNA10 = 10% off
  const VALID_COUPONS: Record<string, number> = { 'ORNA10': 0.1 };

  const applyCoupon = (code: string): boolean => {
    const rate = VALID_COUPONS[code.toUpperCase()];
    if (rate !== undefined) {
      setCouponCode(code.toUpperCase());
      setCouponApplied(true);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      return acc + (product?.price || 0) * item.quantity;
    }, 0);
  }, [cart]);

  const COUPON_RATE = 0.1; // 10% for ORNA10
  const couponDiscount = useMemo(
    () => (couponApplied ? cartTotal * COUPON_RATE : 0),
    [couponApplied, cartTotal]
  );

  return (
    <AppContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleWishlist,
        cartCount,
        cartTotal,
        couponCode,
        couponApplied,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        orders,
        placeOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
