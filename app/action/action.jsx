"use server";

import prisma from "../../utils/connection";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Optional validation
const COASchema = z.object({
  account_code: z.string(),
  account_name: z.string(),
  city: z.string(),
  account_nature: z.string(),
  contact_no: z.coerce.number(),
  address: z.string(),
});
////////////  Create Chart of Account Page

export async function lastCOA() {
  const lastAccount = await prisma.COA.findFirst({
    orderBy: {
      account_code: "desc",
    },
  });
  let newCode;
  if (!lastAccount) {
    newCode = "20010001";
  } else {
    const lastCodeNumber = parseInt(lastAccount.account_code, 10);
    newCode = (lastCodeNumber + 1).toString();
  }
  return newCode;
}

export async function createCOA(formData) {
  const newCode = await lastCOA();

  const parsed = COASchema.safeParse({
    account_code: newCode,
    account_name: formData.get("account_name"),
    city: formData.get("city"),
    account_nature: formData.get("account_nature"),
    contact_no: formData.get("contact_no"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }
  const result = await prisma?.COA.create({
    data: parsed.data,
  });

  return { success: true, result };
}

export async function getCOAs() {
  const accounts = await prisma.COA.findMany({
    orderBy: {
      account_code: "asc",
    },
  });
  return accounts;
}

export async function updateCOA(formData) {
  const parsed = COASchema.safeParse({
    account_code: formData.get("account_code"),
    account_name: formData.get("account_name"),
    city: formData.get("city"),
    account_nature: formData.get("account_nature"),
    contact_no: formData.get("contact_no"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const result = await prisma?.COA.update({
    where: { account_code: parsed.data.account_code },
    data: parsed.data,
  });

  return { success: true, result };
}

export async function deleteCOA(account_code) {
  const result = await prisma?.COA.delete({
    where: { account_code },
  });
  return { success: true, result };
}

//////// Save Sale and customer List

//////////// Create Product Page Function
////////////////////////// CRUD operation for product model
export async function createProduct(formData) {
  try {
    const lastProduct = await prisma.Product.findFirst({
      orderBy: {
        product_code: "desc",
      },
    });

    const nextProductCode = lastProduct
      ? parseInt(lastProduct.product_code) + 1
      : 2001;

    const productData = {
      product_code: nextProductCode.toString(),
      product_name: formData.get("product_name"),
      design_number: formData.get("design_number"),
      product_type: formData.get("product_type"),
      sku: "sku:" + nextProductCode.toString(),
      purchase_price: parseFloat(formData.get("purchase_price")),
      prophit_percent: parseFloat(formData.get("prophit_percent")),
      price: parseFloat(formData.get("price")),
    };

    if (
      isNaN(productData.purchase_price) ||
      isNaN(productData.prophit_percent) ||
      isNaN(productData.price)
    ) {
      throw new Error("Invalid numeric values in form data");
    }

    const newProduct = await prisma.Product.create({
      data: productData,
    });

    return {
      success: true,
      newCode: nextProductCode.toString(),
      nextProductCode,
      product: newProduct,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: error.message || "Failed to create product",
    };
  }
}

export async function getProducts() {
  try {
    const products = await prisma.Product.findMany({
      select: {
        product_code: true,
        product_name: true,
        design_number: true,
        product_type: true,
        sku: true,
        purchase_price: true,
        prophit_percent: true,
        price: true,
      },
      orderBy: {
        product_code: "desc",
      },
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function updateProduct(formData) {
  try {
    const productData = {
      product_name: formData.get("product_name"),
      design_number: formData.get("design_number"),
      product_type: formData.get("product_type"),
      purchase_price: parseFloat(formData.get("purchase_price")),
      prophit_percent: parseFloat(formData.get("prophit_percent")),
      price: parseFloat(formData.get("price")),
    };

    if (
      isNaN(productData.purchase_price) ||
      isNaN(productData.prophit_percent) ||
      isNaN(productData.price)
    ) {
      throw new Error("Invalid numeric values in form data");
    }

    const productCode = formData.get("product_code");
    const updatedProduct = await prisma.Product.update({
      where: { product_code: productCode },
      data: productData,
    });

    return {
      success: true,
      message: "Product updated successfully!",
      product: updatedProduct,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      message: error.message || "Failed to update product",
    };
  }
}

export async function deleteProduct(productCode) {
  try {
    await prisma.Product.delete({
      where: { product_code: productCode },
    });

    return {
      success: true,
      message: "Product deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      message: error.message || "Failed to delete product",
    };
  }
}
////////////////// Inventry Master and PurchaseSheet Table
async function generateDocId() {
  const lastRecord = await prisma.InventMaster.findFirst({
    orderBy: { doc_id: "desc" },
  });
  return lastRecord ? lastRecord.doc_id + 1 : 1;
}

export async function createPurchaseSheet(formData) {
  const doc_id = await generateDocId();
  const doc_type = formData.get("doc_type");
  const purchase_or_sale_account = formData.get("purchase_or_sale_account");
  const calculated_discount = parseFloat(formData.get("calculated_discount"));
  const purchase_code = formData.get("purchase_code");
  const dated = new Date(formData.get("dated"));
  const bill_amount = parseFloat(formData.get("bill_amount"));
  const sale_man = formData.get("sale_man");
  const cash = formData.get("cash") ? parseFloat(formData.get("cash")) : null;
  const jazz_cash = formData.get("jazz_cash")
    ? parseFloat(formData.get("jazz_cash"))
    : null;

  const items = JSON.parse(formData.get("items"));
  const purchases = items.map((item) => {
    const quantity = parseFloat(item.quantity);
    const price = parseFloat(item.price || item.purchase_price);
    return {
      product_code: item.product_code,
      quantity,
      price,
      amount: quantity * price,
      remarks: item.remarks || "",
      doc_type,
    };
  });

  const total_qty = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const total_item = purchases.length;
  const grandTotal = purchases.reduce((sum, p) => sum + p.amount, 0);

  await prisma.InventMaster.create({
    data: {
      invoice_no: Math.floor(Math.random() * 100000),
      doc_id,
      purchase_or_sale_account,
      purchase_code,
      doc_type,
      dated,
      bill_amount,
      sale_man,
      cash,
      jazz_cash,
      Purchase: {
        create: purchases.map((p) => ({
          ...p,
          total_qty,
          total_item,
          calculated_discount: calculated_discount || 0,
          // grandTotal: grandTotal - (calculated_discount || 0),
        })),
      },
    },
  });

  return { success: true, doc_id };
}

// purchaseSheet dropdown data
export async function getDropdownData() {
  const coaList = await prisma.COA.findMany({
    select: {
      account_code: true,
      account_name: true,
      city: true,
      contact_no: true,
    },
  });
  const productList = await prisma.Product.findMany({
    select: {
      product_code: true,
      product_name: true,
      design_number: true,
      price: true,
      purchase_price: true,
    },
  });
  return { coaList, productList };
}

//////////// Get InventMaster and Purchase Details

export async function getInventWithPurchase() {
  try {
    const data = await prisma.inventMaster.findMany({
      include: {
        COA: true,
        Purchase: {
          include: {
            Product: true,
          },
        },
      },
      where: {
        doc_type: "PV",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching InventMaster data:", error.message);
    return [];
  }
}

////////////// Get InventMaster with Purchase Return
export async function getInventWithPurchaseReturn() {
  try {
    const data = await prisma.inventMaster.findMany({
      include: {
        COA: true,
        Purchase: {
          include: {
            Product: true,
          },
        },
      },
      where: {
        doc_type: "PR",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching InventMaster data:", error.message);
    return [];
  }
}

/////////// Get InventMaster with Sale Detail

export async function getSaleBillData(doc_id) {
  try {
    const purchase = await prisma.InventMaster.findFirst({
      where: {
        AND: [{ doc_id: Number(doc_id) }, { doc_type: "SV" }],
      },
      include: {
        Purchase: {
          include: {
            Product: true,
          },
        },
        COA: true,
      },
    });

    if (!purchase) {
      return {
        error: `Document with ID ${doc_id} not found or document type is not SV (Sale)`,
      };
    }

    // Calculate additional values
    const subtotal = purchase.Purchase.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const grandTotal = subtotal - (purchase.calculated_discount || 0);

    return {
      doc_id: purchase.doc_id,
      doc_type: purchase.doc_type,
      dated: purchase.dated,
      purchase_code: purchase.purchase_code,
      bill_amount: purchase.bill_amount,
      sale_man: purchase.sale_man,
      cash: purchase.cash,
      jazz_cash: purchase.jazz_cash,
      items: purchase.Purchase,
      calculated_discount: purchase.calculated_discount,
      subtotal,
      grandTotal,
      coa: purchase.COA
        ? {
            contact_no: purchase.COA.contact_no,
            city: purchase.COA.city,
            account_name: purchase.COA.account_name,
            address: purchase.COA.address,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    return { error: "Failed to fetch purchase data" };
  }
}

//////////////////////// Get InventMaster model get doc_id for Sale Voucher
export async function getInventMasterSaleData() {
  try {
    console.log("getInventMasterData function called");

    const result = await prisma.InventMaster.findMany({
      where: {
        doc_type: "SV",
      },
      select: {
        doc_id: true,
        // doc_type: true,
      },
    });

    // console.log("Result=", result);
    return result;
  } catch (error) {
    console.error("Error i`n getInventMasterData:", error);
    throw new Error("Failed to fetch InventMaster data");
  }
}

/////////// Get InventMaster with Sale Return Detail

export async function getSaleReturnBillData(doc_id) {
  try {
    const purchase = await prisma.InventMaster.findFirst({
      where: {
        AND: [{ doc_id: Number(doc_id) }, { doc_type: "SR" }],
      },
      include: {
        Purchase: {
          include: {
            Product: true,
          },
        },
        COA: true,
      },
    });

    if (!purchase) {
      return {
        error: `Document with ID ${doc_id} not found or document type is not SR (Sale Return)`,
      };
    }

    // Calculate additional values
    const subtotal = purchase.Purchase.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const grandTotal = subtotal - (purchase.calculated_discount || 0);

    return {
      doc_id: purchase.doc_id,
      doc_type: purchase.doc_type,
      dated: purchase.dated,
      purchase_code: purchase.purchase_code,
      bill_amount: purchase.bill_amount,
      sale_man: purchase.sale_man,
      cash: purchase.cash,
      jazz_cash: purchase.jazz_cash,
      items: purchase.Purchase,
      calculated_discount: purchase.calculated_discount,
      subtotal,
      grandTotal,
      coa: purchase.COA
        ? {
            contact_no: purchase.COA.contact_no,
            city: purchase.COA.city,
            account_name: purchase.COA.account_name,
            address: purchase.COA.address,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    return { error: "Failed to fetch purchase data" };
  }
}

//////////////////////// Get InventMaster model get doc_id for Sale Voucher
export async function getInventMasterSaleReturnId() {
  try {
    console.log("getInventMasterData function called");

    const result = await prisma.InventMaster.findMany({
      where: {
        doc_type: "SR",
      },
      select: {
        doc_id: true,
        // doc_type: true,
      },
    });

    // console.log("Result=", result);
    return result;
  } catch (error) {
    console.error("Error i`n getInventMasterData:", error);
    throw new Error("Failed to fetch InventMaster data");
  }
}

/////////// Get InventMaster with Purchase Bill Detail

export async function getPurchaseBillData(doc_id) {
  try {
    const purchase = await prisma.InventMaster.findFirst({
      where: {
        AND: [{ doc_id: Number(doc_id) }, { doc_type: "PV" }],
      },
      include: {
        Purchase: {
          include: {
            Product: true,
          },
        },
        COA: true,
      },
    });

    if (!purchase) {
      return {
        error: `Document with ID ${doc_id} not found or document type is not PV (Purchase)`,
      };
    }

    // Calculate additional values
    const subtotal = purchase.Purchase.reduce(
      (sum, item) => sum + item.quantity * item.purchase_price,
      0
    );
    const grandTotal = subtotal - (purchase.calculated_discount || 0);

    return {
      doc_id: purchase.doc_id,
      doc_type: purchase.doc_type,
      dated: purchase.dated,
      purchase_code: purchase.purchase_code,
      bill_amount: purchase.bill_amount,
      sale_man: purchase.sale_man,
      cash: purchase.cash,
      jazz_cash: purchase.jazz_cash,
      items: purchase.Purchase,
      calculated_discount: purchase.calculated_discount,
      subtotal,
      grandTotal,
      coa: purchase.COA
        ? {
            contact_no: purchase.COA.contact_no,
            city: purchase.COA.city,
            account_name: purchase.COA.account_name,
            address: purchase.COA.address,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    return { error: "Failed to fetch purchase data" };
  }
}

//////////////////////// Get InventMaster model get doc_id for Purchase Voucher
export async function getInventMasterPurchaseId() {
  try {
    console.log("getInventMasterData function called");

    const result = await prisma.InventMaster.findMany({
      where: {
        doc_type: "PV",
      },
      select: {
        doc_id: true,
        // doc_type: true,
      },
    });

    // console.log("Result=", result);
    return result;
  } catch (error) {
    console.error("Error i`n getInventMasterData:", error);
    throw new Error("Failed to fetch InventMaster data");
  }
}

/////////// Get InventMaster with Purchase Bill Detail

export async function getPurchaseReturnBillData(doc_id) {
  try {
    const purchase = await prisma.InventMaster.findFirst({
      where: {
        AND: [{ doc_id: Number(doc_id) }, { doc_type: "PR" }],
      },
      include: {
        Purchase: {
          include: {
            Product: true,
          },
        },
        COA: true,
      },
    });

    if (!purchase) {
      return {
        error: `Document with ID ${doc_id} not found or document type is not PR (Purchase Return)`,
      };
    }

    // Calculate additional values
    const subtotal = purchase.Purchase.reduce(
      (sum, item) => sum + item.quantity * item.purchase_price,
      0
    );
    const grandTotal = subtotal - (purchase.calculated_discount || 0);

    return {
      doc_id: purchase.doc_id,
      doc_type: purchase.doc_type,
      dated: purchase.dated,
      purchase_code: purchase.purchase_code,
      bill_amount: purchase.bill_amount,
      sale_man: purchase.sale_man,
      cash: purchase.cash,
      jazz_cash: purchase.jazz_cash,
      items: purchase.Purchase,
      calculated_discount: purchase.calculated_discount,
      subtotal,
      grandTotal,
      coa: purchase.COA
        ? {
            contact_no: purchase.COA.contact_no,
            city: purchase.COA.city,
            account_name: purchase.COA.account_name,
            address: purchase.COA.address,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    return { error: "Failed to fetch purchase data" };
  }
}

//////////////////////// Get InventMaster model get doc_id for Purchase Voucher
export async function getInventMasterPurchaseReturnId() {
  try {
    console.log("getInventMasterData function called");

    const result = await prisma.InventMaster.findMany({
      where: {
        doc_type: "PR",
      },
      select: {
        doc_id: true,
        // doc_type: true,
      },
    });

    // console.log("Result=", result);
    return result;
  } catch (error) {
    console.error("Error i`n getInventMasterPurchaseReturnData:", error);
    throw new Error("Failed to fetch InventMaster data");
  }
}

/////////////// Get Purchase Bill Update and Delete Functions
// ... existing code ...

export async function updatePurchaseSheet(doc_id, formData) {
  try {
    const doc_type = formData.get("doc_type");
    const purchase_or_sale_account = formData.get("purchase_or_sale_account");
    const calculated_discount = parseFloat(formData.get("calculated_discount"));
    const purchase_code = formData.get("purchase_code");
    const dated = new Date(formData.get("dated"));
    const bill_amount = parseFloat(formData.get("bill_amount"));
    const sale_man = formData.get("sale_man");
    const cash = formData.get("cash") ? parseFloat(formData.get("cash")) : null;
    const jazz_cash = formData.get("jazz_cash")
      ? parseFloat(formData.get("jazz_cash"))
      : null;

    const items = JSON.parse(formData.get("items"));
    const purchases = items.map((item) => {
      const quantity = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      return {
        product_code: item.product_code,
        quantity,
        price,
        amount: quantity * price,
        remarks: item.remarks || "",
        doc_type,
      };
    });

    const total_qty = purchases.reduce((sum, p) => sum + p.quantity, 0);
    const total_item = purchases.length;
    const grandTotal = purchases.reduce((sum, p) => sum + p.amount, 0);

    // First delete existing purchase records
    await prisma.Purchase.deleteMany({
      where: { doc_id: parseInt(doc_id) },
    });

    // Then update the master record and create new purchase records
    await prisma.InventMaster.update({
      where: { doc_id: parseInt(doc_id) },
      data: {
        purchase_or_sale_account,
        purchase_code,
        doc_type,
        dated,
        bill_amount,
        sale_man,
        cash,
        jazz_cash,
        Purchase: {
          create: purchases.map((p) => ({
            ...p,
            total_qty,
            total_item,
            calculated_discount: calculated_discount || 0,
          })),
        },
      },
    });

    return { success: true, doc_id };
  } catch (error) {
    console.error("Error updating purchase sheet:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePurchaseSheet(doc_id) {
  try {
    // First delete related purchase records
    await prisma.Purchase.deleteMany({
      where: { doc_id: parseInt(doc_id) },
    });

    // Then delete the master record
    await prisma.InventMaster.delete({
      where: { doc_id: parseInt(doc_id) },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting purchase sheet:", error);
    return { success: false, error: error.message };
  }
}

export async function getPurchaseSheetById(doc_id) {
  try {
    const purchaseSheet = await prisma.InventMaster.findUnique({
      where: { doc_id: parseInt(doc_id) },
      include: {
        Purchase: true,
      },
    });

    return { success: true, data: purchaseSheet };
  } catch (error) {
    console.error("Error fetching purchase sheet:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllPurchaseSheets() {
  try {
    const purchaseSheets = await prisma.InventMaster.findMany({
      include: {
        Purchase: true,
      },
      orderBy: { doc_id: "desc" },
    });

    return { success: true, data: purchaseSheets };
  } catch (error) {
    console.error("Error fetching purchase sheets:", error);
    return { success: false, error: error.message };
  }
}

/////////// Get Invent with sale return
export async function getInventWithSaleReturn() {
  try {
    const data = await prisma.inventMaster.findMany({
      include: {
        COA: true,
        Purchase: {
          include: {
            Product: true,
          },
        },
      },
      where: {
        doc_type: "SR",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching InventMaster data:", error.message);
    return [];
  }
}

/////////// Edit InventMaster and Purchase Sheet

export async function getPurchaseByDocId(doc_id) {
  // console.log(doc_id);
  const data = await prisma.InventMaster.findUnique({
    where: { doc_id: Number(doc_id) },
    include: {
      COA: true,
      Purchase: {
        include: {
          Product: true,
        },
      },
    },
  });
  return data;
  // console.log("data=", data);
}

export async function updatePurchaseByDocId(formData) {
  const doc_id = Number(formData.get("doc_id"));

  const grandTotal = parseFloat(formData.get("grandTotal"));
  const totalQty = parseInt(formData.get("totalQty"));
  const totalItems = parseInt(formData.get("totalItems"));
  const updatedInvent = await prisma.InventMaster.update({
    where: { doc_id },
    data: {
      invoice_no: Number(formData.get("invoice_no")),
      purchase_code: formData.get("purchase_code"),
      dated: new Date(formData.get("dated")),
    },
  });

  // Update each purchase record based on your frontend form structure
  const items = JSON.parse(formData.get("items")); // Assume this is a JSON array of updated
  const deletedItems = JSON.parse(formData.get("deletedItems"));

  if (deletedItems && deletedItems.length > 0) {
    await prisma.Purchase.deleteMany({
      where: {
        id: { in: deletedItems },
      },
    });
  }
  // purchases

  // console.log(items);
  for (const item of items) {
    await prisma.Purchase.update({
      where: { id: item.id },
      data: {
        product_code: item.product_code,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        amount: parseFloat(item.amount),
        remarks: item.remarks,
        total_qty: totalQty,
        total_item: totalItems,
        grandTotal,
      },
    });
  }

  return { success: true };
}

////////// Delete data from InventMaster and Purchase Sheet

export async function deleteInventMasterPurchase(doc_id) {
  try {
    await prisma.purchase.deleteMany({
      where: { doc_id: doc_id },
    });

    await prisma.inventMaster.delete({
      where: { doc_id: doc_id },
    });

    return { success: true };
  } catch (error) {
    // console.error("Delete Error:", error);
    return { success: false, error: error.message };
  }
}

////////////////// Get Stock Details

export async function getStockTable() {
  // Get all purchases (PV)
  const purchases = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "PV",
    },
    _sum: {
      quantity: true,
    },
  });

  // Get all purchase returns (PR)
  const purchaseReturns = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "PR",
    },
    _sum: {
      quantity: true,
    },
  });

  // Get all sales (SV)
  const sales = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "SV",
    },
    _sum: {
      quantity: true,
    },
  });

  // Get all sale returns (SR)
  const saleReturns = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "SR",
    },
    _sum: {
      quantity: true,
    },
  });

  // Create maps for fast lookup
  const purchasesMap = {};
  const purchaseReturnsMap = {};
  const salesMap = {};
  const saleReturnsMap = {};

  for (const p of purchases) {
    purchasesMap[p.product_code] = p._sum.quantity || 0;
  }

  for (const pr of purchaseReturns) {
    purchaseReturnsMap[pr.product_code] = pr._sum.quantity || 0;
  }

  for (const s of sales) {
    salesMap[s.product_code] = s._sum.quantity || 0;
  }

  for (const sr of saleReturns) {
    saleReturnsMap[sr.product_code] = sr._sum.quantity || 0;
  }

  // Get all unique product codes
  const allProductCodes = [
    ...new Set([
      ...purchases.map((p) => p.product_code),
      ...purchaseReturns.map((pr) => pr.product_code),
      ...sales.map((s) => s.product_code),
      ...saleReturns.map((sr) => sr.product_code),
    ]),
  ];

  // Build the stock list
  const stockData = [];

  for (const productCode of allProductCodes) {
    const product = await prisma.Product.findUnique({
      where: { product_code: productCode },
    });

    const purchaseQty = purchasesMap[productCode] || 0;
    const purchaseReturnQty = purchaseReturnsMap[productCode] || 0;
    const saleQty = salesMap[productCode] || 0;
    const saleReturnQty = saleReturnsMap[productCode] || 0;

    // Calculate net quantities
    const netPurchase = purchaseQty - purchaseReturnQty;
    const netSale = saleQty - saleReturnQty;
    const stockQty = netPurchase - netSale;

    stockData.push({
      item_code: productCode,
      item_name: product?.product_name || "",
      design_number: product?.design_number || "",
      Purchase: purchaseQty,
      Purchase_Return: purchaseReturnQty,
      Net_Purchase: netPurchase,
      Sale: saleQty,
      Sale_Return: saleReturnQty,
      Net_Sale: netSale,
      Stock: stockQty,
      doc_type: "Stock",
    });
  }

  return stockData;
}

//////////////////////// get drop down data for Stock of Product checking

export async function getDropdownStockData() {
  try {
    const coaList = await prisma.COA.findMany({
      select: {
        account_code: true,
        account_name: true,
        city: true,
        contact_no: true,
      },
    });
    const productList = await prisma.Product.findMany({
      select: {
        product_code: true,
        product_name: true,
        design_number: true,
        price: true,
        purchase_price: true,
      },
    });

    const stockData = await getStocksTable();

    // Create a stock map for easy lookup
    const stockMap = {};
    stockData.forEach((item) => {
      stockMap[item.item_code] = item.Stock || 0;
    });

    // Add stock information to product list
    const productListWithStock = productList.map((product) => ({
      ...product,
      stock: stockMap[product.product_code] || 0,
    }));

    // console.log("productListWithStock", productListWithStock);
    return {
      coaList,
      productList: productListWithStock,
      stockData,
    };
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    throw error;
  }
}

export async function getStocksTable() {
  // Get all purchases (PV)
  const purchases = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "PV",
    },
    _sum: {
      quantity: true,
    },
  });

  // Get all purchase returns (PR)
  const purchaseReturns = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "PR",
    },
    _sum: {
      quantity: true,
    },
  });

  // Get all sales (SV)
  const sales = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "SV",
    },
    _sum: {
      quantity: true,
    },
  });

  // Get all sale returns (SR)
  const saleReturns = await prisma.Purchase.groupBy({
    by: ["product_code"],
    where: {
      doc_type: "SR",
    },
    _sum: {
      quantity: true,
    },
  });

  // Create maps for fast lookup
  const purchasesMap = {};
  const purchaseReturnsMap = {};
  const salesMap = {};
  const saleReturnsMap = {};

  for (const p of purchases) {
    purchasesMap[p.product_code] = p._sum.quantity || 0;
  }

  for (const pr of purchaseReturns) {
    purchaseReturnsMap[pr.product_code] = pr._sum.quantity || 0;
  }

  for (const s of sales) {
    salesMap[s.product_code] = s._sum.quantity || 0;
  }

  for (const sr of saleReturns) {
    saleReturnsMap[sr.product_code] = sr._sum.quantity || 0;
  }

  // Get all unique product codes
  const allProductCodes = [
    ...new Set([
      ...purchases.map((p) => p.product_code),
      ...purchaseReturns.map((pr) => pr.product_code),
      ...sales.map((s) => s.product_code),
      ...saleReturns.map((sr) => sr.product_code),
    ]),
  ];

  // Build the stock list
  const stockData = [];

  for (const productCode of allProductCodes) {
    const product = await prisma.Product.findUnique({
      where: { product_code: productCode },
    });

    const purchaseQty = purchasesMap[productCode] || 0;
    const purchaseReturnQty = purchaseReturnsMap[productCode] || 0;
    const saleQty = salesMap[productCode] || 0;
    const saleReturnQty = saleReturnsMap[productCode] || 0;

    // Calculate net quantities
    const netPurchase = purchaseQty - purchaseReturnQty;
    const netSale = saleQty - saleReturnQty;
    const stockQty = netPurchase - netSale;

    stockData.push({
      item_code: productCode,
      item_name: product?.product_name || "",
      design_number: product?.design_number || "",
      Purchase: purchaseQty,
      Purchase_Return: purchaseReturnQty,
      Net_Purchase: netPurchase,
      Sale: saleQty,
      Sale_Return: saleReturnQty,
      Net_Sale: netSale,
      Stock: stockQty,
      doc_type: "Stock",
    });
  }

  return stockData;
}

//////// Add data in JournalMaster and JournalDetail

const generateDocIdJornal = async () => {
  const lastDoc = await prisma.JornalMst.findFirst({
    orderBy: { doc_id: "desc" },
    select: { doc_id: true },
  });
  return lastDoc ? lastDoc.doc_id + 1 : 1;
};
export async function createJournal(formData) {
  const { doc_type, dated, remarks, details } = formData;
  const doc_id = await generateDocIdJornal();

  const journal = await prisma.JornalMst.create({
    data: {
      doc_id,
      doc_type,
      dated: new Date(dated),
      remarks,
      JornalDtl: {
        create: details.map((row) => ({
          account_code: row.account_code,
          doc_type,
          debit: parseFloat(row.debit),
          credit: parseFloat(row.credit),
          remarks: row.remarks,
        })),
      },
    },
  });

  return { success: true, doc_id };
}

// create  jornal form for   dropdown data
export async function getDropdownDataJornal() {
  const coaList = await prisma.COA.findMany({
    select: { account_code: true, account_name: true },
    // orderBy: {
    //   account_code: "desc",
    // },
    // take: 2,
  });
  // console.log(coaList);
  return { coaList };
}

/////////// Get Records from JornalMaster and JornalDetail For JV

export async function getAllJournalsJV() {
  const journals = await prisma.JornalMst.findMany({
    orderBy: { doc_id: "asc" },
    include: {
      JornalDtl: {
        include: {
          COA: true,
        },
      },
    },
    where: {
      doc_type: "JV",
    },
  });

  return journals;
}

/////////// Get Records from JornalMaster and JornalDetail For DV

export async function getAllJournalsDV() {
  const journals = await prisma.JornalMst.findMany({
    orderBy: { doc_id: "asc" },
    include: {
      JornalDtl: {
        include: {
          COA: true,
        },
      },
    },
    where: {
      doc_type: "DV",
    },
  });

  return journals;
}

///////// Delete Data from JornalMaster and JornalDetail

export async function deleteJornalMaster(doc_id) {
  try {
    await prisma.JornalDtl.deleteMany({
      where: { doc_id: doc_id },
    });

    await prisma.JornalMst.delete({
      where: { doc_id: doc_id },
    });

    return { success: true };
  } catch (error) {
    // console.error("Delete Error:", error);
    return { success: false, error: error.message };
  }
}

////////////// Edit Data for jornal Detail Master
export async function getJournalById(doc_id) {
  const journal = await prisma.JornalMst.findUnique({
    where: { doc_id: parseInt(doc_id) },
    include: { JornalDtl: true },
  });

  return journal;
}

export async function updateJournal(doc_id, formData) {
  const { doc_type, dated, remarks, details } = formData;

  // Delete old details and recreate them (simplest way for now)
  await prisma.JornalDtl.deleteMany({ where: { doc_id: parseInt(doc_id) } });

  await prisma.JornalMst.update({
    where: { doc_id: parseInt(doc_id) },
    data: {
      doc_type,
      dated: new Date(dated),
      remarks,
      JornalDtl: {
        create: details.map((row) => ({
          // doc_id: parseInt(doc_id),
          account_code: row.account_code,
          doc_type,
          debit: parseFloat(row.debit),
          credit: parseFloat(row.credit),
          remarks: row.remarks,
        })),
      },
    },
  });

  return { success: true };
}

//////// Get Jornal Entries from jornalDetail and purchase

export async function getJournalEntries() {
  const purchases = await prisma.Purchase.findMany({
    include: {
      InventMaster: {
        include: { COA: true },
      },
    },
    where: {
      doc_type: "PV",
    },
  });
  const sales = await prisma.Purchase.findMany({
    include: {
      InventMaster: {
        include: { COA: true },
      },
    },
    where: {
      doc_type: "SV",
    },
  });

  const journalDtls = await prisma.JornalDtl.findMany({
    include: {
      JornalMst: true,
      COA: true,
    },
  });

  const entries = [];

  purchases.forEach((p) => {
    entries.push({
      account_code: p.InventMaster.COA.account_code,
      account_name: p.InventMaster.COA.account_name,
      date: p.InventMaster.dated,
      doc_type: p.doc_type,
      debit: p.amount,
      credit: 0,
      remarks: p.remarks || "",
    });
  });

  sales.forEach((p) => {
    entries.push({
      account_code: p.InventMaster.COA.account_code,
      account_name: p.InventMaster.COA.account_name,
      date: p.InventMaster.dated,
      doc_type: p.doc_type,
      // debit: p.amount,
      debit: 0,
      credit: p.amount,
      remarks: p.remarks || "",
    });
  });

  journalDtls.forEach((j) => {
    entries.push({
      account_code: j.account_code,
      account_name: j.COA.account_name,
      date: j.JornalMst.dated,
      doc_type: j.doc_type,
      debit: j.debit,
      credit: j.credit,
      remarks: j.remarks || "",
    });
  });

  entries.sort((a, b) => {
    if (a.account_code !== b.account_code) {
      return a.account_code.localeCompare(b.account_code);
    }
    return new Date(a.date) - new Date(b.date);
  });

  const result = [];
  const balances = {};

  entries.forEach((e) => {
    if (!balances[e.account_code]) balances[e.account_code] = 0;
    balances[e.account_code] += e.debit - e.credit;

    result.push({
      ...e,
      balance: balances[e.account_code],
    });
  });

  return result;
}

//////////// Get Journal Entries function

export async function getJournalEntries1(
  searchTerm = "",
  fromDate = null,
  toDate = null
) {
  const dateFilter =
    fromDate && toDate
      ? {
          dated: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        }
      : {};

  const [purchases, sales, saleReturn, purchaseReturn, journalDtls] =
    await Promise.all([
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "PV",
          dated: dateFilter.dated ? dateFilter.dated : undefined,
        },
      }),
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "SV",
          dated: dateFilter.dated ? dateFilter.dated : undefined,
        },
      }),
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "SR",
          dated: dateFilter.dated ? dateFilter.dated : undefined,
        },
      }),
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "PR",
          dated: dateFilter.dated ? dateFilter.dated : undefined,
        },
      }),
      prisma.JornalDtl.findMany({
        include: {
          JornalMst: true,
          COA: true,
        },
        where:
          fromDate && toDate
            ? {
                JornalMst: {
                  dated: {
                    gte: new Date(fromDate),
                    lte: new Date(toDate),
                  },
                },
              }
            : {},
      }),
    ]);

  const entries = [];
  const openingBalances = {};

  // Calculate opening balances if date range is specified
  if (fromDate) {
    const [
      openingPurchases,
      openingSales,
      openingSaleReturn,
      openingPurchaseReturn,
      openingJournalDtls,
    ] = await Promise.all([
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "PV",
          dated: {
            lt: new Date(fromDate),
          },
        },
      }),
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "SV",
          dated: {
            lt: new Date(fromDate),
          },
        },
      }),
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "SR",
          dated: {
            lt: new Date(fromDate),
          },
        },
      }),
      prisma.inventMaster.findMany({
        include: {
          COA: true,
          Purchase: {
            include: {
              Product: true,
            },
          },
        },
        where: {
          doc_type: "PR",
          dated: {
            lt: new Date(fromDate),
          },
        },
      }),
      prisma.JornalDtl.findMany({
        include: { JornalMst: true, COA: true },
        where: {
          JornalMst: {
            dated: {
              lt: new Date(fromDate),
            },
          },
        },
      }),
    ]);

    // Process opening Purchases (PV) - CORRECTED
    openingPurchases.forEach((p) => {
      const partyAccountCode = p.purchase_code;
      const purchaseAccountCode = p.purchase_or_sale_account;
      const cashAccountCode = "20010005";
      const jazzCashAccountCode = "20010006";

      openingBalances[partyAccountCode] =
        (openingBalances[partyAccountCode] || 0) - p.bill_amount;

      // Purchase account gets debit (expense increases)
      openingBalances[purchaseAccountCode] =
        (openingBalances[purchaseAccountCode] || 0) + p.bill_amount;

      // Cash payments reduce cash account
      if (p.cash && p.cash > 0) {
        openingBalances[cashAccountCode] =
          (openingBalances[cashAccountCode] || 0) - p.cash;
        // Party gets debit for cash payment (reduces liability)
        openingBalances[partyAccountCode] =
          (openingBalances[partyAccountCode] || 0) + p.cash;
      }

      // JazzCash payments reduce jazz cash account
      if (p.jazz_cash && p.jazz_cash > 0) {
        openingBalances[jazzCashAccountCode] =
          (openingBalances[jazzCashAccountCode] || 0) - p.jazz_cash;
        // Party gets debit for jazz cash payment (reduces liability)
        openingBalances[partyAccountCode] =
          (openingBalances[partyAccountCode] || 0) + p.jazz_cash;
      }
    });

    // Process opening Sales (SV) - CORRECTED
    openingSales.forEach((s) => {
      // For Sales:
      const partyAccountCode = s.purchase_code;
      const saleAccountCode = s.purchase_or_sale_account;
      const cashAccountCode = "20010005";
      const jazzCashAccountCode = "20010006";

      // Party gets debit (they owe us money)
      openingBalances[partyAccountCode] =
        (openingBalances[partyAccountCode] || 0) + s.bill_amount;

      // Sale account gets credit (revenue increases)
      openingBalances[saleAccountCode] =
        (openingBalances[saleAccountCode] || 0) - s.bill_amount;

      // Cash receipts increase cash account
      if (s.cash && s.cash > 0) {
        openingBalances[cashAccountCode] =
          (openingBalances[cashAccountCode] || 0) + s.cash;
        // Party gets credit for cash receipt (reduces receivable)
        openingBalances[partyAccountCode] =
          (openingBalances[partyAccountCode] || 0) - s.cash;
      }

      // JazzCash receipts increase jazz cash account
      if (s.jazz_cash && s.jazz_cash > 0) {
        openingBalances[jazzCashAccountCode] =
          (openingBalances[jazzCashAccountCode] || 0) + s.jazz_cash;
        // Party gets credit for jazz cash receipt (reduces receivable)
        openingBalances[partyAccountCode] =
          (openingBalances[partyAccountCode] || 0) - s.jazz_cash;
      }
    });

    // Process opening Sale Returns (SR) - CORRECTED
    openingSaleReturn.forEach((sr) => {
      // For Sale Returns:

      const partyAccountCode = sr.purchase_code;
      const saleAccountCode = sr.purchase_or_sale_account;

      openingBalances[partyAccountCode] =
        (openingBalances[partyAccountCode] || 0) - sr.bill_amount;
      openingBalances[saleAccountCode] =
        (openingBalances[saleAccountCode] || 0) + sr.bill_amount;
    });

    // Process opening Purchase Returns (PR) - CORRECTED
    openingPurchaseReturn.forEach((pr) => {
      // For Purchase Returns:

      const partyAccountCode = pr.purchase_code;
      const purchaseAccountCode = pr.purchase_or_sale_account;

      openingBalances[partyAccountCode] =
        (openingBalances[partyAccountCode] || 0) + pr.bill_amount;
      openingBalances[purchaseAccountCode] =
        (openingBalances[purchaseAccountCode] || 0) - pr.bill_amount;
    });

    // Process opening Journal Entries - CORRECTED
    openingJournalDtls.forEach((j) => {
      const accountCode = j.account_code;
      // In journal entries, debit increases asset/expense, credit decreases them
      // For liability/equity, credit increases, debit decreases
      openingBalances[accountCode] =
        (openingBalances[accountCode] || 0) + (j.debit - j.credit);
    });
  }

  // Process current period Purchases Voucher for Party (PV) - CORRECTED
  purchases.forEach((p) => {
    const itemDetails = p.Purchase.map(
      (purchase) =>
        `${purchase.Product?.product_name || "N/A"} - ${
          purchase.Product?.design_number || "N/A"
        } - Qty:${purchase.quantity} - Price:${purchase.price}`
    ).join(", ");

    // Party account CREDIT for total bill amount (we owe money)
    entries.push({
      account_code: p.purchase_code,
      account_name: p.COA.account_name,
      date: p.dated,
      doc_type: p.doc_type,
      doc_id: p.doc_id,
      debit: 0,
      credit: p.bill_amount,
      remarks: p.remarks || "Purchase from party",
      item_details: itemDetails,
    });

    // Purchase account DEBIT for total bill amount (expense increases)
    entries.push({
      account_code: p.purchase_or_sale_account,
      account_name: "Purchase Account",
      date: p.dated,
      doc_type: p.doc_type,
      doc_id: p.doc_id,
      debit: p.bill_amount,
      credit: 0,
      remarks: p.remarks || "Purchase account debit",
      item_details: itemDetails,
    });

    // Cash payments - Party gets DEBIT (reduces liability), Cash gets CREDIT
    if (p.cash && p.cash > 0) {
      entries.push({
        account_code: p.purchase_code,
        account_name: p.COA.account_name,
        date: p.dated,
        doc_type: p.doc_type,
        doc_id: p.doc_id,
        debit: p.cash,
        credit: 0,
        remarks: p.remarks || "Cash Paid to party",
        item_details: itemDetails,
      });

      entries.push({
        account_code: "20010005",
        account_name: "Cash Account",
        date: p.dated,
        doc_type: p.doc_type,
        doc_id: p.doc_id,
        debit: 0,
        credit: p.cash,
        remarks: p.remarks || "Cash credit paid to party",
        item_details: itemDetails,
      });
    }

    // JazzCash payments - Party gets DEBIT (reduces liability), JazzCash gets CREDIT
    if (p.jazz_cash && p.jazz_cash > 0) {
      entries.push({
        account_code: p.purchase_code,
        account_name: p.COA.account_name,
        date: p.dated,
        doc_type: p.doc_type,
        doc_id: p.doc_id,
        debit: p.jazz_cash,
        credit: 0,
        remarks: p.remarks || "Jazz Cash Paid to party",
        item_details: itemDetails,
      });

      entries.push({
        account_code: "20010006",
        account_name: "Jazz Cash Account",
        date: p.dated,
        doc_type: p.doc_type,
        doc_id: p.doc_id,
        debit: 0,
        credit: p.jazz_cash,
        remarks: p.remarks || "Jazz Cash credit paid to party",
        item_details: itemDetails,
      });
    }
  });

  // Process current period Sales (SV) - CORRECTED
  sales.forEach((s) => {
    const itemDetails = s.Purchase.map(
      (purchase) =>
        `${purchase.Product?.product_name || "N/A"} - ${
          purchase.Product?.design_number || "N/A"
        } - Qty:${purchase.quantity} - Price:${purchase.price}`
    ).join(", ");

    // Party account DEBIT for total bill amount (they owe us money)
    entries.push({
      account_code: s.purchase_code,
      account_name: s.COA.account_name,
      date: s.dated,
      doc_type: s.doc_type,
      doc_id: s.doc_id,
      debit: s.bill_amount,
      credit: 0,
      remarks: s.remarks || "Sale to Party",
      item_details: itemDetails,
    });

    // Sale account CREDIT for total bill amount (revenue increases)
    entries.push({
      account_code: s.purchase_or_sale_account,
      account_name: "Sale Account",
      date: s.dated,
      doc_type: s.doc_type,
      doc_id: s.doc_id,
      debit: 0,
      credit: s.bill_amount,
      remarks: s.remarks || "Sale Account Credit",
      item_details: itemDetails,
    });

    // Cash receipts - Party gets CREDIT (reduces receivable), Cash gets DEBIT
    if (s.cash && s.cash > 0) {
      entries.push({
        account_code: s.purchase_code,
        account_name: s.COA.account_name,
        date: s.dated,
        doc_type: s.doc_type,
        doc_id: s.doc_id,
        debit: 0,
        credit: s.cash,
        remarks: s.remarks || "Cash Amount receive",
        item_details: itemDetails,
      });

      entries.push({
        account_code: "20010005",
        account_name: "Cash Account",
        date: s.dated,
        doc_type: s.doc_type,
        doc_id: s.doc_id,
        debit: s.cash,
        credit: 0,
        remarks: s.remarks || "Cash debit received from party",
        item_details: itemDetails,
      });
    }

    // JazzCash receipts - Party gets CREDIT (reduces receivable), JazzCash gets DEBIT
    if (s.jazz_cash && s.jazz_cash > 0) {
      entries.push({
        account_code: s.purchase_code,
        account_name: s.COA.account_name,
        date: s.dated,
        doc_type: s.doc_type,
        doc_id: s.doc_id,
        debit: 0,
        credit: s.jazz_cash,
        remarks: s.remarks || "Jazz Cash Amount receive",
        item_details: itemDetails,
      });

      entries.push({
        account_code: "20010006",
        account_name: "Jazz Cash Account",
        date: s.dated,
        doc_type: s.doc_type,
        doc_id: s.doc_id,
        debit: s.jazz_cash,
        credit: 0,
        remarks: s.remarks || "Jazz Cash debit received from party",
        item_details: itemDetails,
      });
    }
  });

  // Process current period Sale Returns (SR) - CORRECTED
  saleReturn.forEach((sr) => {
    const itemDetails = sr.Purchase.map(
      (purchase) =>
        `${purchase.Product?.product_name || "N/A"} - ${
          purchase.Product?.design_number || "N/A"
        } - Qty:${purchase.quantity} - Price:${purchase.price}`
    ).join(", ");

    // Party gets CREDIT (reduces receivable)
    entries.push({
      account_code: sr.purchase_code,
      account_name: sr.COA.account_name,
      date: sr.dated,
      doc_type: sr.doc_type,
      doc_id: sr.doc_id,
      debit: 0,
      credit: sr.bill_amount,
      remarks: sr.remarks || "Sale Return from Party",
      item_details: itemDetails,
    });

    // Sale account gets DEBIT (reduces revenue)
    entries.push({
      account_code: sr.purchase_or_sale_account,
      account_name: "Sale Account",
      date: sr.dated,
      doc_type: sr.doc_type,
      doc_id: sr.doc_id,
      debit: sr.bill_amount,
      credit: 0,
      remarks: sr.remarks || "Sale Return from Party",
      item_details: itemDetails,
    });
  });

  // Process current period Purchase Returns (PR) - CORRECTED
  purchaseReturn.forEach((pr) => {
    const itemDetails = pr.Purchase.map(
      (purchase) =>
        `${purchase.Product?.product_name || "N/A"} - ${
          purchase.Product?.design_number || "N/A"
        } - Qty:${purchase.quantity} - Price:${purchase.price}`
    ).join(", ");

    // Party gets DEBIT (reduces liability)
    entries.push({
      account_code: pr.purchase_code,
      account_name: pr.COA.account_name,
      date: pr.dated,
      doc_type: pr.doc_type,
      doc_id: pr.doc_id,
      debit: pr.bill_amount,
      credit: 0,
      remarks: pr.remarks || "Purchase Return to Party",
      item_details: itemDetails,
    });

    // Purchase account gets CREDIT (reduces expense)
    entries.push({
      account_code: pr.purchase_or_sale_account,
      account_name: "Purchase Account",
      date: pr.dated,
      doc_type: pr.doc_type,
      doc_id: pr.doc_id,
      debit: 0,
      credit: pr.bill_amount,
      remarks: pr.remarks || "Purchase Return to Party",
      item_details: itemDetails,
    });
  });

  // Process current period Journal Entries
  journalDtls.forEach((j) => {
    entries.push({
      account_code: j.account_code,
      account_name: j.COA.account_name,
      date: j.JornalMst.dated,
      doc_type: j.doc_type,
      doc_id: j.JornalMst.doc_id || null,
      debit: j.debit,
      credit: j.credit,
      remarks: j.remarks || "",
      item_details: "",
    });
  });

  // Filter entries based on search term
  const filtered = entries.filter(
    (e) =>
      e.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.item_details &&
        e.item_details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort entries by account code and date
  filtered.sort((a, b) => {
    if (a.account_code !== b.account_code) {
      return a.account_code.localeCompare(b.account_code);
    }
    return new Date(a.date) - new Date(b.date);
  });

  // Group entries by account and calculate running balances
  const result = [];
  const accounts = {};

  // Group entries by account code
  filtered.forEach((e) => {
    if (!accounts[e.account_code]) {
      accounts[e.account_code] = {
        entries: [],
        account_name: e.account_name,
      };
    }
    accounts[e.account_code].entries.push(e);
  });

  // Process each account
  Object.entries(accounts).forEach(([accountCode, accountData]) => {
    let balance = openingBalances[accountCode] || 0;

    // Add opening balance row if date range is specified
    if (fromDate) {
      result.push({
        account_code: accountCode,
        account_name: accountData.account_name,
        date: new Date(fromDate),
        doc_type: "OB",
        doc_id: null,
        debit: 0,
        credit: 0,
        balance: balance,
        isOpeningBalance: true,
        remarks: "Opening Balance",
        item_details: "",
      });
    }

    // Add regular entries
    accountData.entries.forEach((e) => {
      balance += e.debit - e.credit;
      result.push({
        ...e,
        balance: balance,
      });
    });
  });

  // Sort final result by account code and date
  result.sort((a, b) => {
    if (a.account_code !== b.account_code) {
      return a.account_code.localeCompare(b.account_code);
    }
    return new Date(a.date) - new Date(b.date);
  });

  return {
    entries: result,
    partyBalances: openingBalances,
  };
}

