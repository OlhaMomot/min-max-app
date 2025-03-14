import {json} from '@remix-run/node';
import db from '../db.server';
import { cors } from 'remix-utils/cors';


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
      })

      response = json({ message: "Product added", method: "POST", product: product });
      return cors(request, response);

    case "DELETE":
        await db.product.deleteMany({
          where: {
            productId: productId
          },
        });

        response = json({ message: "Product removed", method: method });
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

        response = json({ message: "Product updated", method: "POST" });
        return cors(request, response);

    default:
        // Optional: handle other methods or return a method not allowed response
        return new Response("Method Not Allowed", { status: 405 });
  }
}
