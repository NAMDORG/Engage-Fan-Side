"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "@/lib/types/supabase";
import { CartItem } from "@/app/(1 - Event)/event/server";
import { CreatePaymentIntent, UpdateDatabase } from "./server";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const checkoutSchema = z
    .object({
        name: z.string().min(2, "Name required."),
        email_address: z.email("Invalid email."),
        phone_number: z.string().min(2, "Phone required."),
        shipping_address: z.string().min(2, "Address required."),
        shipping_city: z.string().min(2, "City/State/Zip required."),
        billingSameAsShipping: z.boolean(),
        billing_address: z.string().optional(),
        billing_city: z.string().optional(),
        item_sizes: z.array(z.string()).optional(),
    })
    .refine(
        (data) => {
            if (!data.billingSameAsShipping) {
                return !!data.billing_address && !!data.billing_city;
            }
            return true;
        },
        {
            message: "Billing details required",
            path: ["billing_address"],
        }
    );

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm({
    product,
    cart,
}: {
    product: Product;
    cart: CartItem;
}) {
    const [step, setStep] = useState<"info" | "payment">("info");
    const [clientSecret, setClientSecret] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            name: "",
            email_address: "",
            phone_number: "",
            shipping_address: "",
            shipping_city: "",
            billingSameAsShipping: true,
            billing_address: "",
            billing_city: "",
            item_sizes: Array(cart.quantity).fill("MD"),
        },
    });

    const billingSameAsShipping = form.watch("billingSameAsShipping");

    const onInfoSubmit = async (values: CheckoutFormValues) => {
        setIsSubmitting(true);
        if (product.price && product.service_fee) {
            try {
                const amount =
                    (product.price + product.service_fee) * cart.quantity * 100;
                const { clientSecret, paymentIntentId } =
                    await CreatePaymentIntent(amount, product);

                const submissionValues = {
                    ...values,
                    billing_address: values.billingSameAsShipping
                        ? values.shipping_address
                        : values.billing_address,
                    billing_city: values.billingSameAsShipping
                        ? values.shipping_city
                        : values.billing_city,
                };

                await UpdateDatabase(
                    submissionValues,
                    amount,
                    cart,
                    paymentIntentId
                );

                setClientSecret(clientSecret!);
                setStep("payment");
            } catch (error) {
                console.error("Setup failed:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {step === "info" ? (
                    <motion.div
                        key="info"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onInfoSubmit)}
                                className="flex flex-col gap-4">
                                <h2 className="text-xl font-bold uppercase text-accent">
                                    Item Size(s)
                                </h2>
                                {product.requires_size &&
                                    Array.from(
                                        { length: cart.quantity },
                                        (_, index) => (
                                            <FormField
                                                key={index}
                                                control={form.control}
                                                name={`item_sizes.${index}`} // Use dot notation for array index
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label>
                                                            T-Shirt Size for
                                                            Package {index + 1}
                                                        </Label>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {[
                                                                    "SM",
                                                                    "MD",
                                                                    "LG",
                                                                    "XL",
                                                                    "2XL",
                                                                    "3XL",
                                                                ].map((s) => (
                                                                    <SelectItem
                                                                        key={s}
                                                                        value={
                                                                            s
                                                                        }>
                                                                        {s}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )
                                    )}
                                <h2 className="text-xl font-bold uppercase text-accent">
                                    Contact Information
                                </h2>
                                <div className="grid gap-4">
                                    <CustomField
                                        form={form}
                                        name="name"
                                        label="Full Name"
                                    />
                                    <CustomField
                                        form={form}
                                        name="email_address"
                                        label="Email Address"
                                    />
                                    <CustomField
                                        form={form}
                                        name="phone_number"
                                        label="Phone Number"
                                    />
                                </div>

                                <div className="border border-accent/20 rounded-md p-4 space-y-4">
                                    <h2 className="text-lg font-bold uppercase">
                                        Shipping Address
                                    </h2>
                                    <CustomField
                                        form={form}
                                        name="shipping_address"
                                        label="Street Address"
                                    />
                                    <CustomField
                                        form={form}
                                        name="shipping_city"
                                        label="City, State, & Zip"
                                    />
                                </div>

                                <div className="flex items-center space-x-2 py-2">
                                    <FormField
                                        control={form.control}
                                        name="billingSameAsShipping"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <Label>
                                                        Billing address is the
                                                        same as shipping
                                                    </Label>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <AnimatePresence>
                                    {!billingSameAsShipping && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden">
                                            <div className="border border-accent/20 rounded-md p-4 space-y-4 mb-4">
                                                <h2 className="text-lg font-bold uppercase text-accent">
                                                    Billing Address
                                                </h2>
                                                <CustomField
                                                    form={form}
                                                    name="billing_address"
                                                    label="Street Address"
                                                />
                                                <CustomField
                                                    form={form}
                                                    name="billing_city"
                                                    label="City, State, & Zip"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-6 text-xl">
                                    {isSubmitting
                                        ? "Saving..."
                                        : "Continue to Payment"}
                                </Button>
                            </form>
                        </Form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="payment"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 0.4,
                            type: "spring",
                            damping: 25,
                        }}
                        className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold uppercase text-accent">
                                Payment Details
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep("info")}>
                                ← Back to Info
                            </Button>
                        </div>

                        {clientSecret && (
                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret,
                                    appearance: { theme: "night" },
                                }}>
                                <StripeEmbeddedForm />
                            </Elements>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CustomField({
    form,
    name,
    label,
}: {
    form: any;
    name: string;
    label: string;
}) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <Label>{label}</Label>
                    <FormControl>
                        <Input className="border-accent" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function StripeEmbeddedForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/success` },
        });
        if (error) {
            console.error(error.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleFinalSubmit} className="flex flex-col gap-6">
            <PaymentElement />
            <Button
                disabled={!stripe || loading}
                className="w-full py-8 text-2xl font-bold">
                {loading ? "Processing..." : "Complete Purchase"}
            </Button>
        </form>
    );
}