//////////////////////////////// Trial balance  Formula

export async function getTrialBalance() {
  try {
    // Get all COA accounts with their nature
    const accounts = await prisma.COA.findMany({
      select: {
        account_code: true,
        account_name: true,
        account_nature: true,
      },
      orderBy: {
        account_code: "asc",
      },
    });

    // Get all journal entries
    const journalEntries = await prisma.JornalDtl.findMany({
      include: {
        JornalMst: true,
      },
    });

    // Get all inventory transactions
    const inventoryTransactions = await prisma.inventMaster.findMany({
      include: {
        Purchase: true,
      },
      where: {
        doc_type: { in: ["PV", "SV", "SR", "PR"] },
      },
    });

    // Initialize account balances
    const accountBalances = {};
    accounts.forEach((account) => {
      accountBalances[account.account_code] = {
        account_name: account.account_name,
        account_nature: account.account_nature,
        debit: 0,
        credit: 0,
      };
    });
    // console.log("accountBalances==", accountBalances);
    // Process journal entries
    journalEntries.forEach((entry) => {
      if (accountBalances[entry.account_code]) {
        accountBalances[entry.account_code].debit += entry.debit;
        accountBalances[entry.account_code].credit += entry.credit;
      }
    });

    // Process inventory transactions with proper double-entry accounting
    inventoryTransactions.forEach((transaction) => {
      // For each transaction, ensure debit = credit
      if (transaction.doc_type === "PV") {
        // Purchase
        // Debit: Purchase Account (expense)
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].debit +=
            transaction.bill_amount;
        }
        // Credit: Party Account (payable) or Cash/Bank
        if (accountBalances[transaction.purchase_code]) {
          accountBalances[transaction.purchase_code].credit +=
            transaction.bill_amount;
        }

        // Handle cash payments
        if (transaction.cash > 0) {
          // Debit: Party Account (payable) - reduced by cash payment
          if (accountBalances[transaction.purchase_code]) {
            accountBalances[transaction.purchase_code].debit +=
              transaction.cash;
          }
          // Credit: Cash Account
          if (accountBalances["20010005"]) {
            accountBalances["20010005"].credit += transaction.cash;
          }
        }

        // Handle jazz cash payments
        if (transaction.jazz_cash > 0) {
          // Debit: Party Account (payable) - reduced by jazz cash payment
          if (accountBalances[transaction.purchase_code]) {
            accountBalances[transaction.purchase_code].debit +=
              transaction.jazz_cash;
          }
          // Credit: Jazz Cash Account
          if (accountBalances["20010006"]) {
            accountBalances["20010006"].credit += transaction.jazz_cash;
          }
        }
      } else if (transaction.doc_type === "SV") {
        // Sale
        // Debit: Party Account (receivable) or Cash/Bank
        if (accountBalances[transaction.purchase_code]) {
          accountBalances[transaction.purchase_code].debit +=
            transaction.bill_amount;
        }
        // Credit: Sale Account (revenue)
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].credit +=
            transaction.bill_amount;
        }

        // Handle cash receipts
        if (transaction.cash > 0) {
          // Debit: Cash Account
          if (accountBalances["20010005"]) {
            accountBalances["20010005"].debit += transaction.cash;
          }
          // Credit: Party Account (receivable) - reduced by cash receipt
          if (accountBalances[transaction.purchase_code]) {
            accountBalances[transaction.purchase_code].credit +=
              transaction.cash;
          }
        }

        // Handle jazz cash receipts
        if (transaction.jazz_cash > 0) {
          // Debit: Jazz Cash Account
          if (accountBalances["20010006"]) {
            accountBalances["20010006"].debit += transaction.jazz_cash;
          }
          // Credit: Party Account (receivable) - reduced by jazz cash receipt
          if (accountBalances[transaction.purchase_code]) {
            accountBalances[transaction.purchase_code].credit +=
              transaction.jazz_cash;
          }
        }
      } else if (transaction.doc_type === "SR") {
        // Sale Return
        // Debit: Sale Account (revenue) - reduced by return
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].debit +=
            transaction.bill_amount;
        }
        // Credit: Party Account (receivable) - reduced by return
        if (accountBalances[transaction.purchase_code]) {
          accountBalances[transaction.purchase_code].credit +=
            transaction.bill_amount;
        }
      } else if (transaction.doc_type === "PR") {
        // Purchase Return
        // Debit: Party Account (payable) - reduced by return
        if (accountBalances[transaction.purchase_code]) {
          accountBalances[transaction.purchase_code].debit +=
            transaction.bill_amount;
        }
        // Credit: Purchase Account (expense) - reduced by return
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].credit +=
            transaction.bill_amount;
        }
      }
    });

    // Prepare trial balance data
    const trialBalance = [];
    let totalDebit = 0;
    let totalCredit = 0;
    let totalClosingDebit = 0;
    let totalClosingCredit = 0;

    Object.entries(accountBalances).forEach(([account_code, account]) => {
      const { debit, credit, account_nature } = account;

      // Only include accounts with activity
      if (debit > 0 || credit > 0) {
        let closingBalance = 0;
        let balanceType = "";

        if (["asset", "expense", "receiveable"].includes(account_nature)) {
          // Normal balance is debit
          closingBalance = debit - credit;
          balanceType = closingBalance >= 0 ? "Debit" : "Credit";
        } else {
          // Normal balance is credit (revenue, payable)
          closingBalance = credit - debit;
          balanceType = closingBalance >= 0 ? "Credit" : "Debit";
        }

        const absClosingBalance = Math.abs(closingBalance);

        if (balanceType === "Debit") {
          totalClosingDebit += absClosingBalance;
        } else {
          totalClosingCredit += absClosingBalance;
        }

        totalDebit += debit;
        totalCredit += credit;

        trialBalance.push({
          account_code,
          account_name: account.account_name,
          account_nature: account_nature,
          debit,
          credit,
          closing_balance: absClosingBalance,
          balance_type: balanceType,
        });
      }
    });

    // Sort by account code
    trialBalance.sort((a, b) => a.account_code.localeCompare(b.account_code));

    const totals = {
      total_debit: totalDebit,
      total_credit: totalCredit,
      total_closing_debit: totalClosingDebit,
      total_closing_credit: totalClosingCredit,
    };

    // Debug log to check totals
    // console.log("Trial Balance Totals:", totals);
    // console.log(
    //   "Difference:",
    //   Math.abs(totalClosingDebit - totalClosingCredit)
    // );

    return {
      success: true,
      data: trialBalance,
      totals,
    };
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
/////////////////////////////// Prophet and Lost statement
export async function getProfitAndLoss() {
  try {
    // Get all revenue and expense accounts
    const accounts = await prisma.COA.findMany({
      where: {
        account_nature: { in: ["revenue", "expense"] },
      },
      select: {
        account_code: true,
        account_name: true,
        account_nature: true,
      },
      orderBy: {
        account_code: "asc",
      },
    });

    // Get all journal entries
    const journalEntries = await prisma.JornalDtl.findMany();

    // Get all inventory transactions
    const inventoryTransactions = await prisma.inventMaster.findMany({
      include: {
        Purchase: true,
      },
      where: {
        doc_type: { in: ["PV", "SV", "SR", "PR"] },
      },
    });

    // Initialize account balances
    const accountBalances = {};
    accounts.forEach((account) => {
      accountBalances[account.account_code] = {
        account_name: account.account_name,
        account_nature: account.account_nature,
        amount: 0,
      };
    });

    // Process journal entries
    journalEntries.forEach((entry) => {
      if (accountBalances[entry.account_code]) {
        if (accountBalances[entry.account_code].account_nature === "revenue") {
          // Revenue: Credit increases, Debit decreases
          accountBalances[entry.account_code].amount +=
            entry.credit - entry.debit;
        } else {
          // Expense: Debit increases, Credit decreases
          accountBalances[entry.account_code].amount +=
            entry.debit - entry.credit;
        }
      }
    });

    // Process inventory transactions
    inventoryTransactions.forEach((transaction) => {
      if (transaction.doc_type === "SV") {
        // Sale - Revenue
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].amount +=
            transaction.bill_amount;
        }
      } else if (transaction.doc_type === "PV") {
        // Purchase - Expense
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].amount +=
            transaction.bill_amount;
        }
      } else if (transaction.doc_type === "SR") {
        // Sale Return - Reduce Revenue
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].amount -=
            transaction.bill_amount;
        }
      } else if (transaction.doc_type === "PR") {
        // Purchase Return - Reduce Expense
        if (accountBalances[transaction.purchase_or_sale_account]) {
          accountBalances[transaction.purchase_or_sale_account].amount -=
            transaction.bill_amount;
        }
      }
    });

    // Separate revenues and expenses
    const revenues = [];
    const expenses = [];

    Object.entries(accountBalances).forEach(([account_code, account]) => {
      if (account.amount > 0) {
        // Only include accounts with positive balances
        if (account.account_nature === "revenue") {
          revenues.push({
            account_code,
            account_name: account.account_name,
            amount: account.amount,
          });
        } else if (account.account_nature === "expense") {
          expenses.push({
            account_code,
            account_name: account.account_name,
            amount: account.amount,
          });
        }
      }
    });

    // Calculate totals
    const totalRevenue = revenues.reduce((sum, acc) => sum + acc.amount, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const profitLossData = {
      revenues: revenues.sort((a, b) => b.amount - a.amount), // Sort by amount descending
      expenses: expenses.sort((a, b) => b.amount - a.amount), // Sort by amount descending
      summary: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        is_profit: netProfit >= 0,
      },
      generated_date: new Date(),
    };

    return {
      success: true,
      data: profitLossData,
    };
  } catch (error) {
    console.error("Error generating profit and loss statement:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

////////////////////////////////// Get Balance Sheet Only
export async function getBalanceSheet() {
  try {
    // Get trial balance data
    const trialBalanceResult = await getTrialBalance();

    if (!trialBalanceResult.success) {
      throw new Error(trialBalanceResult.error);
    }

    const trialBalance = trialBalanceResult.data;

    // Initialize balance sheet structure
    const balanceSheetData = {
      assets: {
        current_assets: [],
        fixed_assets: [],
        total_current_assets: 0,
        total_fixed_assets: 0,
        total_assets: 0,
      },
      liabilities: {
        current_liabilities: [],
        long_term_liabilities: [],
        total_current_liabilities: 0,
        total_long_term_liabilities: 0,
        total_liabilities: 0,
      },
      equity: {
        capital: [],
        retained_earnings: [],
        net_profit: 0,
        total_equity: 0,
      },
      income_statement: {
        revenues: [],
        expenses: [],
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
      },
    };

    // Process each account from trial balance
    trialBalance.forEach((account) => {
      const accountCode = parseInt(account.account_code);
      const balance =
        account.balance_type === "Debit"
          ? account.closing_balance
          : -account.closing_balance;
      const absoluteBalance = Math.abs(balance);

      const accountData = {
        account_code: account.account_code,
        account_name: account.account_name,
        balance: absoluteBalance,
        balance_type: balance >= 0 ? "Debit" : "Credit",
        original_balance: balance,
      };

      // Categorize based on account code ranges (standard accounting practice)
      if (accountCode >= 1000 && accountCode < 2000) {
        // Asset accounts
        if (accountCode >= 1000 && accountCode < 1500) {
          // Current Assets (Cash, Bank, Receivables, Inventory)
          balanceSheetData.assets.current_assets.push(accountData);
          balanceSheetData.assets.total_current_assets += absoluteBalance;
        } else {
          // Fixed Assets (Property, Plant, Equipment)
          balanceSheetData.assets.fixed_assets.push(accountData);
          balanceSheetData.assets.total_fixed_assets += absoluteBalance;
        }
      } else if (accountCode >= 2000 && accountCode < 3000) {
        // Liability accounts
        if (accountCode >= 2000 && accountCode < 2500) {
          // Current Liabilities (Payables, Short-term debt)
          balanceSheetData.liabilities.current_liabilities.push(accountData);
          balanceSheetData.liabilities.total_current_liabilities +=
            absoluteBalance;
        } else {
          // Long-term Liabilities
          balanceSheetData.liabilities.long_term_liabilities.push(accountData);
          balanceSheetData.liabilities.total_long_term_liabilities +=
            absoluteBalance;
        }
      } else if (accountCode >= 3000 && accountCode < 4000) {
        // Equity accounts
        if (account.account_name.toLowerCase().includes("capital")) {
          balanceSheetData.equity.capital.push(accountData);
          balanceSheetData.equity.total_equity += absoluteBalance;
        } else {
          balanceSheetData.equity.retained_earnings.push(accountData);
          balanceSheetData.equity.total_equity += absoluteBalance;
        }
      } else if (accountCode >= 4000 && accountCode < 5000) {
        // Revenue accounts
        balanceSheetData.income_statement.revenues.push(accountData);
        balanceSheetData.income_statement.total_revenue += absoluteBalance;
      } else if (accountCode >= 5000 && accountCode < 6000) {
        // Expense accounts
        balanceSheetData.income_statement.expenses.push(accountData);
        balanceSheetData.income_statement.total_expenses += absoluteBalance;
      } else {
        // Default to current assets for unknown accounts
        balanceSheetData.assets.current_assets.push(accountData);
        balanceSheetData.assets.total_current_assets += absoluteBalance;
      }
    });

    // Calculate income statement totals
    balanceSheetData.income_statement.net_profit =
      balanceSheetData.income_statement.total_revenue -
      balanceSheetData.income_statement.total_expenses;

    // Add net profit to equity
    balanceSheetData.equity.net_profit =
      balanceSheetData.income_statement.net_profit;
    balanceSheetData.equity.total_equity +=
      balanceSheetData.income_statement.net_profit;

    // Calculate balance sheet totals
    balanceSheetData.assets.total_assets =
      balanceSheetData.assets.total_current_assets +
      balanceSheetData.assets.total_fixed_assets;

    balanceSheetData.liabilities.total_liabilities =
      balanceSheetData.liabilities.total_current_liabilities +
      balanceSheetData.liabilities.total_long_term_liabilities;

    // For proper accounting equation: Assets = Liabilities + Equity
    // We need to ensure the equation balances
    const calculatedEquity =
      balanceSheetData.assets.total_assets -
      balanceSheetData.liabilities.total_liabilities;

    // If there's a discrepancy, adjust retained earnings
    const discrepancy = calculatedEquity - balanceSheetData.equity.total_equity;

    if (Math.abs(discrepancy) > 1) {
      // Only adjust if significant difference
      // Add discrepancy to retained earnings as an adjustment
      balanceSheetData.equity.retained_earnings.push({
        account_code: "ADJUSTMENT",
        account_name: "Balance Adjustment",
        balance: Math.abs(discrepancy),
        balance_type: discrepancy > 0 ? "Credit" : "Debit",
        original_balance: discrepancy,
        is_adjustment: true,
      });

      balanceSheetData.equity.total_equity += discrepancy;
    }

    return {
      success: true,
      data: balanceSheetData,
      asOfDate: new Date().toISOString().split("T")[0],
      discrepancy: discrepancy,
      balanced: Math.abs(discrepancy) <= 1,
    };
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

//////////////////////////////////////// Daily Report //////////////////////////////////////////

// ////////// DashBoard Total Sale,Products,Purchases
export async function getDashboardData() {
  try {
    const [sale, purchase, product] = await Promise.all([
      prisma.Purchase.count({ where: { doc_type: "SV" } }),
      prisma.Purchase.count({ where: { doc_type: "PV" } }),
      prisma.Product.count(),
    ]);
    return { sale, purchase, product };
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    return { sale: 0, purchase: 0, product: 0 }; // Return fallback values
  }
}
////////////// Get Stock Less than 5 items

export async function getStockTableLessFive() {
  try {
    const [purchases, sales, saleReturns, purchaseReturns] = await Promise.all([
      prisma.Purchase.groupBy({
        by: ["product_code"],
        where: { doc_type: "PV" },
        _sum: { quantity: true },
      }),
      prisma.Purchase.groupBy({
        by: ["product_code"],
        where: { doc_type: "SV" },
        _sum: { quantity: true },
      }),
      prisma.Purchase.groupBy({
        by: ["product_code"],
        where: { doc_type: "SR" },
        _sum: { quantity: true },
      }),
      prisma.Purchase.groupBy({
        by: ["product_code"],
        where: { doc_type: "PR" },
        _sum: { quantity: true },
      }),
    ]);

    // Create maps for each transaction type
    const salesMap = {};
    const saleReturnsMap = {};
    const purchaseReturnsMap = {};

    sales.forEach((s) => {
      salesMap[s.product_code] = s._sum.quantity || 0;
    });

    saleReturns.forEach((sr) => {
      saleReturnsMap[sr.product_code] = sr._sum.quantity || 0;
    });

    purchaseReturns.forEach((pr) => {
      purchaseReturnsMap[pr.product_code] = pr._sum.quantity || 0;
    });

    const stockData = await Promise.all(
      purchases.map(async (p) => {
        const product = await prisma.Product.findUnique({
          where: { product_code: p.product_code },
        });

        const purchaseQty = p._sum.quantity || 0;
        const saleQty = salesMap[p.product_code] || 0;
        const saleReturnQty = saleReturnsMap[p.product_code] || 0;
        const purchaseReturnQty = purchaseReturnsMap[p.product_code] || 0;

        // Calculate stock: purchases - sales + sale returns - purchase returns
        const stockQty =
          purchaseQty - saleQty + saleReturnQty - purchaseReturnQty;

        return stockQty < 5
          ? {
              item_code: p.product_code,
              item_name: product?.product_name || "",
              Stock: stockQty,
              doc_type: "Stock",
            }
          : null;
      })
    );

    return stockData.filter(Boolean);
  } catch (error) {
    console.error("Error in getStockTableLessFive:", error);
    return []; // Return empty array as fallback
  }
}
////////////// Create User for login

export async function createUser(formData) {
  await prisma.User.create({
    data: {
      name: formData.get("name"),
      password: await bcrypt.hash(formData.get("password"), 10),
    },
  });
}

/////////////////////////// get second heighest value

// export async function getSecondHighestSalary() {
//   const employees = await prisma.employee.findMany({
//     orderBy: {
//       salary: "desc",
//     },
//     take: 2,
//   });

//   if (employees.length < 2) {
//     return null;
//   }

//   return employees[1];
// }
