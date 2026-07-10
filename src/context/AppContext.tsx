import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { PRODUCTS, getProductById } from "@/data/products";

export interface OrderType {
  id: string;
  date: string;
  customer: string;
  amount: number;
  status: "Processing" | "Shipped" | "Delivered" | "Refunded";
}

export interface UserType {
  name: string;
  email: string;
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
  user: UserType | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("ornavision_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<OrderType[]>([]);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ornavision_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const [user, setUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem("ornavision_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("ornavision_user", JSON.stringify(user));
      // Fetch cart and orders when user logs in
      fetch(`/api/cart?email=${user.email}`).then(res => res.json()).then(data => setCart(data));
      fetch('/api/orders').then(res => res.json()).then(data => setOrders(data));
    } else {
      localStorage.removeItem("ornavision_user");
      setCart([]);
      setOrders([]);
    }
  }, [user]);

  // Sync cart to API whenever it changes (if user is logged in)
  useEffect(() => {
    if (user && cart.length >= 0) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, cart })
      });
    }
    localStorage.setItem("ornavision_cart", JSON.stringify(cart));
  }, [cart, user]);

  useEffect(() => {
    localStorage.setItem("ornavision_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const placeOrder = (order: OrderType) => {
    if (!user) return;
    setOrders((prev) => [order, ...prev]);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
  };

  const addToCart = (productId: string, qty = 1) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + qty }
            : item,
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
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode("");
    setCouponApplied(false);
  };

  // Valid coupons: ORNA10 = 10% off
  const VALID_COUPONS: Record<string, number> = { ORNA10: 0.1 };

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
    setCouponCode("");
    setCouponApplied(false);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const product = getProductById(item.productId);
      return acc + (product?.price || 0) * item.quantity;
    }, 0);
  }, [cart]);

  const COUPON_RATE = 0.1; // 10% for ORNA10
  const couponDiscount = useMemo(
    () => (couponApplied ? cartTotal * COUPON_RATE : 0),
    [couponApplied, cartTotal],
  );

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

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
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
