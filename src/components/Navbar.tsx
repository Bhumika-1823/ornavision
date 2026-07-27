import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingBag,
  Heart,
  Menu,
  X,
  ChevronDown,
  Wand2,
  Scissors,
  User,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { CATEGORIES } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cartCount, wishlist, user, logout } = useAppContext();
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border/50 py-3 shadow-lg"
            : "bg-gradient-to-b from-black/80 to-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-foreground hover-gold"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <Link href="/" className="flex items-center">
              <span className="brand-font text-2xl tracking-widest gold-gradient-text uppercase">
                Ornavision
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm tracking-wider uppercase hover-gold transition-colors"
            >
              Home
            </Link>
            <div
              className="relative group"
              onMouseEnter={() => setCollectionsOpen(true)}
              onMouseLeave={() => setCollectionsOpen(false)}
            >
              <button className="flex items-center gap-1 text-sm tracking-wider uppercase hover-gold transition-colors py-2">
                Collections <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {collectionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 w-48 glass-card rounded-md overflow-hidden py-2"
                  >
                    <Link
                      href="/shop"
                      className="block px-4 py-2 text-sm hover:bg-white/5 hover-gold transition-colors"
                    >
                      All Collections
                    </Link>
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        className="block px-4 py-2 text-sm hover:bg-white/5 hover-gold transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link
              href="/tryon"
              className="text-sm tracking-wider uppercase gold-text flex items-center gap-1 hover:brightness-125 transition-all"
            >
              <Wand2 size={16} /> Try-On Studio
            </Link>
            <Link
              href="/orders"
              className="text-sm tracking-wider uppercase hover-gold transition-colors"
            >
              Track Order
            </Link>
            <Link
              href="/admin"
              className="text-sm tracking-wider uppercase text-primary/80 hover-gold transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/designer"
              className="text-sm tracking-wider uppercase text-primary/80 flex items-center gap-1 hover-gold transition-colors"
            >
              <Scissors size={16} /> Design Your Own
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            {user ? (
              <div
                className="relative group"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button className="flex items-center gap-2 text-sm uppercase tracking-wider text-primary hover-gold transition-colors py-2">
                  <User size={20} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 w-48 glass-card rounded-md overflow-hidden py-2"
                    >
                      <div className="px-4 py-2 border-b border-white/10 mb-1">
                        <p className="text-sm text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-foreground hover-gold transition-colors"
              >
                <User size={20} />
              </Link>
            )}
            <Link
              href="/wishlist"
              className="relative text-foreground hover-gold transition-colors"
            >
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative text-foreground hover-gold transition-colors"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col md:hidden border-r border-border/50 max-w-[80%]"
          >
            <div className="p-5 flex items-center justify-between border-b border-border/50">
              <span className="brand-font text-xl gold-gradient-text uppercase">
                Ornavision
              </span>
              <button
                className="text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col py-6 px-4 gap-6 overflow-y-auto">
              <Link
                href="/"
                className="text-lg uppercase tracking-widest brand-font"
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="text-lg uppercase tracking-widest brand-font"
              >
                Shop All
              </Link>
              <Link
                href="/orders"
                className="text-lg uppercase tracking-widest brand-font"
              >
                Track Order
              </Link>
              <Link
                href="/admin"
                className="text-lg uppercase tracking-widest brand-font"
              >
                Dashboard
              </Link>
              <div className="flex flex-col gap-3 pl-4 border-l border-border/30">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="text-sm uppercase tracking-wider text-muted-foreground hover-gold"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div className="h-px w-full bg-border/50 my-2"></div>
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-white/5 rounded-md border border-white/10">
                    <User size={20} className="text-primary" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-lg uppercase tracking-widest brand-font text-red-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-lg uppercase tracking-widest brand-font flex items-center gap-2"
                >
                  <User size={20} /> Sign In
                </Link>
              )}
              <Link
                href="/tryon"
                className="text-lg uppercase tracking-widest brand-font gold-text flex items-center gap-2"
              >
                <Wand2 size={20} /> Try-On Studio
              </Link>
              <Link
                href="/designer"
                className="text-lg uppercase tracking-widest brand-font text-primary/80 flex items-center gap-2"
              >
                <Scissors size={20} /> Design Your Own
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
