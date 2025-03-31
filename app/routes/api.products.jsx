import {json} from '@remix-run/node';
import db from '../db.server';
import { cors } from 'remix-utils/cors';
import { authenticate } from "../shopify.server";


export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if(!shop) {
    return json({
      message: "Missing data. Required data: shop",
      method: "GET"
    });
  }

  const product = await db.product.findMany({
    where: {
      shop: shop,
    },
  });

  const response = json({
    ok: true,
    message: "Success",
    data: product,
  });

  return cors(request, response);
}

export async function action({ request }) {
  const method = request.method;
  let data = await request.formData();
  data = Object.fromEntries(data);
  const productId = data.productId;
  const shop = data.shop;
  const title = data.title;
  const _action = data._action;
  const min = data.min;
  const max = data.max;

  const productNumberId = productId.split("/").pop();
  const auth = await authenticate.admin(request);
  const token = auth.session.accessToken;

  // if (!productId || !shop) {
  //   return json({
  //     message: 'Missing data',
  //     method: method,
  //   })
  // }

  let response;

  switch (_action) {
    case 'CREATE':
      const product = await db.product.create({
        data: {
          productId,
          shop,
          title,
          min: '0',
          max: '0'
        }
      });
      const metafields = [
        {
          namespace: "custom",
          key: "min_value",
          value: "0",
          type: "integer",
          owner_id: productNumberId,
          owner_resource: "product",
          access: {
            storefront: "PUBLIC_READ",
          }
        },
        {
          namespace: "custom",
          key: "max_value",
          value: "0",
          type: "integer",
          owner_id: productNumberId,
          owner_resource: "product",
          access: {
            storefront: "PUBLIC_READ",
          }
        }
      ];

      // Shopify API request to add metafields
      await fetch(`https://${shop}/admin/api/2023-01/products/${productNumberId}/metafields.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ metafield: metafields[0] })
      });

      await fetch(`https://${shop}/admin/api/2023-01/products/${productNumberId}/metafields.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ metafield: metafields[1] })
      });

      response = json({ message: "Product added with metafields", method: "POST", product });
      return cors(request, response);

    case "DELETE":
      // Delete the product from database
      await db.product.deleteMany({
        where: {
          productId: productId
        },
      });

      // Fetch metafields for the product
      const metafieldsResponse = await fetch(`https://${shop}/admin/api/2023-01/products/${productNumberId}/metafields.json`, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
      });

      if (metafieldsResponse.ok) {
        const metafieldsData = await metafieldsResponse.json();
        const metafields = metafieldsData.metafields.filter(metafield =>
          metafield.namespace === "custom" && ["min_value", "max_value"].includes(metafield.key)
        );

        // Delete each metafield
        for (const metafield of metafields) {
          await fetch(`https://${shop}/admin/api/2023-01/products/${productNumberId}/metafields/${metafield.id}.json`, {
            method: "DELETE",
            headers: {
              "X-Shopify-Access-Token": token,
              "Content-Type": "application/json",
            },
          }).then(response => {
            if (!response.ok) {
              console.error(`Failed to delete metafield ${metafield.key}`, response.statusText);
            }
          });
        }
      } else {
        console.error("Failed to fetch metafields", await metafieldsResponse.text());
      }

      response = json({ message: "Product and associated metafields removed", method: method });
      return cors(request, response);

    case "UPDATE":
        await db.product.updateMany({
          where: {
            productId: productId,
          },
          data: {
            min: min,
            max: max,
          },
        });

      const metafieldData = [
        {
          namespace: "custom",
          key: "min_value",
          value: min,
          type: "integer",
          owner_resource: "product",
        },
        {
          namespace: "custom",
          key: "max_value",
          value: max,
          type: "integer",
          owner_resource: "product",
        },
      ];

      for (const metafield of metafieldData) {
        const myHeaders = new Headers();
        myHeaders.append("X-Shopify-Access-Token", token);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Cookie", "request_method=POST");

        const raw = JSON.stringify({
          metafield,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        fetch(`https://${shop}/admin/api/2023-01/products/${productNumberId}/metafields.json`, requestOptions)
          .then((response) => response.text())
          .then((result) => console.log(result))
          .catch((error) => console.error(error));
      }

      response = json({ message: "Product updated and metafields updated", method: "POST" });
      return cors(request, response);

    default:
        // Optional: handle other methods or return a method not allowed response
        return new Response("Method Not Allowed", { status: 405 });
  }
}
