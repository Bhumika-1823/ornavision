import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { AppProvider } from "@/context/AppContext";

import Navbar from "@/components/Navbar";
import HomePage from "@/pages/home";
import ShopPage from "@/pages/shop";
import ProductDetailPage from "@/pages/product-detail";
import TryonPage from "@/pages/tryon";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import DesignerPage from "@/pages/designer";
import WishlistPage from "@/pages/wishlist";
import DeveloperScenePage from "@/pages/developer-scene";
import CalibrationStudioPage from "@/pages/calibration-studio";
import DeviceLabPage from "@/pages/device-lab";
import AdminDashboardPage from "@/pages/admin";
import LoginPage from "@/pages/login";
import OrderTrackingPage from "@/pages/order-tracking";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <h1 className="brand-font text-6xl text-primary mb-4">404</h1>
      <h2 className="text-2xl text-foreground mb-4 uppercase tracking-widest font-light">
        Page Not Found
      </h2>
      <p className="text-muted-foreground mb-8">
        The vault you are looking for does not exist.
      </p>
      <a href="/" className="btn-gold px-8 py-3 rounded-sm">
        Return Home
      </a>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/shop" component={ShopPage} />
      <Route path="/shop/:slug" component={ProductDetailPage} />
      <Route path="/tryon" component={TryonPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/orders" component={OrderTrackingPage} />
      <Route path="/designer" component={DesignerPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/developer-scene" component={DeveloperScenePage} />
      <Route path="/calibration-studio" component={CalibrationStudioPage} />
      <Route path="/lab" component={DeviceLabPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Navbar />
            <Router />
          </WouterRouter>
        </AppProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
