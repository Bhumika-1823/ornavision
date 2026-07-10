import React, { useEffect, useRef, useState } from 'react';
import { PRODUCTS } from '@/data/products';
import { ShoppingBag, Star, ArrowRight, Play, Sparkles, MoveRight, ChevronDown, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

export default function HomePage() {
  const { addToCart, toggleWishlist, wishlist } = useAppContext();
  const featuredProducts = PRODUCTS.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
        {/* Abstract Background Glow */}
        <div className="absolute inset-0 bg-background pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-primary/10 rounded-full blur-[120px] opacity-70"></div>
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-yellow-900/10 rounded-full blur-[120px]"></div>
        </div>
        
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        <div className="relative z-10 container mx-auto px-4 text-center flex flex-col items-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-primary/80 uppercase tracking-[0.3em] text-xs font-semibold mb-6"
          >
            EST. 2024 — ORNAVISION
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="brand-font text-5xl md:text-7xl lg:text-8xl mb-8 leading-tight gold-gradient-text"
          >
            LUXURY <br className="hidden md:block" /> REIMAGINED
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light"
          >
            Experience the future of fine jewellery with our AI Virtual Try-On.
            Discover pieces that resonate with your soul, from the comfort of your home.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link
              href="/tryon"
              className="btn-gold px-8 py-4 rounded-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> Enter Try-On Studio
            </Link>
            <Link
              href="/shop"
              className="btn-gold-outline px-8 py-4 rounded-sm flex items-center justify-center gap-2 bg-background/50 backdrop-blur-sm"
            >
              Explore Collections
            </Link>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDown className="text-primary" size={24} />
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-24 container mx-auto px-4 border-t border-border/30">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="brand-font text-3xl md:text-4xl text-foreground mb-3">Curated Collections</h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">Masterpieces waiting to be discovered</p>
          </div>
          <Link href="/shop" className="hidden md:flex items-center gap-2 text-primary text-sm tracking-wider uppercase hover:underline">
            View All <MoveRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {[
            { name: 'Necklaces', icon: '📿', slug: 'necklaces', count: 12 },
            { name: 'Earrings', icon: '✨', slug: 'earrings', count: 18 },
            { name: 'Rings', icon: '💍', slug: 'rings', count: 24 },
            { name: 'Maang Tikkas', icon: '👑', slug: 'forehead-ornaments', count: 5 },
            { name: 'Nose Rings', icon: '🌸', slug: 'nose-rings', count: 9 },
          ].map((cat, i) => (
            <Link key={cat.slug} href={`/shop?category=${cat.slug}`}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-card aspect-square rounded-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer group transition-all"
              >
                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">{cat.icon}</span>
                <h3 className="brand-font text-sm md:text-base text-foreground mb-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-muted-foreground text-xs">{cat.count} pieces</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-card/30 border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="brand-font text-3xl md:text-4xl text-foreground mb-4">Featured Exclusives</h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-xl mx-auto">The pinnacle of our craftsmanship</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group relative">
                <div className="aspect-[4/5] bg-secondary/50 rounded-md overflow-hidden relative border border-border/50 mb-4 transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                  {product.tryonMetadata && (
                    <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md border border-primary/30 px-2 py-1 rounded text-[10px] uppercase tracking-widest text-primary flex items-center gap-1">
                      <Sparkles size={10} /> Try On
                    </div>
                  )}
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
                    aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-foreground hover:text-primary transition-colors border border-border/50"
                  >
                    <Heart size={16} fill={wishlist.includes(product.id) ? "currentColor" : "none"} className={wishlist.includes(product.id) ? "text-primary" : ""} />
                  </button>
                  <Link href={`/shop/${product.slug}`}>
                    <div className="w-full h-full flex items-center justify-center p-6 mix-blend-screen bg-black">
                      <img src={product.images[0]} alt={product.name} className="max-w-full max-h-full object-contain filter drop-shadow-2xl transition-transform duration-700 group-hover:scale-110" />
                    </div>
                  </Link>
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center">
                    <button 
                      onClick={(e) => { e.preventDefault(); addToCart(product.id); }}
                      className="w-full py-2 bg-primary text-black text-xs font-bold tracking-widest uppercase hover:brightness-110 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <Link href={`/shop/${product.slug}`}>
                      <h3 className="brand-font text-lg text-foreground hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-primary font-medium tracking-wide">₹{product.price.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star size={12} className="text-primary fill-primary" /> {product.ratingsAvg}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try-On Banner */}
      <section className="relative py-32 overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599643478524-fb66f4520ce4?q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        <div className="absolute top-1/2 right-1/4 w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="brand-font text-4xl md:text-6xl text-foreground mb-6 leading-tight">
              VIRTUAL<br /> <span className="gold-gradient-text">JEWELLERY</span><br /> STUDIO
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md font-light">
              Experience the magic of fine jewellery without leaving your home. Our AI-powered Try-On Studio places our masterpieces on you in real-time.
            </p>
            <ul className="flex flex-col gap-4 mb-10">
              {['Real-time AR tracking', 'Pixel-perfect scaling', 'Compare multiple pieces'].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm tracking-wider uppercase text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/tryon"
              className="btn-gold px-10 py-4 rounded-sm inline-flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              <Sparkles size={18} /> Launch Studio
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] glass-card rounded-2xl overflow-hidden border border-primary/20">
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10 pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 animate-pulse">
                  <Play className="text-primary ml-1" size={32} />
                </div>
              </div>
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <div className="bg-black/60 px-3 py-1.5 rounded text-[10px] tracking-widest uppercase text-primary border border-primary/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live
                </div>
                <div className="bg-black/60 p-2 rounded border border-white/10">
                  <ScanFace size={16} className="text-white/80" />
                </div>
              </div>
              <div className="w-full h-full bg-secondary/80 flex items-center justify-center text-muted-foreground/30 overflow-hidden">
                <video 
                  src="/videos/brand_video.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="brand-font text-3xl md:text-4xl text-foreground mb-4">Client Reverie</h2>
          <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-xl mx-auto">Words from our esteemed patrons</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "The virtual try-on is an absolute game-changer. I bought the Royal Gold Choker and it fits exactly as shown on the camera overlay.",
              author: "Sarah K.",
              product: "Royal Gold Choker",
            },
            {
              quote: "I was skeptical about buying diamond studs online, but seeing them virtually made it so easy. The snapshot feature is brilliant.",
              author: "David M.",
              product: "Classic Solitaire Studs",
            },
            {
              quote: "The Bridal Maang Tikka is absolutely breathtaking. My family couldn't believe how perfectly it suited me via the Try-On feature.",
              author: "Priya R.",
              product: "Bridal Maang Tikka",
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-8 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-primary mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-foreground/90 font-light leading-relaxed mb-8 italic">"{item.quote}"</p>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center brand-font text-primary">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wider uppercase text-foreground">{item.author}</p>
                  <p className="text-xs text-muted-foreground">Purchased: <span className="text-primary/80">{item.product}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-secondary/30 border-t border-border/30 pt-20 pb-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <span className="brand-font text-2xl tracking-widest gold-gradient-text uppercase block mb-6">Ornavision</span>
            <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
              A sanctuary of uncompromising luxury. Discover and virtually try on the world's most exquisite jewellery from the comfort of your home.
            </p>
          </div>
          <div>
            <h4 className="brand-font text-lg text-foreground mb-6">Explore</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li><Link href="/shop" className="hover-gold transition-colors">All Collections</Link></li>
              <li><Link href="/tryon" className="hover-gold transition-colors">Virtual Try-On</Link></li>
              <li><Link href="/designer" className="hover-gold transition-colors">Custom Designer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="brand-font text-lg text-foreground mb-6">Support</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li><span className="hover-gold transition-colors cursor-pointer">Shipping & Returns</span></li>
              <li><span className="hover-gold transition-colors cursor-pointer">Care Guide</span></li>
              <li><span className="hover-gold transition-colors cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 pt-8 border-t border-border/20 text-center text-xs text-muted-foreground tracking-widest uppercase">
          &copy; 2024 Ornavision. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function ScanFace(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </svg>
  );
}
