"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { addItemToCart } from "./server";
import { ProductWidget } from "./page";

type AddToCartProps = {
    eventId: number;
    product: ProductWidget;
    // eventProductId: number;
    // productId: number;
};

// export function AddToCart({
//     eventId,
//     product,
// }: // eventProductId,
// // productId,
// AddToCartProps) {
//     const [quantity, setQuantity] = useState<number>(1);

//     // TODO: Set max ticket count
//     return (
//         // <div className="bg-accent w-full h-12 flex justify-center items-center">
//         //     <div className={`flex w-full px-2`}>
//         //         <div className={`rounded bg-white flex flex-between`}>
//         //             <div className={`flex gap-2`}>
//         //                 <Button
//         //                     variant="ghost"
//         //                     onClick={() =>
//         //                         setQuantity((q) => Math.max(1, q - 1))
//         //                     }
//         //                     className="text-black/50 hover:bg-transparent hover:text-black text-2xl">
//         //                     -
//         //                 </Button>
//         //                 {/* TODO: Fix deletion glitch when typing into input */}
//         //                 <Input
//         //                     type="number"
//         //                     value={quantity}
//         //                     onChange={(e) =>
//         //                         setQuantity(Math.max(1, Number(e.target.value)))
//         //                     }
//         //                     className="w-full text-xl font-heading text-black text-center border-none shadow-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"></Input>
//         //                 <Button
//         //                     variant="ghost"
//         //                     onClick={() =>
//         //                         setQuantity((q) => Math.max(1, q + 1))
//         //                     }
//         //                     className="text-black/50 hover:bg-transparent hover:text-black text-2xl">
//         //                     +
//         //                 </Button>
//         //             </div>
//         //         </div>
//         //         <button className="text-background w-1/2 flex items-center">
//         //             <h1 className="font-heading text-2xl pl-8 text-foreground">
//         //                 Add To Cart
//         //             </h1>
//         //         </button>
//         //     </div>
//         // </div>

//         <form action={addItemToCart}>
//             <input type="hidden" name="eventId" value={eventId} />
//             <input type="hidden" name="eventProductId" value={product.id} />
//             <input type="hidden" name="productId" value={product.product.id} />

//             <div className="bg-accent w-full h-12 flex justify-center items-center">
//                 <div className={`flex w-full px-2`}>
//                     <div className={`rounded bg-white flex flex-between`}>
//                         <div className={`flex gap-2`}>
//                             <Button
//                                 type="button"
//                                 variant="ghost"
//                                 onClick={() =>
//                                     setQuantity((q) => Math.max(1, q - 1))
//                                 }
//                                 className="text-black/50 hover:bg-transparent hover:text-black text-2xl">
//                                 -
//                             </Button>
//                             <Input
//                                 type="number"
//                                 name="quantity"
//                                 value={quantity}
//                                 onChange={(e) =>
//                                     setQuantity(
//                                         Math.max(1, Number(e.target.value))
//                                     )
//                                 }
//                                 className="w-full text-xl font-heading text-black text-center border-none shadow-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"></Input>
//                             {/* TODO: Tooltip showing the user is at the ticket cap */}
//                             <Button
//                                 type="button"
//                                 variant="ghost"
//                                 onClick={() =>
//                                     setQuantity((q) => Math.max(1, q + 1))
//                                 }
//                                 className="text-black/50 hover:bg-transparent hover:text-black text-2xl"
//                                 disabled={
//                                     quantity >= product.quantity_remaining
//                                 }>
//                                 +
//                             </Button>
//                         </div>
//                     </div>
//                     {/* TODO: Submission loading state */}
//                     <button
//                         type="submit"
//                         // disabled={pending}
//                         className="text-background w-1/2 flex items-center">
//                         <h1 className="font-heading text-2xl pl-8 text-foreground">
//                             Add To Cart
//                         </h1>
//                     </button>
//                 </div>
//             </div>
//         </form>
//     );
// }

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AddToCart({ eventId, product }: AddToCartProps) {
    const [quantity, setQuantity] = useState<number>(1);
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(addItemToCart, null);

    useEffect(() => {
        // This only triggers if the server returned an error object
        if (state?.error) {
            toast.error(state.error);
        }
        // This only triggers if the server confirmed the tickets were created
        if (state?.success) {
            router.push("/checkout");
        }
    }, [state, router]);

    // TODO: Fix awkward responsiveness @ ~822px wide

    return (
        <form action={formAction}>
            {/* Hidden Inputs */}
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="eventProductId" value={product.id} />
            <input type="hidden" name="productId" value={product.product.id} />
            <input type="hidden" name="quantity" value={quantity} />

            <div className="bg-accent w-full md:h-12 flex justify-center items-center">
                <div className="flex flex-col md:flex-row pt-2 md:pt-0 w-full px-2">
                    {product.quantity_remaining > 0 ? (
                        <div className="flex flex-col md:flex-row gap-2 md:gap-8">
                            <div className="rounded bg-white flex">
                                <div className="w-full md:w-64 flex justify-between gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            setQuantity((q) =>
                                                Math.max(1, q - 1)
                                            )
                                        }
                                        className="text-black/50 hover:bg-transparent hover:text-black text-2xl">
                                        -
                                    </Button>
                                    <p className="flex items-center justify-center font-semibold text-black">
                                        {quantity}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            setQuantity((q) => q + 1)
                                        }
                                        // Frontend check for a better UX
                                        disabled={
                                            quantity >=
                                            product.quantity_remaining
                                        }
                                        className="text-black/50 hover:bg-transparent hover:text-black text-2xl">
                                        +
                                    </Button>
                                </div>
                            </div>

                            <div
                                className={`w-full flex items-center justify-center pb-1 md:pb-0`}>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="text-background flex items-center disabled:opacity-50">
                                    <h1 className="font-heading text-2xl text-foreground">
                                        {isPending
                                            ? "Checking..."
                                            : "Add To Cart"}
                                    </h1>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex justify-center items-center">
                            <h3 className="pt-1 font-heading text-3xl">
                                Sold Out
                            </h3>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
