"use client";
import { useEffect, useRef, useState } from "react";
import { getDropdownStockData, createPurchaseSheet } from "../../action/action";
import Link from "next/link";
import COAList from "../components/COAList";

export default function PurchaseSheetPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [items, setItems] = useState([]);
  const [dated, setDated] = useState(new Date().toISOString().split("T")[0]);
  const [purchase_code, setPurchaseCode] = useState("");
  const [bill_amount, setBillAmount] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [cash, setCash] = useState("");
  const [bank_transfer, setBankTransfer] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    getDropdownStockData().then(({ coaList, productList }) => {
      setCoaList(coaList);
      setProductList(productList);
    });
  }, []);

  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const total = items.reduce(
      (sum, p) => sum + p.quantity * p.purchase_price,
      0
    );
    let discountedTotal = total;

    if (discountValue) {
      const discount = parseFloat(discountValue);
      if (!isNaN(discount)) {
        if (discountType === "percentage") {
          discountedTotal = total - (total * discount) / 100;
        } else {
          discountedTotal = total - discount;
        }
        discountedTotal = Math.max(0, discountedTotal);
      }
    }

    setBillAmount(discountedTotal);
  }, [items, discountType, discountValue]);

  // Handle barcode scanning
  let lastBarcode = "";
  let lastScanTime = 0;

  const handleBarcodeScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const barcode = e.target.value.trim();
      const now = Date.now();

      if (barcode && (barcode !== lastBarcode || now - lastScanTime > 300)) {
        processBarcode(barcode);
        lastBarcode = barcode;
        lastScanTime = now;
      }

      e.target.value = "";
    }
  };

  // Process barcode and update items
  const processBarcode = (barcode) => {
    // Try to find product by bar_code or product_code
    const product = productList.find(
      (p) => p.bar_code?.toString() === barcode || p.product_code === barcode
    );

    if (!product) {
      alert(`Product not found for barcode: ${barcode}`);
      return;
    }

    addProductToItems(product);
  };

  // Add product to items list
  const addProductToItems = (product) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product_code === product.product_code
      );

      if (existingItemIndex !== -1) {
        return prevItems.map((item, i) =>
          i === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newItem = {
          product_code: product.product_code,
          product_name: product.product_name,
          quantity: 1,
          price: product.purchase_price || 0,
          ext_price: product.ext_price || 0,
          purchase_price: product.purchase_price || 0,
          product_type: product.product_type,
          category: product.category,
          sub_category: product.sub_category,
          size: product.size,
          sku: product.sku,
          stock: product.stock || 0,
          remarks: "",
          discount: { type: "percentage", value: 0 },
        };
        return [...prevItems, newItem];
      }
    });

    // Return focus to barcode input for next scan
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 300);
  };

  // Handle product selection from list
  const handleProductSelect = (product) => {
    addProductToItems(product);
    setShowProductList(false);
    setSearchTerm("");
  };

  // Filter products based on search
  const filteredProducts = productList.filter(
    (product) =>
      product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function updateItem(index, field, value) {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index][field] = value;

      return newItems;
    });
  }

  function removeItem(index) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!purchase_code.trim() || !dated.trim() || items.length === 0) {
      alert("Please fill in all required fields and add at least one product");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("doc_type", "PV");
    formData.append("purchase_or_sale_account", "20010003");
    formData.append("purchase_code", purchase_code);
    formData.append("dated", dated);
    formData.append("bill_amount", bill_amount.toString());
    formData.append("sale_man", supplier || "Default Supplier");
    formData.append("cash", cash);
    formData.append("jazz_cash", bank_transfer);
    formData.append("calculated_discount", discountValue || "0");
    formData.append("items", JSON.stringify(items));

    try {
      const result = await createPurchaseSheet(formData);

      if (result.success) {
        alert("Purchase saved successfully with doc_id: " + result.doc_id);
        // Reset form
        setItems([]);
        setDated(new Date().toISOString().split("T")[0]);
        setPurchaseCode("");
        setSupplier("");
        setCash("");
        setBankTransfer("");
        setDiscountValue("");
        setDiscountType("percentage");

        setTimeout(() => {
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        }, 100);
      } else {
        alert("Failed to save purchase: " + result.message);
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to save purchase. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const grandTotal = items.reduce(
    (sum, p) => sum + p.quantity * p.purchase_price,
    0
  );
  const discountAmount = discountValue
    ? discountType === "percentage"
      ? (grandTotal * parseFloat(discountValue)) / 100
      : parseFloat(discountValue)
    : 0;
  const finalAmount = Math.max(0, grandTotal - discountAmount);

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 p-6 w-4/5 mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg">
          Purchase Sheet
        </h1>
        <p className="text-gray-600 mt-4 text-lg font-light">
          Scan barcodes or search products to add to purchase
        </p>
      </div>

      <div className="space-y-8">
        {/* Barcode Scanner Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            Product Scanner
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode Scanner (Scan barcode or enter product code)
              </label>
              <input
                type="text"
                ref={barcodeInputRef}
                onKeyDown={handleBarcodeScan}
                placeholder="Scan barcode or enter product code and press Enter"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                autoFocus
              />
            </div>

            {/* Manual Product Selection Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowProductList(true)}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors duration-200"
              >
                Select Products
              </button>
            </div>

            <div className="text-sm text-gray-600 mt-6">
              {items.length} products added
            </div>
          </div>
        </div>

        {/* Product List Modal */}
        {showProductList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-6xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Select Products
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductList(false);
                      setSearchTerm("");
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products by name, code, SKU, or category..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-[60vh]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Type/Size
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Purchase Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Ext Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div>{product.product_code}</div>
                          <div className="text-xs text-gray-500">
                            SKU: {product.sku}
                          </div>
                          {product.bar_code && (
                            <div className="text-xs text-gray-500">
                              Barcode: {product.bar_code}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {product.product_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{product.category || "N/A"}</div>
                          <div className="text-xs text-gray-500">
                            {product.sub_category || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{product.product_type}</div>
                          {product.size && (
                            <div className="text-xs text-gray-500">
                              Size: {product.size}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-700">
                          Rs.{(product.purchase_price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-700">
                          Rs.{(product.ext_price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (product.stock || 0) > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Add to Purchase
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products found matching your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        {items.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-1 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4 p-4">
              <h2 className="text-xl font-semibold text-blue-800">
                Purchase Items ({items.length})
              </h2>
              <div className="text-sm text-gray-600">
                Total: Rs.{grandTotal.toFixed(2)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-100/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Product Info
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Type/Size
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Purchase Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Ext Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Current Stock
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-blue-800">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const currentStock = item.stock || 0;
                    const quantity = parseInt(item.quantity) || 0;

                    return (
                      <tr
                        key={i}
                        className="border-b border-blue-100 hover:bg-blue-50/50"
                      >
                        {/* Product Information */}
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {item.product_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            Code: {item.product_code}
                            {item.sku && ` • SKU: ${item.sku}`}
                          </div>
                        </td>

                        {/* Type/Size */}
                        <td className="p-3">
                          <div className="text-sm text-gray-700">
                            {item.product_type}
                          </div>
                          {item.size && (
                            <div className="text-xs text-gray-500">
                              Size: {item.size}
                            </div>
                          )}
                        </td>

                        {/* Purchase Price */}
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.purchase_price}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "purchase_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>

                        {/* Ext Price */}
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.ext_price}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "ext_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="p-3">
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </td>

                        {/* Current Stock */}
                        <td className="p-3">
                          <div
                            className={`px-3 py-2 rounded-md font-medium text-sm text-center ${
                              currentStock > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {currentStock}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="p-3">
                          <div className="px-3 py-2 bg-gray-100 rounded-md font-medium text-gray-700 text-sm">
                            Rs.
                            {(item.quantity * item.purchase_price).toFixed(2)}
                          </div>
                        </td>

                        {/* Delete Action */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Combined Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Purchase Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Supplier Account *
                </label>
                <COAList
                  coaList={coaList}
                  value={purchase_code}
                  onAccountSelect={(account) => {
                    console.log("Selected account:", account);
                    setPurchaseCode(account.account_code);
                  }}
                />
                {!purchase_code && (
                  <p className="text-red-500 text-sm mt-1">
                    Please select a supplier account
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  value={dated}
                  onChange={(e) => setDated(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Purchase & Discount */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <h2 className="text-xl font-semibold text-purple-800 mb-4">
              Purchase & Discount
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Enter supplier name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={discountType === "percentage"}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Percentage (%)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discountType"
                      value="cash"
                      checked={discountType === "cash"}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Cash</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={
                    discountType === "percentage"
                      ? "Discount percentage"
                      : "Discount amount"
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
            <h2 className="text-xl font-semibold text-orange-800 mb-4">
              Payment Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="Enter cash amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Transfer
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bank_transfer}
                  onChange={(e) => setBankTransfer(e.target.value)}
                  placeholder="Enter bank transfer amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Purchase Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {items.length}
              </div>
              <div className="text-sm text-gray-600">Items</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                Rs.{grandTotal.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Subtotal</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                Rs.{discountAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Discount</div>
            </div>
            <div className="text-center p-4 bg-blue-100 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-800">
                Rs.{finalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-blue-600">Total Amount</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
          <Link
            href="/purchase-detail"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            View Purchase Details
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Processing..."
              : `Save Purchase (Rs.${finalAmount.toFixed(2)})`}
          </button>
        </div>
      </div>
    </form>
  );
}
