import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { PRODUCTS, TESTIMONIALS } from "@/data/products";
import { useAppContext } from "@/context/AppContext";
import { Link } from "wouter";
import {
  ChevronRight,
  Star,
  Heart,
  Sparkles,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  Shield,
  Ruler,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { addToCart, toggleWishlist, wishlist } = useAppContext();

  const product = PRODUCTS.find((p) => p.slug === slug);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex flex-col items-center justify-center text-center">
        <h1 className="brand-font text-4xl text-foreground mb-4">
          Piece Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          The exquisite piece you are looking for does not exist or has been
          removed.
        </p>
        <Link href="/shop" className="btn-gold px-8 py-3 rounded-sm">
          Return to Collections
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const reviews = TESTIMONIALS.filter((t) => t.product === product.name);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link
            href={`/shop?category=${product.categorySlug}`}
            className="hover:text-primary transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 mb-20">
          {/* Images Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible shrink-0 md:w-20">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square bg-card rounded-md overflow-hidden border-2 transition-colors ${activeImage === idx ? "border-primary" : "border-transparent opacity-50 hover:opacity-100"}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-contain p-2 mix-blend-screen bg-black"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 aspect-[4/5] bg-black rounded-xl border border-border/50 relative overflow-hidden group">
              {product.tryonMetadata && (
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-primary/30 px-3 py-1.5 rounded text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                  <Sparkles size={12} /> Try-On Available
                </div>
              )}
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-contain p-8 mix-blend-screen transition-transform duration-500 ease-out group-hover:scale-125 cursor-crosshair"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h1 className="brand-font text-4xl md:text-5xl text-foreground mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={
                      i < Math.floor(product.ratingsAvg)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground tracking-wider">
                {product.ratingsAvg} ({product.ratingsCount} Reviews)
              </span>
            </div>

            <div className="text-3xl text-primary font-medium tracking-wider mb-8">
              ₹{product.price.toLocaleString()}
            </div>

            <p className="text-muted-foreground font-light leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-4 mb-10 py-6 border-y border-border/30">
              {product.material && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Material
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {product.material}
                  </p>
                </div>
              )}
              {product.gemstone && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Gemstone
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {product.gemstone}
                  </p>
                </div>
              )}
              {product.weight && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Weight
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {product.weight}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                  Availability
                </p>
                {product.stock > 0 ? (
                  <p className="text-sm text-green-500 font-medium">
                    {product.stock < 5
                      ? `Only ${product.stock} left`
                      : "In Stock"}
                  </p>
                ) : (
                  <p className="text-sm text-red-500 font-medium">
                    Out of Stock
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center bg-card border border-border rounded-sm h-14">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center text-foreground font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={() => addToCart(product.id, quantity)}
                  disabled={product.stock === 0}
                  className={`flex-1 h-14 rounded-sm flex items-center justify-center gap-2 uppercase tracking-widest text-sm font-bold transition-all ${
                    product.stock > 0
                      ? "btn-gold"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag size={18} />{" "}
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  title={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  className={`w-14 h-14 border rounded-sm flex items-center justify-center transition-all ${
                    isWishlisted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  <Heart
                    size={20}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {/* Try On Button */}
              {product.tryonMetadata && (
                <button
                  onClick={() => setLocation(`/tryon?product=${product.slug}`)}
                  className="w-full h-14 mt-2 border border-primary/50 bg-black text-primary hover:bg-primary hover:text-black rounded-sm flex items-center justify-center gap-3 uppercase tracking-widest text-sm font-bold transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <Sparkles size={18} className="group-hover:animate-pulse" />{" "}
                  Try On Virtually
                </button>
              )}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/30">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck size={20} className="text-primary/70" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Free Global Shipping
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 border-x border-border/30 px-2">
                <Shield size={20} className="text-primary/70" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Lifetime Warranty
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Ruler size={20} className="text-primary/70" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Perfect Fit Guarantee
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto border border-border/50 rounded-lg overflow-hidden bg-card/20">
          <div className="flex border-b border-border/50">
            {["description", "details", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-xs md:text-sm uppercase tracking-widest font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-b-2 border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6 md:p-10 min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeTab === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-muted-foreground font-light leading-relaxed"
                >
                  <p>{product.description}</p>
                  <p>
                    Every piece in our collection is a labor of love, crafted by
                    master artisans who have inherited their skills through
                    generations. The attention to detail is evident in every
                    facet, ensuring that what you wear is not just jewelry, but
                    a legacy.
                  </p>
                  <p>
                    Whether you're attending a gala or celebrating a personal
                    milestone, this piece is designed to command attention and
                    elevate your presence.
                  </p>
                </motion.div>
              )}
              {activeTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ul className="space-y-4">
                    <li className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-muted-foreground uppercase tracking-widest text-xs">
                        SKU
                      </span>
                      <span className="text-foreground font-mono text-sm">
                        {product.id.toUpperCase()}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-muted-foreground uppercase tracking-widest text-xs">
                        Category
                      </span>
                      <span className="text-foreground text-sm">
                        {product.category}
                      </span>
                    </li>
                    {product.material && (
                      <li className="flex justify-between border-b border-border/30 pb-2">
                        <span className="text-muted-foreground uppercase tracking-widest text-xs">
                          Material
                        </span>
                        <span className="text-foreground text-sm">
                          {product.material}
                        </span>
                      </li>
                    )}
                    {product.gemstone && (
                      <li className="flex justify-between border-b border-border/30 pb-2">
                        <span className="text-muted-foreground uppercase tracking-widest text-xs">
                          Gemstone
                        </span>
                        <span className="text-foreground text-sm">
                          {product.gemstone}
                        </span>
                      </li>
                    )}
                    {product.weight && (
                      <li className="flex justify-between border-b border-border/30 pb-2">
                        <span className="text-muted-foreground uppercase tracking-widest text-xs">
                          Approx. Weight
                        </span>
                        <span className="text-foreground text-sm">
                          {product.weight}
                        </span>
                      </li>
                    )}
                    <li className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-muted-foreground uppercase tracking-widest text-xs">
                        Care
                      </span>
                      <span className="text-foreground text-sm text-right max-w-xs">
                        Avoid direct contact with perfumes and chemicals. Store
                        in the provided velvet pouch.
                      </span>
                    </li>
                  </ul>
                </motion.div>
              )}
              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {reviews.length > 0 ? (
                    <div className="space-y-8">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border-b border-border/30 pb-6 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-foreground font-semibold tracking-wide uppercase text-sm">
                                {review.name}
                              </p>
                              <p className="text-xs text-primary/70">
                                {review.role}
                              </p>
                            </div>
                            <div className="flex gap-1 text-primary">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  fill={
                                    i < review.rating ? "currentColor" : "none"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm italic font-light">
                            "{review.quote}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">
                        Be the first to review this masterpiece.
                      </p>
                      <button className="mt-4 text-primary text-sm uppercase tracking-widest border-b border-primary pb-1">
                        Write a Review
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
