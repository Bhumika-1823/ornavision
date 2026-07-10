import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { PRODUCTS } from '@/data/products';
import { Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { cart, removeFromCart, updateQty, cartTotal, couponApplied, couponDiscount, couponCode, applyCoupon, removeCoupon } = useAppContext();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = () => {
    const success = applyCoupon(couponInput);
    if (success) {
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput('');
    setCouponError('');
  };

  const finalTotal = cartTotal - couponDiscount;

  const cartItems = cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product !== undefined);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-8 border border-border">
          <ShoppingBag size={40} className="text-muted-foreground" />
        </div>
        <h1 className="brand-font text-4xl text-foreground mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Your shopping bag awaits our exquisite creations. Discover pieces that speak to you.</p>
        <Link href="/shop" className="btn-gold px-10 py-4 rounded-sm tracking-widest">Explore Collections</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="brand-font text-4xl md:text-5xl text-foreground mb-12 text-center">Shopping Bag</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Cart Items */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-border/50 text-xs tracking-widest uppercase text-muted-foreground font-semibold">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <AnimatePresence>
              {cartItems.map((item) => {
                const p = item.product!;
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    key={p.id} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 border-b border-border/30 relative"
                  >
                    {/* Mobile Remove (absolute) */}
                    <button 
                      onClick={() => removeFromCart(p.id)}
                      className="absolute top-4 right-0 md:hidden text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                      <Link href={`/shop/${p.slug}`} className="w-24 h-24 bg-black rounded border border-border/50 shrink-0 overflow-hidden mix-blend-screen p-2">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                      </Link>
                      <div>
                        <Link href={`/shop/${p.slug}`}>
                          <h3 className="brand-font text-lg text-foreground hover:text-primary transition-colors leading-tight mb-1 pr-6 md:pr-0">{p.name}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">{p.category}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center mt-2 md:mt-0">
                      <span className="md:hidden text-xs text-muted-foreground uppercase">Price:</span>
                      <span className="text-foreground">₹{p.price.toLocaleString()}</span>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center mt-2 md:mt-0">
                      <span className="md:hidden text-xs text-muted-foreground uppercase">Quantity:</span>
                      <div className="flex items-center border border-border rounded-sm h-8 w-24">
                        <button 
                          onClick={() => updateQty(p.id, item.quantity - 1)}
                          className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-center font-mono text-sm w-6">{item.quantity}</span>
                        <button 
                          onClick={() => updateQty(p.id, Math.min(p.stock, item.quantity + 1))}
                          className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center mt-2 md:mt-0">
                      <span className="md:hidden text-xs text-muted-foreground uppercase">Subtotal:</span>
                      <span className="text-primary font-medium tracking-wide">₹{(p.price * item.quantity).toLocaleString()}</span>
                    </div>

                    {/* Desktop Remove */}
                    <button 
                      onClick={() => removeFromCart(p.id)}
                      className="hidden md:flex absolute -right-10 w-8 h-8 items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="glass-card p-8 rounded-xl border border-primary/20 sticky top-28">
              <h2 className="brand-font text-2xl text-foreground mb-6 border-b border-border/50 pb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase tracking-widest">Subtotal</span>
                  <span className="text-foreground">₹{cartTotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase tracking-widest">Shipping</span>
                  <span className="text-green-500 uppercase tracking-widest text-xs font-bold">Complimentary</span>
                </div>

                {couponApplied && (
                  <div className="flex justify-between text-primary">
                    <span className="uppercase tracking-widest">Discount ({couponCode})</span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div className="mb-6 pb-6 border-b border-border/50">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input 
                      type="text" 
                      placeholder="Promo Code" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      disabled={couponApplied}
                      className="w-full bg-secondary border border-border rounded-sm py-2.5 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-primary uppercase placeholder:normal-case disabled:opacity-50"
                    />
                  </div>
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || !couponInput}
                    className="px-4 py-2 bg-card border border-border text-foreground text-xs uppercase tracking-widest rounded-sm hover:border-primary transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-destructive text-xs mt-2">{couponError}</p>}
                {couponApplied && <p className="text-primary text-xs mt-2 flex justify-between">Coupon applied! <button onClick={handleRemoveCoupon} className="underline hover:text-white">Remove</button></p>}
                {!couponApplied && !couponError && <p className="text-muted-foreground text-xs mt-2 italic">Hint: Try "ORNA10"</p>}
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-foreground uppercase tracking-widest font-semibold">Total</span>
                <span className="brand-font text-3xl text-primary">₹{finalTotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={() => setLocation('/checkout')}
                className="w-full btn-gold py-4 rounded-sm flex items-center justify-center gap-2 text-base"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-4 opacity-50 grayscale mix-blend-screen">
                {/* Fake payment icons */}
                <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] text-black font-bold">VISA</div>
                <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] text-black font-bold">MC</div>
                <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] text-black font-bold">AMEX</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
