import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { PRODUCTS, getProductById } from "@/data/products";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useAppContext();

  const wishlistedProducts = wishlist
    .map((id) => getProductById(id))
    .filter((p) => p !== undefined);

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-8 border border-border">
          <Heart size={40} className="text-muted-foreground" />
        </div>
        <h1 className="brand-font text-4xl text-foreground mb-4">
          Your Wishlist is Empty
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Save your favorite pieces here while you decide. Discover masterpieces
          that resonate with you.
        </p>
        <Link
          href="/shop"
          className="btn-gold px-10 py-4 rounded-sm tracking-widest"
        >
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="brand-font text-4xl md:text-5xl text-foreground mb-4">
            Your Saved Curations
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            {wishlist.length} {wishlist.length === 1 ? "Piece" : "Pieces"} Saved
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {wishlistedProducts.map((product) => {
              if (!product) return null;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={product.id}
                  className="group relative flex flex-col h-full bg-card/30 rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="aspect-[4/5] bg-black relative overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-primary hover:text-destructive transition-colors border border-primary/30"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={14} />
                    </button>

                    <Link
                      href={`/shop/${product.slug}`}
                      className="absolute inset-0 flex items-center justify-center p-6 mix-blend-screen"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain filter drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                      />
                    </Link>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/shop/${product.slug}`} className="flex-1">
                        <h3 className="brand-font text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                      {product.category}
                    </p>

                    <div className="mt-auto">
                      <p className="text-primary font-medium tracking-wide text-lg mb-4">
                        ₹{product.price.toLocaleString()}
                      </p>

                      <button
                        onClick={() => {
                          addToCart(product.id);
                          toggleWishlist(product.id); // remove from wishlist after adding to cart
                        }}
                        disabled={product.stock === 0}
                        className={`w-full py-3 rounded-sm flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold transition-all ${
                          product.stock > 0
                            ? "btn-gold-outline hover:bg-primary hover:text-black"
                            : "bg-secondary text-muted-foreground cursor-not-allowed border border-border"
                        }`}
                      >
                        <ShoppingBag size={14} />{" "}
                        {product.stock > 0 ? "Move to Cart" : "Out of Stock"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
