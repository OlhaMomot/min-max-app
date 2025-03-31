// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */

export function run(input) {
  const errors = input.cart.lines
    .filter(({ quantity, merchandise }) => {
      if (merchandise.__typename !== "ProductVariant" || !merchandise.product) return false;

      const min = merchandise.product?.minValue?.value ? parseInt(merchandise.product.minValue.value, 10) : 1;
      const max = merchandise.product?.maxValue?.value ? parseInt(merchandise.product.maxValue.value, 10) : 1000;

      return quantity < min || quantity > max;
    })
    .map(({ merchandise }) => ({
            localizedMessage: `Not possible to order less than ${merchandise.product?.minValue.value} or more than ${merchandise.product?.maxValue.value} of ${merchandise.product?.title} product`,
            target: "$.cart",
    }))

  return {
    errors,
  };
}
