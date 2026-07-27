import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { PRODUCTS, getProductById } from "@/data/products";
import { ShieldCheck, CheckCircle2, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const {
    cart,
    cartTotal,
    clearCart,
    couponApplied,
    couponDiscount,
    couponCode,
    placeOrder,
    user,
  } = useAppContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod" | "upi">("card");

  // Discount comes from shared coupon context (set on cart page)
  const finalTotal = cartTotal - couponDiscount;

  // Redirect if empty and not success
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    } else if (cart.length === 0 && !isSuccess) {
      setLocation("/cart");
    }
  }, [cart, isSuccess, setLocation, user]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      const newOrderNumber = `ORN-${Math.floor(100000 + Math.random() * 900000)}`;

      // Grab customer details from form if available (using a simple fallback if not)
      const formData = new FormData(e.target as HTMLFormElement);
      const firstName = (formData.get("firstName") as string) || "Guest";
      const lastName = (formData.get("lastName") as string) || "User";

      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

      placeOrder({
        id: newOrderNumber,
        date: new Date().toISOString().split("T")[0],
        customer: `${firstName} ${lastName}`,
        amount: finalTotal,
        status: "Processing",
        paymentMethod,
        deliveryDate: estimatedDelivery.toISOString().split("T")[0],
        shippingCarrier: "Ornavision Express",
        trackingNumber: `ORN-${Math.floor(100000 + Math.random() * 900000)}`,
        currentLocation: "Order received at Ornavision fulfillment center",
        items: cartItems.map((item) => ({
          productId: item.product!.id,
          name: item.product!.name,
          price: item.product!.price,
          quantity: item.quantity,
        })),
      });

      setOrderNumber(newOrderNumber);
      setIsSuccess(true);
      clearCart();
    }, 2000);
  };

  const cartItems = cart
    .map((item) => {
      const product = getProductById(item.productId);
      return { ...item, product };
    })
    .filter((item) => item.product !== undefined);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-8 border-2 border-primary"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="brand-font text-4xl md:text-5xl text-foreground mb-4"
        >
          Order Confirmed
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-2 text-lg"
        >
          Thank you for choosing Ornavision.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-secondary/50 border border-border/50 rounded-lg px-8 py-4 mb-10 inline-block"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Order Reference
          </p>
          <p className="font-mono text-xl text-primary font-bold">
            {orderNumber}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground max-w-md mx-auto mb-10 font-light"
        >
          We have sent a confirmation email with your order details. Your
          exquisite pieces are being prepared by our artisans.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={() => setLocation("/shop")}
            className="btn-gold px-10 py-4 rounded-sm tracking-widest flex items-center gap-2"
          >
            <ShoppingBag size={18} /> Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="brand-font text-4xl text-foreground mb-10 text-center md:text-left border-b border-border/30 pb-6">
          Secure Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Form Column */}
          <div className="w-full lg:w-3/5">
            <form
              onSubmit={handleSubmit}
              id="checkout-form"
              className="space-y-10"
            >
              {/* Shipping Info */}
              <section>
                <h2 className="text-lg uppercase tracking-widest text-foreground mb-6 font-semibold flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs">
                    1
                  </span>
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      First Name *
                    </label>
                    <input
                      required
                      name="firstName"
                      type="text"
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Last Name *
                    </label>
                    <input
                      required
                      name="lastName"
                      type="text"
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Street Address *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      City *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Postal / Zip Code *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Country *
                    </label>
                    <select
                      required
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AE">United Arab Emirates</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      className="w-full bg-card border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Info */}
              <section>
                <h2 className="text-lg uppercase tracking-widest text-foreground mb-6 font-semibold flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs">
                    2
                  </span>
                  Payment Details
                </h2>

                <div className="flex gap-4 mb-6">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === "card" ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/50"}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="sr-only"
                    />
                    <span className="text-sm uppercase tracking-widest font-medium">
                      Card Payment
                    </span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/50"}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="sr-only"
                    />
                    <span className="text-sm uppercase tracking-widest font-medium">
                      Cash on Delivery
                    </span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === "upi" ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/50"}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                      className="sr-only"
                    />
                    <span className="text-sm uppercase tracking-widest font-medium">
                      UPI Payment
                    </span>
                  </label>
                </div>

                <div className="bg-card border border-border p-6 rounded-lg relative overflow-hidden">
                  {/* Decorative card background element */}
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                  {paymentMethod === "card" ? (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-medium tracking-wider uppercase text-foreground">
                          Credit / Debit Card
                        </span>
                        <div className="flex gap-2 opacity-50 grayscale mix-blend-screen">
                          <div className="h-5 w-8 bg-white rounded flex items-center justify-center text-[6px] text-black font-bold">
                            VISA
                          </div>
                          <div className="h-5 w-8 bg-white rounded flex items-center justify-center text-[6px] text-black font-bold">
                            MC
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 relative z-10">
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-widest text-muted-foreground">
                            Card Number *
                          </label>
                          <div className="relative">
                            <input
                              required
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              maxLength={19}
                              className="w-full bg-secondary border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors font-mono tracking-widest"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-widest text-muted-foreground">
                            Name on Card *
                          </label>
                          <input
                            required
                            type="text"
                            className="w-full bg-secondary border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors uppercase"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">
                              Expiry (MM/YY) *
                            </label>
                            <input
                              required
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full bg-secondary border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">
                              CVV *
                            </label>
                            <input
                              required
                              type="password"
                              placeholder="***"
                              maxLength={4}
                              className="w-full bg-secondary border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors text-center tracking-widest"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-green-500" />{" "}
                        Secure 256-bit Encryption
                      </div>
                    </>
                  ) : paymentMethod === "upi" ? (
                    <div className="space-y-5 relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-medium tracking-wider uppercase text-foreground">
                          UPI Payment
                        </span>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Instant Checkout
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pay instantly using your UPI app. Use the UPI ID below or scan our QR code.
                      </p>
                      <div className="space-y-4">
                        <div className="bg-secondary border border-border rounded-lg px-4 py-4">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                            UPI ID
                          </p>
                          <p className="text-lg font-semibold text-foreground">
                            ornavision@upi
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-widest text-muted-foreground">
                            Enter your UPI ID *
                          </label>
                          <input
                            required
                            name="upiId"
                            type="text"
                            placeholder="example@upi"
                            className="w-full bg-secondary border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-green-500" />{" "}
                        Secure UPI payment processing
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center relative z-10">
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border/50 text-primary">
                        <ShoppingBag size={24} />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Pay on Delivery
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        You can pay in cash or via UPI to our delivery executive
                        when your exquisite pieces arrive at your doorstep.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-2/5">
            <div className="glass-card p-6 md:p-8 rounded-xl border border-primary/20 sticky top-28">
              <h3 className="brand-font text-xl text-foreground mb-6 pb-4 border-b border-border/50">
                Your Order
              </h3>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => {
                  const p = item.product!;
                  return (
                    <div key={p.id} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-black rounded border border-border/50 shrink-0 mix-blend-screen p-1">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-foreground truncate">
                          {p.name}
                        </h4>
                        <p className="text-xs text-muted-foreground uppercase">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm text-primary font-medium">
                        ₹{(p.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 pt-6 border-t border-border/50 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase tracking-widest text-xs">
                    Subtotal
                  </span>
                  <span className="text-foreground">
                    ₹{cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase tracking-widest text-xs">
                    Shipping
                  </span>
                  <span className="text-green-500 text-xs font-bold uppercase tracking-widest">
                    Complimentary
                  </span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-primary">
                    <span className="uppercase tracking-widest text-xs">
                      Discount ({couponCode})
                    </span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-border/50 mb-8">
                <span className="text-foreground uppercase tracking-widest text-sm font-semibold">
                  Total to Pay
                </span>
                <span className="brand-font text-3xl text-primary">
                  ₹{finalTotal.toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full btn-gold py-4 rounded-sm flex items-center justify-center gap-2 text-base shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Place Order Securely"
                )}
              </button>

              <p className="text-[10px] text-muted-foreground text-center mt-4 uppercase tracking-widest leading-relaxed">
                By placing your order, you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
