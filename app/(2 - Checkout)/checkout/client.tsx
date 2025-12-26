"use client";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/lib/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { CreateCheckoutSession } from "./server";
import { loadStripe } from "@stripe/stripe-js";
import { stripe } from "@/lib/stripe/stripe";

const checkoutSchema = z.object({
    name: z.string().min(2, { message: "Name required." }),
    email_address: z.email(),
    phone_number: z.string().min(2, { message: "Phone number required." }), // TODO: Replace with phone number validation
    shipping_address: z
        .string()
        .min(2, { message: "Shipping address required." }),
    shipping_city: z.string().min(2, { message: "Shipping address required." }), // TODO: Replace with separate city, state, zip fields?
    billing_address: z.string().optional(),
    billing_city: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm({
    product,
    quantity,
}: {
    product: Product;
    quantity: number;
}) {
    const form = useForm<z.infer<typeof checkoutSchema>>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            name: "",
            email_address: "",
            phone_number: "",
            shipping_address: "",
            shipping_city: "",
            billing_address: "",
            billing_city: "",
        },
    });

    const onSubmit = async (values: CheckoutFormValues) => {
        // console.log(
        //     "Form data is valid. Proceeding to checkout session generation..."
        // );

        if (product.price && product.service_fee && quantity) {
            const calculateOrderAmount =
                (product.price + product.service_fee) * quantity * 100;
            // const clientSecret = await CreateCheckoutSession(calculateOrderAmount);
            // const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!)
            const result = await CreateCheckoutSession(
                calculateOrderAmount,
                product,
                quantity,
                window.location.origin
            );

            if (result.url) {
                window.location.replace(result.url);
            } else {
                console.error("Failed to get checkout URL");
            }
        }
    };

    // useEffect(() => {
    //     if (product.price && product.service_fee && quantity) {
    //         const calculateOrderAmount =
    //             (product.price + product.service_fee) * quantity * 100;
    //         LookForCheckoutSession(calculateOrderAmount);
    //     }
    // }, []);

    return (
        <Form {...form}>
            <form
                id="checkoutForm"
                onSubmit={form.handleSubmit(onSubmit)}
                className={`flex flex-col gap-4`}>
                <div>
                    <Label>Full Name</Label>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        className="border-accent"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div>
                    <Label>Email Address</Label>
                    <FormField
                        control={form.control}
                        name="email_address"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        className="border-accent"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div>
                    <Label>Phone Number</Label>
                    <FormField
                        control={form.control}
                        name="phone_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        className="border-accent"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex flex-col gap-2 border border-accent rounded p-4 md:p-6">
                    <h1 className="text-xl">Shipping Address</h1>
                    <div>
                        <Label>Street Address</Label>
                        <FormField
                            control={form.control}
                            name="shipping_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            className="border-accent"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div>
                        <Label>City, State, & Zip</Label>
                        <FormField
                            control={form.control}
                            name="shipping_city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            className="border-accent"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-2 border border-accent rounded p-4 md:p-6">
                    <div>
                        <h1 className="text-xl">Billing Address</h1>
                        <p className="p-0 text-xs">
                            If different from shipping address
                        </p>
                    </div>
                    <div>
                        <Label>Street Address</Label>
                        <FormField
                            control={form.control}
                            name="billing_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            className="border-accent"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div>
                        <Label>City, State, & Zip</Label>
                        <FormField
                            control={form.control}
                            name="billing_city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            className="border-accent"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </form>
        </Form>
    );
}
