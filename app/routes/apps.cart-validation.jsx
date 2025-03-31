import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const shop = url.searchParams.get("shop");

        console.log('APPS/CART-VALIDATION HERE!');
        if (!shop) {
            return json({ error: "Missing shop parameter" }, { status: 400 });
        }

        // Fetch the current cart data with validation errors
        const cartResponse = await fetch(`https://${shop}/cart.js`);
        const cart = await cartResponse.json();

        // Extract errors from Shopify Function Extension
        let errors = cart.attributes?._cart_validation_errors || [];
        console.log("CART ERORRS:", errors);

        return json({ errors, disableCheckout: errors.length > 0 });
    } catch (error) {
        console.error("Cart validation error:", error);
        return json({ error: "Failed to validate cart" }, { status: 500 });
    }
};
