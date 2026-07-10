import React, { useState, useMemo } from 'react';
import { PRODUCTS } from '@/data/products';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Search,
  Filter
} from 'lucide-react';

import { useAppContext } from '@/context/AppContext';

// --- MOCK DATA (Customers Only) ---

const MOCK_CUSTOMERS = [
  { id: 'CUST-101', name: 'Sarah Jenkins', email: 'sarah.j@example.com', orders: 3, spent: 2500 },
  { id: 'CUST-102', name: 'Michael Chen', email: 'm.chen@example.com', orders: 1, spent: 450 },
  { id: 'CUST-103', name: 'Priya Sharma', email: 'priya.s@example.com', orders: 5, spent: 4200 },
  { id: 'CUST-104', name: 'David Miller', email: 'david.m@example.com', orders: 2, spent: 1200 },
  { id: 'CUST-105', name: 'Emma Lewis', email: 'emma.l@example.com', orders: 1, spent: 850 },
  { id: 'CUST-106', name: 'James Wilson', email: 'j.wilson@example.com', orders: 4, spent: 3100 },
];

type TabType = 'overview' | 'orders' | 'customers' | 'inventory' | 'outofstock';

export default function AdminDashboardPage() {
  const { orders } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Computed Stats
  const totalRevenue = useMemo(() => orders.filter(o => o.status !== 'Refunded').reduce((acc, curr) => acc + curr.amount, 0), [orders]);
  const outOfStockItems = useMemo(() => PRODUCTS.filter(p => p.stock === 0), []);
  const lowStockItems = useMemo(() => PRODUCTS.filter(p => p.stock > 0 && p.stock <= 3), []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="brand-font text-2xl text-foreground">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 rounded-xl border border-primary/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <p className="text-xs text-green-500">+12.5% from last month</p>
              </div>

              <div className="glass-card p-6 rounded-xl border border-border/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Orders</p>
                    <h3 className="text-2xl font-bold text-foreground">{orders.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
                    <ShoppingBag size={20} />
                  </div>
                </div>
                <p className="text-xs text-green-500">+4 new today</p>
              </div>

              <div className="glass-card p-6 rounded-xl border border-border/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Customers</p>
                    <h3 className="text-2xl font-bold text-foreground">{MOCK_CUSTOMERS.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
                    <Users size={20} />
                  </div>
                </div>
                <p className="text-xs text-green-500">+2 this week</p>
              </div>

              <div className={`glass-card p-6 rounded-xl border ${outOfStockItems.length > 0 ? 'border-red-500/50' : 'border-border/50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Out of Stock</p>
                    <h3 className="text-2xl font-bold text-foreground">{outOfStockItems.length}</h3>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${outOfStockItems.length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-secondary text-foreground'}`}>
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <button onClick={() => setActiveTab('outofstock')} className="text-xs text-primary hover:underline">View details</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className="glass-card p-6 rounded-xl border border-border/50">
                <h3 className="brand-font text-xl text-foreground mb-4">Recent Orders</h3>
                <div className="space-y-4">
                  {orders.slice(0, 4).map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 rounded bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">₹{order.amount.toLocaleString()}</p>
                        <span className={`text-[10px] uppercase px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-500/20 text-green-500' : order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-secondary text-muted-foreground'}`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-border/50">
                <h3 className="brand-font text-xl text-foreground mb-4">Low Stock Alerts</h3>
                <div className="space-y-4">
                  {lowStockItems.length > 0 ? lowStockItems.map(item => (
                    <div key={item.id} className="flex gap-4 items-center p-3 rounded bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 bg-black rounded p-1 flex-shrink-0">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-500">{item.stock} left</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">All items are well stocked.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'orders':
        const filteredOrders = orders.filter(o => 
          o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
          o.customer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="brand-font text-2xl text-foreground">Order Details History</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-card border border-border rounded-sm py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-widest border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{order.id}</td>
                      <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
                      <td className="px-6 py-4 text-foreground">{order.customer}</td>
                      <td className="px-6 py-4 text-primary font-bold">₹{order.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] uppercase px-2 py-1 rounded-full ${
                          order.status === 'Delivered' ? 'bg-green-500/20 text-green-500' : 
                          order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-500' : 
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'customers':
        const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="brand-font text-2xl text-foreground">Customer Details</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-card border border-border rounded-sm py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-widest border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Customer ID</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Total Orders</th>
                    <th className="px-6 py-4 font-medium">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted-foreground">{customer.id}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{customer.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{customer.email}</td>
                      <td className="px-6 py-4 text-foreground">{customer.orders}</td>
                      <td className="px-6 py-4 text-primary font-bold">₹{customer.spent.toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No customers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'inventory':
      case 'outofstock':
        const isOutOfStockView = activeTab === 'outofstock';
        let inventoryList = isOutOfStockView ? outOfStockItems : PRODUCTS;
        
        if (searchQuery) {
          inventoryList = inventoryList.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="brand-font text-2xl text-foreground">
                {isOutOfStockView ? 'Out of Stock Details' : 'Stock Details'}
              </h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-card border border-border rounded-sm py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                {!isOutOfStockView && (
                   <button 
                     onClick={() => setActiveTab('outofstock')}
                     className="px-4 py-2 border border-red-500/50 text-red-500 rounded text-sm hover:bg-red-500/10 transition-colors"
                   >
                     Show Out of Stock
                   </button>
                )}
                {isOutOfStockView && (
                   <button 
                     onClick={() => setActiveTab('inventory')}
                     className="px-4 py-2 border border-primary/50 text-primary rounded text-sm hover:bg-primary/10 transition-colors"
                   >
                     Show All Stock
                   </button>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-widest border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Current Stock</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {inventoryList.map(product => (
                    <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black rounded p-1">
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground uppercase text-xs tracking-wider">{product.category}</td>
                      <td className="px-6 py-4 text-foreground">₹{product.price.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold">
                        <span className={product.stock === 0 ? 'text-red-500' : product.stock <= 3 ? 'text-yellow-500' : 'text-green-500'}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.stock === 0 ? (
                          <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-red-500/20 text-red-500">Out of Stock</span>
                        ) : product.stock <= 3 ? (
                          <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">Low Stock</span>
                        ) : (
                          <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-green-500/20 text-green-500">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {inventoryList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/30 px-4 py-8 flex flex-col shrink-0 min-h-[calc(100vh-6rem)]">
        <h1 className="brand-font text-2xl text-primary mb-8 px-4">Admin Panel</h1>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'orders' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <ShoppingBag size={18} />
            Orders Details
          </button>
          <button 
            onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'customers' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <Users size={18} />
            Customer Details
          </button>
          <button 
            onClick={() => { setActiveTab('inventory'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'inventory' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <Package size={18} />
            Stock Details
          </button>
          <button 
            onClick={() => { setActiveTab('outofstock'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'outofstock' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
          >
            <AlertTriangle size={18} />
            Out of Stock Details
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">Administrator</p>
              <p className="text-xs text-muted-foreground">admin@ornavision.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
