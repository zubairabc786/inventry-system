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
  const barcodeInputRef = useRef(null);
  const [price, setPrice] = useState(0);
  const [extPrice, setExtPrice] = useState(0);
  const [message, setMessage] = useState("");
  const [nextProductCode, setNextProductCode] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [scanningMode, setScanningMode] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setMessage("Failed to fetch products");
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Barcode scanning functionality
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only process if we're in scanning mode or barcode input is focused
      if (!scanningMode && document.activeElement !== barcodeInputRef.current) {
        return;
      }

      // Enter key indicates end of barcode scan
      if (e.key === "Enter") {
        e.preventDefault();
        const barcodeValue = barcodeInputRef.current?.value || "";

        if (barcodeValue) {
          setLastScannedBarcode(barcodeValue);

          // Check if barcode already exists
          const existingProduct = products.find(
            (p) => p.bar_code === barcodeValue
          );

          if (existingProduct) {
            // Product exists, fill the form for editing
            handleEdit(existingProduct);
            setMessage(`Product found: ${existingProduct.product_name}`);

            setTimeout(() => {
              setMessage("");
            }, 3000);
          } else {
            // New product, just set the barcode
            setMessage(`New barcode scanned: ${barcodeValue}`);

            setTimeout(() => {
              setMessage("");
            }, 3000);
          }

          // Clear the input after processing
          if (barcodeInputRef.current) {
            barcodeInputRef.current.value = "";
          }
        }
      }
    };

    // Add event listener for barcode scanner (scanners usually send Enter after barcode)
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scanningMode, products]);

  const handlePriceCalculation = () => {
    const form = formRef.current;
    if (!form) return;

    const purchasePrice = parseFloat(form.purchase_price.value) || 0;
    const profitPercent = parseFloat(form.prophit_percent.value) || 0;
    const calculatedPrice =
      purchasePrice + (purchasePrice * profitPercent) / 100;

    setPrice(calculatedPrice.toFixed(2));
    setExtPrice(calculatedPrice.toFixed(2)); // Set ext_price same as price

    // Update the price field value
    if (form.price) {
      form.price.value = calculatedPrice.toFixed(2);
    }
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
  }, [editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (editingProduct) {
      // Update existing product
      formData.append("id", editingProduct.id);
      const result = await updateProduct(formData);
      if (result.success) {
        setMessage(`✅ ${result.message}`);

        // Refresh product list
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);
        setEditingProduct(null);

        setTimeout(() => {
          setMessage("");
        }, 3000);
        formRef.current?.reset();
        setPrice(0);
        setExtPrice(0);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } else {
      // Create new product
      const result = await createProduct(formData);
      if (result.success) {
        setMessage(`✅ Product saved successfully! ${result.newCode}`);
        setNextProductCode(
          `Next Product Code is sku:${result.nextProductCode}`
        );

        // Refresh product list
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);

        setTimeout(() => {
          setMessage("");
          setNextProductCode("");
        }, 3000);
        formRef.current?.reset();
        setPrice(0);
        setExtPrice(0);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setPrice(product.price);
    setExtPrice(product.ext_price);

    // Set form values
    const form = formRef.current;
    if (form) {
      form.product_name.value = product.product_name || "";
      form.product_type.value = product.product_type || "";
      form.purchase_price.value = product.purchase_price || "";
      form.prophit_percent.value = product.prophit_percent || "";
      form.price.value = product.price || "";
      form.bar_code.value = product.bar_code || "";
      form.size.value = product.size || "";
      form.tax.value = product.tax || "";
      form.category.value = product.category || "";
      form.sub_category.value = product.sub_category || "";
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    formRef.current?.reset();
    setPrice(0);
    setExtPrice(0);
  };

  const handleDelete = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const result = await deleteProduct(productId);
      if (result.success) {
        setMessage(`✅ ${result.message}`);

        // Refresh product list
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);

        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    }
  };

  const handleManualBarcodeInput = (value) => {
    setLastScannedBarcode(value);

    // Auto-focus on product name field after barcode is entered
    if (formRef.current?.product_name) {
      formRef.current.product_name.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Product Management
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Form Section */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-700">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>

              {/* Barcode Scanner Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Scanner Mode:</span>
                <button
                  type="button"
                  onClick={() => setScanningMode(!scanningMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    scanningMode ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      scanningMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {scanningMode && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.2 6.5 10.266a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Scanner Mode Active - Scan a barcode or type in the barcode
                  field
                </p>
                {lastScannedBarcode && (
                  <p className="text-xs text-blue-600 mt-1">
                    Last scanned:{" "}
                    <span className="font-mono">{lastScannedBarcode}</span>
                  </p>
                )}
              </div>
            )}

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  message.includes("✅")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
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
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Barcode Input Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="bar_code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Barcode
                  </label>
                  <span className="text-xs text-gray-500">
                    {scanningMode ? "Scan barcode now..." : "Type or scan"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    id="bar_code"
                    name="bar_code"
                    autoComplete="off"
                    onChange={(e) => handleManualBarcodeInput(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${
                      scanningMode
                        ? "border-blue-500 bg-blue-50 animate-pulse"
                        : "border-gray-300"
                    }`}
                    placeholder={
                      scanningMode ? "Ready for scan..." : "Enter barcode"
                    }
                  />
                  {scanningMode && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
                {lastScannedBarcode && !formRef.current?.bar_code?.value && (
                  <p className="text-xs text-gray-500 mt-1">
                    Using scanned barcode:{" "}
                    <span className="font-mono">{lastScannedBarcode}</span>
                  </p>
                )}
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sub_category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sub Category
                  </label>
                  <input
                    type="text"
                    id="sub_category"
                    name="sub_category"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label
                    htmlFor="size"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Size
                  </label>
                  <input
                    type="text"
                    id="size"
                    name="size"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    onChange={handlePriceCalculation}
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
                    onChange={handlePriceCalculation}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extended Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="ext_price"
                    name="ext_price"
                    value={extPrice}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="tax"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tax (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="tax"
                  name="tax"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (barcodeInputRef.current) {
                      barcodeInputRef.current.focus();
                    }
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                >
                  Focus Barcode Field
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formRef.current) {
                      formRef.current.reset();
                      setPrice(0);
                      setExtPrice(0);
                      setLastScannedBarcode("");
                    }
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Clear Form
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product List Section */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-700">
                Product List ({products.length})
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pricing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            SKU: {product.sku}
                          </div>
                          <div className="text-xs text-gray-600">
                            Code: {product.product_code}
                          </div>
                          <div className="text-xs text-gray-600">
                            Type: {product.product_type}
                            {product.size && ` • Size: ${product.size}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-gray-800">
                            {product.bar_code || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {product.category || "N/A"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {product.sub_category || "No sub-category"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            Rs.{product.price}
                          </div>
                          <div className="text-xs text-gray-600">
                            Cost: Rs.{product.purchase_price}
                          </div>
                          <div className="text-xs text-gray-600">
                            Profit: {product.prophit_percent}%
                            {product.tax && ` • Tax: ${product.tax}%`}
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
                            onClick={() => handleDelete(product.id)}
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

// "use client";
// import {
//   createProduct,
//   getProducts,
//   updateProduct,
//   deleteProduct,
// } from "../../action/action";
// import { useRef, useState, useEffect } from "react";

// export default function ProductManagement() {
//   const formRef = useRef(null);
//   const [price, setPrice] = useState(0);
//   const [extPrice, setExtPrice] = useState(0);
//   const [message, setMessage] = useState("");
//   const [nextProductCode, setNextProductCode] = useState("");
//   const [products, setProducts] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [editingProduct, setEditingProduct] = useState(null);

//   // Fetch products on component mount
//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const data = await getProducts();
//         setProducts(data);
//         setIsLoading(false);
//       } catch (error) {
//         console.error("Error fetching products:", error);
//         setMessage("Failed to fetch products");
//         setIsLoading(false);
//       }
//     };
//     fetchProducts();
//   }, []);

//   const handlePriceCalculation = () => {
//     const form = formRef.current;
//     if (!form) return;

//     const purchasePrice = parseFloat(form.purchase_price.value) || 0;
//     const profitPercent = parseFloat(form.prophit_percent.value) || 0;
//     const calculatedPrice =
//       purchasePrice + (purchasePrice * profitPercent) / 100;

//     setPrice(calculatedPrice.toFixed(2));
//     setExtPrice(calculatedPrice.toFixed(2)); // Set ext_price same as price

//     // Update the price field value
//     if (form.price) {
//       form.price.value = calculatedPrice.toFixed(2);
//     }
//   };

//   useEffect(() => {
//     const form = formRef.current;
//     if (!form) return;

//     const inputs = [form.purchase_price, form.prophit_percent];
//     inputs.forEach((input) => {
//       input.addEventListener("input", handlePriceCalculation);
//     });

//     return () => {
//       inputs.forEach((input) => {
//         input.removeEventListener("input", handlePriceCalculation);
//       });
//     };
//   }, [editingProduct]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const formData = new FormData(e.target);

//     if (editingProduct) {
//       // Update existing product
//       formData.append("id", editingProduct.id);
//       const result = await updateProduct(formData);
//       if (result.success) {
//         setMessage(`✅ ${result.message}`);

//         // Refresh product list
//         const updatedProducts = await getProducts();
//         setProducts(updatedProducts);
//         setEditingProduct(null);

//         setTimeout(() => {
//           setMessage("");
//         }, 3000);
//         formRef.current?.reset();
//         setPrice(0);
//         setExtPrice(0);
//       } else {
//         setMessage(`❌ ${result.message}`);
//       }
//     } else {
//       // Create new product
//       const result = await createProduct(formData);
//       if (result.success) {
//         setMessage(`✅ Product saved successfully! ${result.newCode}`);
//         setNextProductCode(
//           `Next Product Code is sku:${result.nextProductCode}`
//         );

//         // Refresh product list
//         const updatedProducts = await getProducts();
//         setProducts(updatedProducts);

//         setTimeout(() => {
//           setMessage("");
//           setNextProductCode("");
//         }, 3000);
//         formRef.current?.reset();
//         setPrice(0);
//         setExtPrice(0);
//       } else {
//         setMessage(`❌ ${result.message}`);
//       }
//     }
//   };

//   const handleEdit = (product) => {
//     setEditingProduct(product);
//     setPrice(product.price);
//     setExtPrice(product.ext_price);

//     // Set form values
//     const form = formRef.current;
//     if (form) {
//       form.product_name.value = product.product_name || "";
//       form.product_type.value = product.product_type || "";
//       form.purchase_price.value = product.purchase_price || "";
//       form.prophit_percent.value = product.prophit_percent || "";
//       form.price.value = product.price || "";
//       form.bar_code.value = product.bar_code || "";
//       form.size.value = product.size || "";
//       form.tax.value = product.tax || "";
//       form.category.value = product.category || "";
//       form.sub_category.value = product.sub_category || "";
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditingProduct(null);
//     formRef.current?.reset();
//     setPrice(0);
//     setExtPrice(0);
//   };

//   const handleDelete = async (productId) => {
//     if (confirm("Are you sure you want to delete this product?")) {
//       const result = await deleteProduct(productId);
//       if (result.success) {
//         setMessage(`✅ ${result.message}`);

//         // Refresh product list
//         const updatedProducts = await getProducts();
//         setProducts(updatedProducts);

//         setTimeout(() => {
//           setMessage("");
//         }, 3000);
//       } else {
//         setMessage(`❌ ${result.message}`);
//       }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <h1 className="text-3xl font-bold text-gray-800 mb-8">
//         Product Management
//       </h1>

//       <div className="flex flex-col lg:flex-row gap-8">
//         {/* Product Form Section */}
//         <div className="lg:w-1/3">
//           <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
//             <h2 className="text-2xl font-semibold text-gray-700 mb-6">
//               {editingProduct ? "Edit Product" : "Add New Product"}
//             </h2>

//             {message && (
//               <div
//                 className={`mb-4 p-3 rounded-lg ${
//                   message.includes("✅")
//                     ? "bg-green-50 text-green-700"
//                     : "bg-red-50 text-red-700"
//                 }`}
//               >
//                 {message}
//               </div>
//             )}

//             {!editingProduct && nextProductCode && (
//               <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
//                 {nextProductCode}
//               </div>
//             )}

//             <form
//               ref={formRef}
//               id="product-form"
//               onSubmit={handleSubmit}
//               className="space-y-4"
//             >
//               <div>
//                 <label
//                   htmlFor="product_name"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Product Name
//                 </label>
//                 <input
//                   type="text"
//                   id="product_name"
//                   name="product_name"
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label
//                     htmlFor="category"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Category
//                   </label>
//                   <input
//                     type="text"
//                     id="category"
//                     name="category"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>

//                 <div>
//                   <label
//                     htmlFor="sub_category"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Sub Category
//                   </label>
//                   <input
//                     type="text"
//                     id="sub_category"
//                     name="sub_category"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label
//                     htmlFor="product_type"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Product Type (Unit)
//                   </label>
//                   <input
//                     type="text"
//                     id="product_type"
//                     name="product_type"
//                     required
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>

//                 <div>
//                   <label
//                     htmlFor="size"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Size
//                   </label>
//                   <input
//                     type="text"
//                     id="size"
//                     name="size"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Purchase Price
//                   </label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     id="purchase_price"
//                     name="purchase_price"
//                     required
//                     onChange={handlePriceCalculation}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Profit Percent
//                   </label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     id="prophit_percent"
//                     name="prophit_percent"
//                     onChange={handlePriceCalculation}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Selling Price
//                   </label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     id="price"
//                     name="price"
//                     value={price}
//                     readOnly
//                     className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Extended Price
//                   </label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     id="ext_price"
//                     name="ext_price"
//                     value={extPrice}
//                     readOnly
//                     className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label
//                     htmlFor="bar_code"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Barcode
//                   </label>
//                   <input
//                     type="number"
//                     id="bar_code"
//                     name="bar_code"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>

//                 <div>
//                   <label
//                     htmlFor="tax"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Tax (%)
//                   </label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     id="tax"
//                     name="tax"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                   />
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <button
//                   type="submit"
//                   className="flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
//                 >
//                   {editingProduct ? "Update Product" : "Add Product"}
//                 </button>

//                 {editingProduct && (
//                   <button
//                     type="button"
//                     onClick={handleCancelEdit}
//                     className="py-3 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
//                   >
//                     Cancel
//                   </button>
//                 )}
//               </div>
//             </form>
//           </div>
//         </div>

//         {/* Product List Section */}
//         <div className="lg:w-2/3">
//           <div className="bg-white rounded-xl shadow-md overflow-hidden">
//             <div className="p-6 border-b border-gray-200">
//               <h2 className="text-2xl font-semibold text-gray-700">
//                 Product List
//               </h2>
//             </div>

//             {isLoading ? (
//               <div className="p-6 flex justify-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
//               </div>
//             ) : products.length === 0 ? (
//               <div className="p-6 text-center text-gray-500">
//                 No products found. Add your first product!
//               </div>
//             ) : (
//               <div className="h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50 sticky top-0">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Product Info
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Category
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Pricing
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {products.map((product) => (
//                       <tr key={product.id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4">
//                           <div className="text-sm font-medium text-gray-900">
//                             {product.product_name}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             SKU: {product.sku}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             Code: {product.product_code}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             Type: {product.product_type}
//                             {product.size && ` • Size: ${product.size}`}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm text-gray-900">
//                             {product.category || "N/A"}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             {product.sub_category || "No sub-category"}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm font-medium text-gray-900">
//                             Rs.{product.price}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             Cost: Rs.{product.purchase_price}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             Profit: {product.prophit_percent}%
//                             {product.tax && ` • Tax: ${product.tax}%`}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                           <button
//                             onClick={() => handleEdit(product)}
//                             className="text-indigo-600 hover:text-indigo-900 mr-4"
//                           >
//                             Edit
//                           </button>
//                           <button
//                             onClick={() => handleDelete(product.id)}
//                             className="text-red-600 hover:text-red-900"
//                           >
//                             Delete
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Custom Scrollbar Styles */}
//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 8px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 4px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #c7d2fe;
//           border-radius: 4px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: #a5b4fc;
//         }
//       `}</style>
//     </div>
//   );
// }
