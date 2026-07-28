import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { CATEGORIES, PRODUCTS } from "@/data/products";
import { useAppContext } from "@/context/AppContext";
import { Link } from "wouter";
import {
  Search,
  SlidersHorizontal,
  Star,
  Heart,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

export default function ShopPage() {
  const [location, setLocation] = useLocation();
  const { toggleWishlist, wishlist, addToCart } = useAppContext();

  const getCategoryFromLocation = (loc: string) => {
    const query = loc.includes("?")
      ? loc.split("?")[1]
      : "";
    const params = new URLSearchParams(query);
    const categoryParam = params.get("category");
    return categoryParam && CATEGORIES.some((c) => c.slug === categoryParam)
      ? categoryParam
      : "all";
  };

  const MAX_POSSIBLE_PRICE = useMemo(
    () => Math.max(500, ...PRODUCTS.map((p) => p.price)),
    [],
  );

  const [category, setCategory] = useState(() => getCategoryFromLocation(location));
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState(MAX_POSSIBLE_PRICE);
  const [tryOnOnly, setTryOnOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setCategory(getCategoryFromLocation(location));
  }, [location]);

  const updateCategory = (newCategory: string) => {
    const queryString = newCategory === "all" ? "" : `?category=${encodeURIComponent(newCategory)}`;
    setCategory(newCategory);
    setLocation(`/shop${queryString}`);
  };

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS;

    if (category !== "all") {
      result = result.filter((p) => p.categorySlug === category);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    result = result.filter((p) => p.price <= priceRange);

    if (tryOnOnly) {
      result = result.filter((p) => p.tryonMetadata !== null);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating":
          return b.ratingsAvg - a.ratingsAvg;
        case "newest":
        default:
          return 0; // Keeping original order as "newest" for mock data
      }
    });

    return result;
  }, [category, search, priceRange, tryOnOnly, sortBy]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header */}
      <div className="bg-secondary/30 border-b border-border/30 py-12 mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="brand-font text-4xl md:text-5xl text-foreground mb-4">
            {category === "all"
              ? "All Collections"
              : CATEGORIES.find((c) => c.slug === category)?.name}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-light">
            {category === "all"
              ? "Discover our complete curation of masterpieces. Every piece is a testament to uncompromising luxury."
              : CATEGORIES.find((c) => c.slug === category)?.description}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Search pieces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-sm py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Categories */}
          <div>
            <h3 className="brand-font text-lg text-foreground mb-4 flex items-center gap-2 border-b border-border/30 pb-2">
              <SlidersHorizontal size={16} className="text-primary" />{" "}
              Categories
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${category === "all" ? "border-primary" : "border-muted-foreground group-hover:border-primary/50"}`}
                >
                  {category === "all" && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  checked={category === "all"}
                  onChange={() => updateCategory("all")}
                />
                <span
                  className={`text-sm tracking-wider uppercase ${category === "all" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  All Pieces
                </span>
              </label>
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${category === cat.slug ? "border-primary" : "border-muted-foreground group-hover:border-primary/50"}`}
                  >
                    {category === cat.slug && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    checked={category === cat.slug}
                    onChange={() => updateCategory(cat.slug)}
                  />
                  <span
                    className={`text-sm tracking-wider uppercase ${category === cat.slug ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  >
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="brand-font text-lg text-foreground mb-4 border-b border-border/30 pb-2">
              Maximum Price
            </h3>
            <div className="space-y-4 pt-2">
              <input
                type="range"
                min="0"
                max={MAX_POSSIBLE_PRICE}
                step="1000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-primary bg-secondary h-1 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>₹0</span>
                <span className="text-primary font-bold">
                  ₹{priceRange.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Try On Only */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group p-3 bg-primary/5 border border-primary/20 rounded-md">
              <div
                className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-colors mt-0.5 ${tryOnOnly ? "bg-primary border-primary" : "border-muted-foreground group-hover:border-primary/50"}`}
              >
                {tryOnOnly && <Sparkles size={12} className="text-black" />}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={tryOnOnly}
                onChange={(e) => setTryOnOnly(e.target.checked)}
              />
              <div>
                <span
                  className={`block text-sm font-semibold tracking-wider uppercase ${tryOnOnly ? "text-primary" : "text-foreground"}`}
                >
                  Virtual Try-On
                </span>
                <span className="text-xs text-muted-foreground">
                  Show only products with AR overlay available
                </span>
              </div>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-border/30 pb-4">
            <span className="text-sm text-muted-foreground uppercase tracking-widest">
              Showing{" "}
              <span className="text-foreground font-bold">
                {filteredProducts.length}
              </span>{" "}
              pieces
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-secondary border border-border rounded-sm px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary uppercase tracking-wider"
              >
                <option value="newest">Newest Additions</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Search className="text-muted-foreground" size={24} />
              </div>
              <h3 className="brand-font text-xl text-foreground mb-2">
                No pieces found
              </h3>
              <p className="text-muted-foreground max-w-sm">
                We couldn't find any pieces matching your current filters. Try
                adjusting them.
              </p>
              <button
                onClick={() => {
                  updateCategory("all");
                  setSearch("");
                  setPriceRange(MAX_POSSIBLE_PRICE);
                  setTryOnOnly(false);
                }}
                className="mt-6 text-primary text-sm tracking-wider uppercase hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative flex flex-col h-full bg-card/30 rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="aspect-[4/5] bg-black relative overflow-hidden">
                      {product.tryonMetadata && (
                        <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-md border border-primary/30 px-2 py-1 rounded text-[10px] uppercase tracking-widest text-primary flex items-center gap-1 shadow-lg">
                          <Sparkles size={10} /> Try On
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product.id);
                        }}
                        aria-label={
                          wishlist.includes(product.id)
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-foreground hover:text-primary transition-colors border border-border/50"
                      >
                        <Heart
                          size={16}
                          fill={
                            wishlist.includes(product.id)
                              ? "currentColor"
                              : "none"
                          }
                          className={
                            wishlist.includes(product.id) ? "text-primary" : ""
                          }
                        />
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

                      {/* Quick Add Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product.id);
                          }}
                          className="flex-1 py-2.5 bg-primary text-black text-xs font-bold tracking-widest uppercase hover:brightness-110 flex items-center justify-center gap-2 rounded-sm"
                        >
                          <ShoppingBag size={14} /> Add to Cart
                        </button>
                      </div>
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

                      <div className="mt-auto flex justify-between items-end">
                        <p className="text-primary font-medium tracking-wide text-lg">
                          ₹{product.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star
                            size={12}
                            className="text-primary fill-primary"
                          />{" "}
                          {product.ratingsAvg}
                          <span className="opacity-50">
                            ({product.ratingsCount})
                          </span>
                        </div>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
