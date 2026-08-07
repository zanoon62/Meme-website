"use client";

import * as React from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Check,
  Lock,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  Package,
  MapPin,
  Phone,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart, useCartSubtotal } from "@/components/providers/ui-provider";
import {
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_ZONES,
  PAYMENT_METHODS,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const steps = [
  { id: 1, name: "Information", icon: Package },
  { id: 2, name: "Shipping", icon: Truck },
  { id: 3, name: "Payment", icon: CreditCard },
];

// Egyptian governorates (top 15 by population)
const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Dakahlia", "Beheira", "Gharbia", "Qalyubia",
  "Sharqia", "Monufia", "Faiyum", "Beni Suef", "Minya", "Asyut", "Sohag",
  "Qena", "Luxor", "Aswan", "Red Sea", "Ismailia", "Suez", "Port Said", "Damietta",
  "Kafr El Sheikh", "Matrouh", "New Valley", "North Sinai", "South Sinai",
];

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const sub = useCartSubtotal();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [completed, setCompleted] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    buildingNo: "",
    floor: "",
    apartment: "",
    landmark: "",
    city: "",
    governorate: "Cairo",
    postalCode: "11511",
    phone: "",
    shippingZone: "cairo",
    paymentMethod: "card",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: "",
    fawryRef: "",
    vodafonePhone: "",
    instapayHandle: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmedOrder, setConfirmedOrder] = React.useState<{
    order_number: string;
    total: number;
  } | null>(null);

  const [promoInput, setPromoInput] = React.useState("");
  const [validatingPromo, setValidatingPromo] = React.useState(false);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    code: string;
    discount: number;
    type: string;
    value: number;
    freeShipping?: boolean;
  } | null>(null);

  const zone = SHIPPING_ZONES.find((z) => z.id === form.shippingZone) ?? SHIPPING_ZONES[0];
  const method = PAYMENT_METHODS.find((m) => m.id === form.paymentMethod) ?? PAYMENT_METHODS[0];

  // Calculate discount amount
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const discountedSub = Math.max(0, sub - discountAmount);

  // Free shipping over threshold or via free_shipping promo code, otherwise zone cost
  const shippingCost = (appliedCoupon?.freeShipping || sub >= FREE_SHIPPING_THRESHOLD) ? 0 : zone.cost;
  // Payment processing fee calculated on discounted subtotal
  const processingFee =
    (method.processingFee ?? 0) +
    Math.round(((method.feePercent ?? 0) / 100) * discountedSub);
  // Egypt VAT 14% on discounted subtotal
  const vat = Math.round(discountedSub * 0.14);
  const total = discountedSub + shippingCost + vat + processingFee;

  const handleApplyPromo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setValidatingPromo(true);
    setPromoError(null);

    try {
      // 1. Validate against server API endpoint
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: sub }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setAppliedCoupon({
            code,
            discount: data.discount ?? 0,
            type: data.type ?? "percent",
            value: data.value ?? 0,
            freeShipping: data.free_shipping ?? false,
          });
          toast.success(`Promo code ${code} applied!`);
          setPromoInput("");
          setValidatingPromo(false);
          return;
        } else if (data.reason === "min_subtotal_not_met") {
          const err = "Minimum order amount not met for this promo code";
          setPromoError(err);
          toast.error(err);
          setValidatingPromo(false);
          return;
        } else if (data.reason === "expired") {
          const err = "This promo code has expired";
          setPromoError(err);
          toast.error(err);
          setValidatingPromo(false);
          return;
        }
      }
    } catch {
      // fallback to client check
    }

    // 2. Client-side check for local admin-created promo codes (fallback)
    try {
      const saved = localStorage.getItem("meme-admin-promotions-v2");
      if (saved) {
        const coupons = JSON.parse(saved);
        const match = coupons.find(
          (c: any) => c.code.toUpperCase() === code && c.is_active
        );
        if (match) {
          if (match.min_subtotal && sub < match.min_subtotal) {
            const err = `Minimum subtotal of ${formatPrice(match.min_subtotal)} required`;
            setPromoError(err);
            toast.error(err);
            setValidatingPromo(false);
            return;
          }
          let disc = 0;
          if (match.type === "percent") {
            disc = Math.round((sub * match.value) / 100);
          } else if (match.type === "fixed") {
            disc = match.value;
          }
          setAppliedCoupon({
            code: match.code.toUpperCase(),
            discount: disc,
            type: match.type,
            value: match.value,
            freeShipping: match.type === "shipping",
          });
          toast.success(`Promo code ${match.code} applied!`);
          setPromoInput("");
          setValidatingPromo(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    const err = "Invalid or expired promo code";
    setPromoError(err);
    toast.error(err);
    setValidatingPromo(false);
  };

  const updateForm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!form.email || !form.phone || !form.firstName || !form.lastName || !form.address || !form.city) {
        toast.error("Please fill in all required contact and shipping details");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      // Step 3: Real Checkout API call
      setIsSubmitting(true);
      try {
        const fullStreet = form.buildingNo
          ? `Bldg ${form.buildingNo}, ${form.address}`
          : form.address;
        const details = [
          form.floor ? `Floor ${form.floor}` : null,
          form.apartment ? `Apt ${form.apartment}` : null,
          form.landmark ? `Near ${form.landmark}` : null,
        ].filter(Boolean).join(", ");

        const payload = {
          email: form.email,
          shipping_address: {
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            address1: fullStreet,
            address2: details || undefined,
            city: form.city,
            state: form.governorate,
            postal_code: form.postalCode || "11511",
            country: "EG",
            phone: form.phone,
          },
          shipping_method: "standard" as const,
          shipping_zone_id: form.shippingZone,
          payment_method_id: form.paymentMethod,
          coupon_code: appliedCoupon?.code,
          lines: lines.map((l) => ({
            productId: l.productId,
            slug: l.slug,
            name: l.name,
            image: l.image,
            color: l.color,
            size: l.size,
            price: l.price,
            quantity: l.quantity,
          })),
          customer_note: form.notes || undefined,
        };

        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          toast.error(data.error || "Failed to process order. Please try again.");
          setIsSubmitting(false);
          return;
        }

        setConfirmedOrder({
          order_number: data.order.order_number,
          total: data.order.total,
        });
        setCompleted(true);
        clear();
        toast.success("Order placed successfully!");
      } catch (err: any) {
        toast.error("Network error during checkout. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (completed) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-6"
          >
            <Check className="h-10 w-10" />
          </motion.div>
          <h1 className="font-display text-4xl tracking-tight mb-3">Order confirmed</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your order. A confirmation has been sent to {form.email || "your inbox"} and WhatsApp {form.phone || "your phone"}.
          </p>
          <div className="border border-border/60 rounded-sm p-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order number</span>
              <span className="font-medium font-mono text-amber-500 font-bold">{confirmedOrder?.order_number || "MEME-ORDER"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment method</span>
              <span className="font-medium">{method.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{formatPrice(confirmedOrder?.total ?? total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated delivery</span>
              <span className="font-medium">{zone.estimatedDays}</span>
            </div>
            {form.paymentMethod === "fawry" && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-sm">
                <p className="text-xs text-orange-800 dark:text-orange-300 font-medium mb-1">Fawry Reference Code</p>
                <p className="font-mono text-lg font-bold tracking-wider text-orange-900 dark:text-orange-200">
                  {Math.random().toString(36).slice(2, 12).toUpperCase()}
                </p>
                <p className="text-[11px] text-orange-700 dark:text-orange-400 mt-1">
                  Pay at any Fawry outlet within 24 hours. Order ships after payment confirmation.
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="w-full sm:w-auto rounded-full h-12 px-8 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Link href="/account">View My Orders</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-full h-12 px-8">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-3xl mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some pieces to check out.</p>
          <Button asChild className="rounded-full h-12 px-8">
            <Link href="/shop">Browse collection</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>

      <div className="mb-10">
        <h1 className="font-display text-4xl lg:text-5xl tracking-tight">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" /> Shipping from Cairo, Egypt · Prices in EGP · COD available nationwide
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-10 max-w-2xl">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              className="flex items-center gap-2"
              disabled={step.id > currentStep}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                  step.id < currentStep
                    ? "bg-foreground border-foreground text-background"
                    : step.id === currentStep
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {step.id < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  "text-xs uppercase tracking-wider font-medium hidden sm:inline",
                  step.id === currentStep ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.name}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px mx-2", step.id < currentStep ? "bg-foreground" : "bg-border")} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-16">
        {/* Form */}
        <div>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-2xl mb-4">Contact information</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      className="h-12"
                    />
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+20 1X XXXX XXXX"
                        value={form.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Order updates will be sent via email and WhatsApp.
                  </p>
                </div>
                <div>
                  <h2 className="font-display text-2xl mb-4">Shipping address</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="First name (الاسم الأول) *" value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} className="h-12" />
                    <Input placeholder="Last name (اسم العائلة) *" value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} className="h-12" />
                  </div>
                  
                  {/* Street & Building info */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <Input placeholder="Building No. (رقم المبنى)" value={form.buildingNo} onChange={(e) => updateForm("buildingNo", e.target.value)} className="h-12" />
                    <Input placeholder="Floor (الطابق)" value={form.floor} onChange={(e) => updateForm("floor", e.target.value)} className="h-12" />
                    <Input placeholder="Apt No. (رقم الشقة)" value={form.apartment} onChange={(e) => updateForm("apartment", e.target.value)} className="h-12" />
                  </div>

                  <Input placeholder="Street name / Area (اسم الشارع / المنطقة) *" value={form.address} onChange={(e) => updateForm("address", e.target.value)} className="h-12 mt-3" />
                  
                  <Input placeholder="Nearest Landmark (أقرب علامة مميزة) e.g. Near Mall / Bank / Mosque" value={form.landmark} onChange={(e) => updateForm("landmark", e.target.value)} className="h-12 mt-3" />

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input placeholder="City / District (المدينة / الحي) *" value={form.city} onChange={(e) => updateForm("city", e.target.value)} className="h-12" />
                    <Select value={form.governorate} onValueChange={(v) => updateForm("governorate", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Governorate (المحافظة) *" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {GOVERNORATES.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={nextStep} size="lg" className="w-full h-12 rounded-full">
                  Continue to shipping <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="font-display text-2xl mb-4">Shipping zone</h2>
                <p className="text-sm text-muted-foreground -mt-3 mb-4">
                  Select your delivery region within Egypt. All shipments are dispatched from our Cairo atelier.
                </p>
                <RadioGroup
                  value={form.shippingZone}
                  onValueChange={(v) => updateForm("shippingZone", v)}
                  className="space-y-3"
                >
                  {SHIPPING_ZONES.map((zone) => {
                    const isFree = sub >= FREE_SHIPPING_THRESHOLD;
                    const price = isFree ? "FREE" : formatPrice(zone.cost);
                    return (
                      <Label
                        key={zone.id}
                        htmlFor={zone.id}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all",
                          form.shippingZone === zone.id ? "border-foreground bg-accent/30" : "border-border hover:border-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={zone.id} id={zone.id} />
                          <div>
                            <p className="font-medium text-sm">{zone.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {zone.estimatedDays}
                              {!zone.codAvailable && " · COD unavailable"}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium text-sm">{price}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
                {sub < FREE_SHIPPING_THRESHOLD && (
                  <div className="text-xs p-3 bg-accent/40 border border-border/60 rounded-sm">
                    Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}. You're {formatPrice(FREE_SHIPPING_THRESHOLD - sub)} away.
                  </div>
                )}
                <Button onClick={() => setCurrentStep(1)} variant="ghost" className="mr-2">
                  Back
                </Button>
                <Button onClick={nextStep} size="lg" className="w-full h-12 rounded-full">
                  Continue to payment <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">Payment method</h2>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Secure checkout
                  </span>
                </div>

                <RadioGroup
                  value={form.paymentMethod}
                  onValueChange={(v) => updateForm("paymentMethod", v)}
                  className="space-y-3"
                >
                  {PAYMENT_METHODS.map((opt) => (
                    <Label
                      key={opt.id}
                      htmlFor={opt.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all",
                        form.paymentMethod === opt.id ? "border-foreground bg-accent/30" : "border-border hover:border-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{opt.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{opt.name}</p>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </div>
                      </div>
                      {opt.processingFee ? (
                        <span className="text-xs text-muted-foreground">+{formatPrice(opt.processingFee)} fee</span>
                      ) : opt.feePercent ? (
                        <span className="text-xs text-muted-foreground">+{opt.feePercent}% fee</span>
                      ) : (
                        <span className="text-xs text-green-600 dark:text-green-400">No fee</span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>

                {/* Payment-specific fields */}
                {form.paymentMethod === "card" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-4 border border-border/60 rounded-sm">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Card details</p>
                    <Input placeholder="Card number (Visa / Mastercard / Meeza)" value={form.cardNumber} onChange={(e) => updateForm("cardNumber", e.target.value)} className="h-12" />
                    <Input placeholder="Name on card" value={form.cardName} onChange={(e) => updateForm("cardName", e.target.value)} className="h-12" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="MM / YY" value={form.cardExpiry} onChange={(e) => updateForm("cardExpiry", e.target.value)} className="h-12" />
                      <Input placeholder="CVC" value={form.cardCvc} onChange={(e) => updateForm("cardCvc", e.target.value)} className="h-12" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Powered by Paymob · 3D Secure enabled · PCI-DSS compliant</p>
                  </motion.div>
                )}

                {form.paymentMethod === "vodafone" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-4 border border-border/60 rounded-sm">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Vodafone Cash</p>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="Vodafone Cash wallet number (+20 1X XXXX XXXX)"
                        value={form.vodafonePhone}
                        onChange={(e) => updateForm("vodafonePhone", e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">You'll receive a USSD prompt on your phone to confirm the payment.</p>
                  </motion.div>
                )}

                {form.paymentMethod === "fawry" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-4 border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 rounded-sm">
                    <p className="text-xs uppercase tracking-wider text-orange-700 dark:text-orange-300">Fawry Reference Code</p>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      A unique reference code will be generated after you place the order. Pay at any Fawry outlet (supermarket, pharmacy, post office) within 24 hours. Your order ships the moment payment is confirmed.
                    </p>
                  </motion.div>
                )}

                {form.paymentMethod === "instapay" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-4 border border-border/60 rounded-sm">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">InstaPay</p>
                    <Input
                      placeholder="Your InstaPay handle (e.g. name@instapay)"
                      value={form.instapayHandle}
                      onChange={(e) => updateForm("instapayHandle", e.target.value)}
                      className="h-12"
                    />
                    <p className="text-[11px] text-muted-foreground">Open the InstaPay app and transfer to the MEME handle shown on the next screen. Order ships after confirmation.</p>
                  </motion.div>
                )}

                {form.paymentMethod === "cod" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-4 border border-border/60 rounded-sm bg-accent/30">
                    <p className="text-xs uppercase tracking-wider">Cash on Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Pay in cash when your order arrives. Please have the exact amount ready. COD is available across Egypt except for Red Sea & Sinai regions.
                    </p>
                  </motion.div>
                )}

                <div>
                  <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">Order notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Delivery instructions, landmarks, etc."
                    value={form.notes}
                    onChange={(e) => updateForm("notes", e.target.value)}
                    className="h-12 mt-1"
                  />
                </div>

                <Button onClick={() => setCurrentStep(2)} variant="ghost" className="mr-2">
                  Back
                </Button>
                <Button onClick={nextStep} disabled={isSubmitting} size="lg" className="w-full h-12 rounded-full font-bold">
                  {isSubmitting ? "Processing Order..." : `Place order — ${formatPrice(total)}`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-border/60 rounded-sm p-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-medium mb-4">Order summary</h3>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {lines.map((line) => (
                <div key={`${line.productId}-${line.color}-${line.size}`} className="flex gap-3">
                  <div className="relative w-14 h-16 rounded-sm overflow-hidden bg-accent flex-shrink-0">
                    <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" />
                    <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{line.name}</p>
                    <p className="text-[11px] text-muted-foreground">{line.color} / {line.size}</p>
                    <p className="text-xs font-medium mt-1">{formatPrice(line.price * line.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(sub)}</span>
              </div>
              {appliedCoupon && appliedCoupon.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatPrice(appliedCoupon.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping ({zone.name.split(" (")[0]})</span>
                <span>{shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (14%)</span>
                <span>{formatPrice(vat)}</span>
              </div>
              {processingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment fee ({method.name})</span>
                  <span>{formatPrice(processingFee)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="font-display text-xl">{formatPrice(total)}</span>
            </div>

            {/* Discount / Promo Code */}
            {appliedCoupon ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {appliedCoupon.code} Applied
                    </p>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                      {appliedCoupon.type === "percent"
                        ? `${appliedCoupon.value}% off subtotal`
                        : appliedCoupon.freeShipping
                        ? "Free shipping unlocked"
                        : `${formatPrice(appliedCoupon.value)} off subtotal`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="mt-4 space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="h-10 text-sm uppercase"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={validatingPromo || !promoInput.trim()}
                    className="h-10 px-4 shrink-0 font-medium"
                  >
                    {validatingPromo ? "..." : "Apply"}
                  </Button>
                </div>
                {promoError && (
                  <p className="text-[11px] text-destructive">{promoError}</p>
                )}
              </form>
            )}

            <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
              <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span>🇪🇬</span> Made & shipped from Cairo, Egypt
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                <Truck className="h-3 w-3" /> Free returns within 14 days nationwide
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                <Lock className="h-3 w-3" /> SSL encrypted · Paymob secured
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
