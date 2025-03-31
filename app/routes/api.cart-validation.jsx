import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// export const action = async ({ request }) => {
//   const shopifyStorefrontApiUrl = "https://helga-app-testing.myshopify.com/admin/api/2023-01/graphql.json";
//   const shopifyStorefrontApiToken = "shpua_e78e04a9195f148099b6390768106523";

//   try {
//     const cartData = await request.json();
//     const errors = [];
//     const productLimits = {};

//     // Extract product IDs from cart items
//     const productIds = cartData.items.map(item => `gid://shopify/Product/${item.product_id}`);

//     // GraphQL query to get metafields for min and max quantity
//     const query = `
//       {
//         nodes(ids: [${productIds.map(id => `"${id}"`).join(", ")}]) {
//           ... on Product {
//             id
//             title
//             minValue: metafield(namespace: "custom", key: "min_value") {
//               value
//             }
//             maxValue: metafield(namespace: "custom", key: "max_value") {
//               value
//             }
//           }
//         }
//       }
//     `;

//     // Fetch product metafields
//     const response = await fetch(shopifyStorefrontApiUrl, {
//       method: "POST",
//       headers: {
//         "X-Shopify-Access-Token": shopifyStorefrontApiToken,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ query })
//     });

//     const metafieldData = await response.json();

//     // Store min and max quantity properly
//     const metafieldMap = metafieldData.data.nodes.reduce((acc, product) => {
//       acc[product.id] = {
//         minQuantity: product.minValue?.value ? parseInt(product.minValue.value, 10) : 1, // Default to 1
//         maxQuantity: product.maxValue?.value ? parseInt(product.maxValue.value, 10) : null, // No default
//       };

//       productLimits[product.id] = { minQuantity, maxQuantity };
//       return acc;
//     }, {});

//     // Validate cart items
//     cartData.items.forEach((item) => {
//       const productGID = `gid://shopify/Product/${item.product_id}`;
//       const { minQuantity, maxQuantity } = metafieldMap[productGID] || { minQuantity: 1, maxQuantity: null };

//       console.log('HERE!!!!', minQuantity, maxQuantity);
//       if (item.quantity < minQuantity) {
//         errors.push(`Minimum quantity for ${item.product_title} is ${minQuantity}`);
//       }
//       if (maxQuantity !== null && item.quantity > maxQuantity) {
//         errors.push(`Maximum quantity for ${item.product_title} is ${maxQuantity}`);
//       }
//     });

//     return json({
//       success: errors.length === 0,
//       errors,
//       productLimits
//     }, { status: errors.length > 0 ? 400 : 200 });
//   } catch (error) {
//     console.error("Cart validation error:", error);
//     return json({ errors: [{ localizedMessage: "Cart validation failed." }] }, { status: 500 });
//   }
// };

export const action = async ({ request }) => {
  const shopifyStorefrontApiUrl = "https://helga-app-testing.myshopify.com/admin/api/2023-01/graphql.json";
  const shopifyStorefrontApiToken = "shpua_e78e04a9195f148099b6390768106523";

  try {
    const cartData = await request.json();
    const errors = [];
    const productLimits = {}; // Store min/max values

    // Extract product IDs from cart items
    const productIds = cartData.items.map(item => `gid://shopify/Product/${item.product_id}`);

    // GraphQL query to get metafields for min and max quantity
    const query = `
      {
        nodes(ids: [${productIds.map(id => `"${id}"`).join(", ")}]) {
          ... on Product {
            id
            title
            minValue: metafield(namespace: "custom", key: "min_value") {
              value
            }
            maxValue: metafield(namespace: "custom", key: "max_value") {
              value
            }
          }
        }
      }
    `;

    // Fetch product metafields
    const response = await fetch(shopifyStorefrontApiUrl, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": shopifyStorefrontApiToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    const metafieldData = await response.json();

    // Store min and max quantity properly
    metafieldData.data.nodes.forEach(product => {
      const minQuantity = product.minValue?.value ? parseInt(product.minValue.value, 10) : 1; // Default to 1
      const maxQuantity = product.maxValue?.value ? parseInt(product.maxValue.value, 10) : null; // No default

      productLimits[product.id] = { minQuantity, maxQuantity };
    });

    // Validate cart items
    cartData.items.forEach((item) => {
      const productGID = `gid://shopify/Product/${item.product_id}`;
      const { minQuantity, maxQuantity } = productLimits[productGID] || { minQuantity: 1, maxQuantity: null };

      if (item.quantity < minQuantity) {
        errors.push(`Minimum quantity for ${item.product_title} is ${minQuantity}`);
      }
      if (maxQuantity !== null && item.quantity > maxQuantity) {
        errors.push(`Maximum quantity for ${item.product_title} is ${maxQuantity}`);
      }
    });

    // Return validation errors + min/max values
    return json({
      success: errors.length === 0,
      errors,
      productLimits
    }, { status: errors.length > 0 ? 400 : 200 });

  } catch (error) {
    console.error("Cart validation error:", error);
    return json({ errors: [{ localizedMessage: "Cart validation failed." }] }, { status: 500 });
  }
};
