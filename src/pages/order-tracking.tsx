import React, { useState } from "react";
import { OrderType, useAppContext } from "@/context/AppContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { PackageOpen, Clock3, CheckCircle2, Truck } from "lucide-react";

type TrackingStepKey = "received" | "shipped" | "nearby" | "delivered";

function ShipmentTimeline({
  status,
  currentLocation,
}: {
  status: string;
  currentLocation: string;
}) {
  const statusToStep = (statusValue: string): TrackingStepKey => {
    if (statusValue === "Processing") return "received";
    if (statusValue === "Shipped") return "shipped";
    if (statusValue === "Local Hub") return "nearby";
    if (statusValue === "Delivered") return "delivered";
    return "nearby";
  };

  const activeStep = statusToStep(status);

  const steps = [
    { id: "received" as const, title: "Order Received" },
    { id: "shipped" as const, title: "Shipped" },
    { id: "nearby" as const, title: "Near You" },
    { id: "delivered" as const, title: "Delivered" },
  ];

  const details: Record<TrackingStepKey, string> = {
    received:
      "Your product has been picked, packed, and prepared at the Ornavision fulfillment center.",
    shipped: `The package is in transit and moving through our delivery network. Last scan: ${currentLocation}.`,
    nearby: `The shipment is now nearby your delivery area. Last known location: ${currentLocation}.`,
    delivered:
      "The order has been delivered successfully to the destination address.",
  };

  const progressWidth =
    activeStep === "received"
      ? "20%"
      : activeStep === "shipped"
      ? "55%"
      : activeStep === "nearby"
      ? "85%"
      : "100%";

  return (
    <div className="bg-secondary/50 border border-border rounded-3xl p-6 mb-6">
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
        Shipment progress
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-3xl border px-4 py-3 text-left transition-all ${
              activeStep === step.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/40 bg-card text-muted-foreground"
            }`}
          >
            <span className="block text-xs uppercase tracking-widest mb-2">
              {step.title}
            </span>
            <span className="text-sm font-semibold">
              {step.id === "received" && "Picked"}
              {step.id === "shipped" && "In Transit"}
              {step.id === "nearby" && "Local Hub"}
              {step.id === "delivered" && "Complete"}
            </span>
          </div>
        ))}
      </div>

      <div className="h-2 rounded-full bg-border overflow-hidden mb-4">
        <div className="h-full bg-primary transition-all" style={{ width: progressWidth }} />
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Current checkpoint
        </p>
        <p className="text-sm text-foreground mb-4">{details[activeStep]}</p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Last known location
        </p>
        <p className="text-sm text-foreground">{currentLocation}</p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">
          Order status
        </p>
        <p className="text-sm text-foreground">{status}</p>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const { orders, user, updateOrder } = useAppContext();
  const isAdmin = user?.email?.toLowerCase?.() === "admin@anonymous.club";

  const statusActions = [
    {
      label: "Order Received",
      status: "Processing" as OrderType["status"],
      location: "Order received at Ornavision fulfillment center",
    },
    {
      label: "In Transit",
      status: "Shipped" as OrderType["status"],
      location: "Package is in transit through our delivery network",
    },
    {
      label: "Local Hub",
      status: "Local Hub" as OrderType["status"],
      location: "Arrived at the local hub for final delivery",
    },
    {
      label: "Delivered",
      status: "Delivered" as OrderType["status"],
      location: "Delivered to the customer destination",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
        <h1 className="brand-font text-4xl text-foreground mb-4">Track Your Order</h1>
        <p className="text-muted-foreground mb-8 max-w-xl">
          Please sign in to view your order history and track deliveries.
        </p>
        <Link href="/login" className="btn-gold px-8 py-3 rounded-sm tracking-widest">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="brand-font text-4xl text-foreground mb-4">Order Tracking</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track all of your recent orders, view current status, and review the items inside each delivery.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <PackageOpen size={48} className="mx-auto text-primary mb-6" />
            <h2 className="text-2xl text-foreground font-semibold mb-3">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Once you place an order, it will appear here so you can track its progress.
            </p>
            <Link href="/shop" className="btn-gold px-8 py-3 rounded-sm tracking-widest">
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-card border border-border rounded-3xl p-8 shadow-xl"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Order Reference
                    </p>
                    <p className="font-mono text-lg text-primary font-semibold">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Placed on
                    </p>
                    <p className="text-sm text-foreground">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Status
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-xs uppercase tracking-widest font-semibold">
                      {order.status === "Processing" && <Clock3 size={14} />}
                      {order.status === "Shipped" && <Truck size={14} />}
                      {order.status === "Delivered" && <CheckCircle2 size={14} />}
                      {order.status === "Refunded" && <PackageOpen size={14} />}
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Total Paid
                    </p>
                    <p className="text-lg font-semibold text-foreground">₹{order.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-secondary/60 border border-border rounded-3xl p-5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Estimated Delivery
                    </p>
                    <p className="text-lg text-foreground font-semibold">{order.deliveryDate}</p>
                  </div>
                  <div className="bg-secondary/60 border border-border rounded-3xl p-5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Shipped via
                    </p>
                    <p className="text-lg text-foreground font-semibold">{order.shippingCarrier}</p>
                  </div>
                  <div className="bg-secondary/60 border border-border rounded-3xl p-5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Tracking code
                    </p>
                    <p className="font-mono text-sm text-primary font-semibold">{order.trackingNumber}</p>
                  </div>
                </div>

                <ShipmentTimeline
                  status={order.status}
                  currentLocation={order.currentLocation}
                />

                {isAdmin && (
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Admin update shipment stage for this order:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                      {statusActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => {
                            updateOrder({
                              ...order,
                              status: action.status,
                              currentLocation: action.location,
                            });
                          }}
                          className="rounded-3xl border border-border/50 bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary/10 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-secondary/50 border border-border rounded-3xl p-6">
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                      Shipping to
                    </h3>
                    <p className="text-sm text-foreground">{order.customer}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-3">Email</p>
                    <p className="text-sm text-foreground">{order.email}</p>
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-3xl p-6">
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                      Items in this order
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.productId}`} className="flex justify-between gap-4">
                          <div>
                            <p className="text-sm text-foreground font-medium">{item.name}</p>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">
                              Qty {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm text-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
