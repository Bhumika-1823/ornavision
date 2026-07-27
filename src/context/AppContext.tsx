import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { PRODUCTS, getProductById } from "@/data/products";

export interface OrderItemType {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderType {
  id: string;
  date: string;
  customer: string;
  email: string;
  amount: number;
  status: "Processing" | "Shipped" | "Local Hub" | "Delivered" | "Refunded";
  paymentMethod: "card" | "cod" | "upi";
  deliveryDate: string;
  shippingCarrier: string;
  trackingNumber: string;
  currentLocation: string;
  items: OrderItemType[];
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
  placeOrder: (order: Omit<OrderType, "email">) => void;
  updateOrder: (order: OrderType) => void;
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

  const normalizeUser = (value: any): UserType | null => {
    if (!value || typeof value !== "object") return null;
    const email = typeof value.email === "string" ? value.email.toLowerCase() : value.email;
    const name = value.name;
    if (!email || typeof email !== "string") return null;
    return {
      name: email === "admin@anonymous.club" ? "Admin" : (typeof name === "string" ? name : ""),
      email,
    };
  };

  const [user, setUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem("ornavision_user");
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      const normalizedUser = normalizeUser(user);
      if (!normalizedUser) return;
      localStorage.setItem("ornavision_user", JSON.stringify(normalizedUser));
      // Fetch cart and orders when user logs in
      fetch(`/api/cart?email=${normalizedUser.email}`)
        .then((res) => res.json())
        .then((data) => setCart(data));

      const ordersUrl =
        normalizedUser.email === "admin@anonymous.club"
          ? "/api/orders"
          : `/api/orders?email=${encodeURIComponent(normalizedUser.email)}`;

      fetch(ordersUrl)
        .then((res) => res.json())
        .then((data) => setOrders(data));
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

  const placeOrder = (order: Omit<OrderType, "email">) => {
    if (!user) return;
    const orderWithEmail: OrderType = {
      ...order,
      email: user.email,
    };
    setOrders((prev) => [orderWithEmail, ...prev]);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: orderWithEmail }),
    });
  };

  const updateOrder = (updatedOrder: OrderType) => {
    if (!user || user.email !== "admin@anonymous.club") return;

    setOrders((prev) =>
      prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
    );

    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: updatedOrder }),
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
    if (!user) {
      window.location.href = "/login";
      return;
    }

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
        updateOrder,
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
