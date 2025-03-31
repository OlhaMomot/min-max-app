import React, { useCallback, useEffect, useState } from "react";
import { json, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Link,
  InlineStack,
  IndexTable,
  useIndexResourceState,
  useBreakpoints,
  Filters,
  FormLayout,
  TextField,
} from "@shopify/polaris";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from '../db.server';

export const loader = async ({ request }) => {
  const auth = await authenticate.admin(request);
  const shop = auth.session.shop;

  const productsData = await db.product.findMany({
    where: {
      shop: shop,
    },
  });

  return json({ productsData, shop });
};

// export const action = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);

//   return null;
// };

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const app_url = "https://enrolled-pharmacies-constructed-comment.trycloudflare.com";
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const data = useLoaderData();
  const [products, setProducts] = useState(data?.productsData) || [];
  const [modalValues, setModalValues] = useState({});
  const [formState, setFormState] = useState({});

  const shop = data?.shop || '';

  // PRODUCT MODALS
  const openProductModal = (id, min, max, e) => {
    e.preventDefault();
    e.stopPropagation();

    setModalValues((prev) => ({
      ...prev,
      [id]: { min: min, max: max },
    }));

    shopify.modal.show(`modal-${id}`);
  };

  const handleValueChange = (id, field, value, e) => {
    console.log(`Updating ${field} for ${id}:`, value);
    setModalValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const hideProductModal = (id, e) => {
    e.stopPropagation();
    shopify.modal.hide(id);
  }

    // ADDING PRODUCT
    async function selectProduct() {
      const productsFromShop = await window.shopify.resourcePicker({
        type: "product",
        action: "select", // customized action verb, either 'select' or 'add',
      });

      if (productsFromShop) {
        const { images, id, variants, title, handle } = productsFromShop[0];

        const updatedFormState = {
          ...formState,
          productId: id,
          productVariantId: variants[0].id,
          productTitle: title,
          productHandle: handle,
          productAlt: images[0]?.altText,
          productImage: images[0]?.originalSrc,
        };

        setFormState(updatedFormState);

        try {
          const formdata = new FormData();
          formdata.append("productId", id);
          formdata.append("shop", shop);
          formdata.append("_action", "CREATE");
          formdata.append("title", title);

          const requestOptions = {
            method: "POST",
            body: formdata,
            redirect: "follow"
          };

          const addProductResponse = await fetch(app_url + "/api/products", requestOptions);

          if (!addProductResponse.ok) {
            throw new Error("Failed to add product");
          }

          const response = await fetch(app_url + `/api/products?shop=${shop}`);
          const result = await response.json();

          console.log("Updated products list:", result.data);

          const newProducts = result.data;
          setProducts(newProducts);
        } catch (error) {
          console.error("Error:", error);
        }
      }
    }

    // DELETING PRODUCT
    async function deleteSeclectedProducts() {
      selectedResources.forEach(async(id) => {
        try {
          const formdata = new FormData();
          formdata.append("productId", id);
          formdata.append("shop", shop);
          formdata.append("_action", "DELETE");

          const requestOptions = {
            method: "DELETE",
            body: formdata,
            redirect: "follow"
          };

            const deleteProductResponse = await fetch(app_url + "/api/products", requestOptions);

            if (!deleteProductResponse.ok) {
              throw new Error("Failed to delete product");
            }

            const response = await fetch(app_url + `/api/products?shop=${shop}`);
            const result = await response.json();

            console.log("Updated products list:", result.data);

            setProducts(result.data);
            handleSelectionChange();
        } catch (error) {
          console.error("Error:", error);
        }
      })
    }

    // UPDATING PRODUCT
    async function updateProduct(id, e) {
      e.stopPropagation();
      const { min, max } = modalValues[id] || {};
      try {
        const formdata = new FormData();
        formdata.append("productId", id);
        formdata.append("shop", shop);
        formdata.append("min", min);
        formdata.append("max", max);
        formdata.append("_action", "UPDATE");

        const requestOptions = {
          method: "POST",
          body: formdata,
          redirect: "follow"
        };

        const addProductResponse = await fetch(app_url + "/api/products", requestOptions);

        if (!addProductResponse.ok) {
          throw new Error("Failed to add product");
        }

        const response = await fetch(app_url + `/api/products?shop=${shop}`);
        const result = await response.json();

        console.log("Updated products list:", result.data);

        const newProducts = result.data;
        setProducts(newProducts);
        hideProductModal(`modal-${id}`, e);
      } catch (error) {
        console.error("Error:", error);
      }
    }

    // SEARCH
    const [queryValue, setQueryValue] = useState('');

    const handleFiltersQueryChange = useCallback(
      (value) => setQueryValue(value),
      [],
    );

    const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);

    const resourceName = {
      singular: 'product',
      plural: 'products',
    };

    const {selectedResources, allResourcesSelected, handleSelectionChange} =
      useIndexResourceState(products);

    const filteredProducts = products.filter((product) =>
      product.title.toLowerCase().includes(queryValue.toLowerCase())
    );

    const rowMarkup = filteredProducts.map(
      ({productId, title, min, max}, index) => {
        const productNumberId = productId.split("/").pop();
        const shopHandle = shop.split('.').shift();
        const productUrl = `https://admin.shopify.com/store/${shopHandle}/products/${productNumberId}`;

        return (
            <IndexTable.Row
              id={productId}
              key={productId}
              selected={selectedResources.includes(productId)}
              position={index}
            >
              <IndexTable.Cell>
                <Link
                  dataPrimaryLink
                  url={productUrl}
                  target="_parent"
                >
                  <Text fontWeight="bold" as="span">
                    {title}
                  </Text>
                </Link>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" numeric>
                  {min}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" numeric>
                  {max}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Button onClick={(e) => openProductModal(productId, min, max, e)}>Edit</Button>

              </IndexTable.Cell>
            </IndexTable.Row>
        )},
    );

  return (
    <Page>
      <TitleBar title="Product management">
      </TitleBar>

      <BlockStack gap="500">
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="500">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      What are product limits?
                    </Text>
                    <Text variant="bodyMd" as="p">
                      Product limits are the minimum and maximum quantity of individual product/variant that your customers may add the their cart.
                      You have two methods to define product limits for each individual item you offer. Add a product or SKU (variant) from a database of
                      your offerings or batch upload by CSV
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>

        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="500">
                  <InlineStack gap="300">
                    <Button loading={isLoading} onClick={selectProduct}>
                      Add Product
                    </Button>

                    <Button onClick={deleteSeclectedProducts} variant="primary" disabled={!selectedResources.length}>
                      Delete
                    </Button>
                  </InlineStack>

                  <BlockStack gap="200">
                    <Card>
                      <Filters
                        queryValue={queryValue}
                        queryPlaceholder="Search items"
                        filters={[]}
                        appliedFilters={[]}
                        onQueryChange={handleFiltersQueryChange}
                        onQueryClear={handleQueryValueRemove}
                        onClearAll={() => {}}
                      />

                      <IndexTable
                        condensed={useBreakpoints().smDown}
                        resourceName={resourceName}
                        itemCount={filteredProducts.length}
                        selectedItemsCount={
                          allResourcesSelected ? 'All' : selectedResources.length
                        }
                        onSelectionChange={handleSelectionChange}
                        headings={[
                          {title: 'Product'},
                          {title: 'Min'},
                          {title: 'Max'},
                          {title: 'Actions'},
                        ]}
                      >
                        {rowMarkup}
                      </IndexTable>
                    </Card>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>

        {filteredProducts.map(
          ({productId, title, min, max}, index) => {
            return (
                <Modal id={`modal-${productId}`} key={`modal-${productId}`}>
                  <div style={{ padding: '10px' }}>
                      <Text as="p">
                        Change Min or Max value for product:
                      </Text>

                      <FormLayout>
                        <FormLayout.Group>
                          <TextField
                            key={`min-${productId}`}
                            type="text"
                            label="Minimum order"
                            value={modalValues[productId]?.min || ""}
                            onChange={(value, e) => handleValueChange(productId, 'min', value, e)}
                            autoComplete="off"
                          />
                          <TextField
                            key={`max-${productId}`}
                            type="text"
                            label="Maximum order"
                            value={modalValues[productId]?.max || ""}
                            onChange={(value, e) => handleValueChange(productId, 'max', value, e)}
                            autoComplete="off"
                          />
                        </FormLayout.Group>
                      </FormLayout>
                  </div>

                  <ui-title-bar title={title}>
                    <button variant="primary" onClick={(e) => updateProduct(productId, e)}>Update</button>
                    <button onClick={(e) => hideProductModal(`modal-${productId}`, e)}>Cancel</button>
                  </ui-title-bar>
                </Modal>
            )
          }
        )}
      </BlockStack>
    </Page>
  );
}
