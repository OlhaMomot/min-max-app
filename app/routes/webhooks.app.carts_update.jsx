import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log(`!!!!!!!!!!!!Received ${topic} webhook for ${shop}`)

  try {
    // Extract line items from cart
    const cartItems = payload?.line_items || [];

    if (!cartItems.length) {
      console.log("Cart is empty, skipping validation.");
      return new Response("No items in cart", { status: 200 });
    }

    // Fetch product limits from the database
    const productTitles = cartItems.map((item) => item.title);
    console.log(productTitles);

    const productLimits = await db.product.findMany({
      where: { title: { in: productTitles } },
    });
    console.log(productLimits);

    let checkoutBlocked = false;
    let message = "";

    // Check product limits
    cartItems.forEach((item) => {
      const productLimit = productLimits.find((p) => p.title === item.title);
      if (productLimit) {
        if (
          (productLimit.min && item.quantity < Number(productLimit.min)) ||
          (productLimit.max && item.quantity > Number(productLimit.max))
        ) {
          checkoutBlocked = true;
          message = `Product ${item.title} has a limit of ${productLimit.min} - ${productLimit.max} units.`;
          console.log(message);
        }
      }
    });

    if (checkoutBlocked) {
      console.log('Checkout blocked!!!!!!!!!!');
      return new Response(JSON.stringify({ checkoutBlocked, message }), { status: 200 });
    }

    return new Response("Cart validated successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing cart update webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
