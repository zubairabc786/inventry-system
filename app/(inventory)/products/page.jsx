"use client";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../../action/action";
import { useRef, useState, useEffect } from "react";

export default function ProductManagement() {
  const formRef = useRef(null);
  const [price, setPrice] = useState(0);
  const [message, setMessage] = useState("");
  const [nextProductCode, setNextProductCode] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handlePriceCalculation = () => {
    const form = formRef.current;
    if (!form) return;

    const purchasePrice = parseFloat(form.purchase_price.value) || 0;
    const profitPercent = parseFloat(form.prophit_percent.value) || 0;
    const calculatedPrice =
      purchasePrice + (purchasePrice * profitPercent) / 100;
    setPrice(calculatedPrice.toFixed(2));
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const inputs = [form.purchase_price, form.prophit_percent];
    inputs.forEach((input) => {
      input.addEventListener("input", handlePriceCalculation);
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("input", handlePriceCalculation);
      });
    };
  }, []);

  const handleSubmit = async (formData) => {
    if (editingProduct) {
      // Update existing product
      formData.append("product_code", editingProduct.product_code);
      const { success, message } = await updateProduct(formData);
      if (success) {
        setMessage(`✅ ${message}`);

        // Refresh product list
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);
        setEditingProduct(null);

        setTimeout(() => {
          setMessage("");
        }, 3000);
        formRef.current?.reset();
        setPrice(0);
      }
    } else {
      // Create new product
      const { success, newCode, nextProductCode } = await createProduct(
        formData
      );
      if (success) {
        setMessage(`✅ Product saved successfully! ${newCode}`);
        setNextProductCode(`Next Product Code is sku:${nextProductCode}`);

        // Refresh product list
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);

        setTimeout(() => {
          setMessage("");
          setNextProductCode("");
        }, 3000);
        formRef.current?.reset();
        setPrice(0);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setPrice(product.price);

    // Set form values
    const form = formRef.current;
    if (form) {
      form.product_name.value = product.product_name;
      form.product_type.value = product.product_type;
      form.purchase_price.value = product.purchase_price;
      form.prophit_percent.value = product.prophit_percent;
      form.price.value = product.price;
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    formRef.current?.reset();
    setPrice(0);
  };

  const handleDelete = async (productCode) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { success, message } = await deleteProduct(productCode);
      if (success) {
        setMessage(`✅ ${message}`);

        // Refresh product list
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);

        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Product Management
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Form Section */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>

            {message && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                {message}
              </div>
            )}

            {!editingProduct && nextProductCode && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
                {nextProductCode}
              </div>
            )}

            <form
              ref={formRef}
              id="product-form"
              action={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="product_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="product_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Type (Unit)
                </label>
                <input
                  type="text"
                  id="product_type"
                  name="product_type"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="purchase_price"
                    name="purchase_price"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profit Percent
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="prophit_percent"
                    name="prophit_percent"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="price"
                  name="price"
                  value={price}
                  readOnly
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>

                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-3 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Product List Section */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-700">
                Product List
              </h2>
            </div>

            {isLoading ? (
              <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No products found. Add your first product!
              </div>
            ) : (
              <div className="h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Profit Percent
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr
                        key={product.product_code}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {product.product_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.prophit_percent}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            ${product.price}
                          </div>
                          <div className="text-xs text-gray-500">
                            Cost: ${product.purchase_price}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.product_code)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a5b4fc;
        }
      `}</style>
    </div>
  );
}
