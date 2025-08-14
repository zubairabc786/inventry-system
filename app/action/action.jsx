"use server";

import prisma from "../../utils/connection";
import { notFound } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Optional validation
const COASchema = z.object({
  account_code: z.string(),
  account_name: z.string(),
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

//////////// Get Product List Function
export async function getProducts() {
  const products = await prisma.Product.findMany({
    select: {
      product_code: true,
      product_name: true,
      product_type: true,
      sku: true,
      purchase_price: true,
      prophit_percent: true,
      price: true,
    },
  });
  if (!products) {
    return notFound();
  }
  // console.log(products);
  return products;
}

////////////// Update And Delete Product

export async function updateProduct(formData) {
  try {
    const productData = {
      product_name: formData.get("product_name"),
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
  const calculated_discount = parseFloat(formData.get("calculated_discount"));
  // console.log("doc_type=", doc_type);
  const purchase_code = formData.get("purchase_code");
  const dated = new Date(formData.get("dated"));
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

  await prisma.InventMaster.create({
    data: {
      invoice_no: Math.floor(Math.random() * 100000),
      doc_id,
      purchase_code,
      doc_type,
      dated,
      Purchase: {
        create: purchases.map((p) => ({
          ...p,
          total_qty,
          total_item,
          calculated_discount: calculated_discount || 0,
          grandTotal: grandTotal - (calculated_discount || 0),
        })),
      },
    },
  });

  return { success: true, doc_id };
}

// purchaseSheet dropdown data
export async function getDropdownData() {
  const coaList = await prisma.COA.findMany({
    select: { account_code: true, account_name: true },
  });
  const productList = await prisma.Product.findMany({
    select: {
      product_code: true,
      product_name: true,
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

/////////// Get InventMaster and Sale Detail
export async function getInventWithSale() {
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
        doc_type: "SV",
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

//////////// Get Trial Balance

export async function getTrialBalance(fromDate = null, toDate = null) {
  try {
    // Get all journal entries for the period
    const journalEntries = await getJournalEntries1("", fromDate, toDate);

    const trialBalance = {};

    // Process each journal entry
    journalEntries.forEach((entry) => {
      if (!trialBalance[entry.account_code]) {
        trialBalance[entry.account_code] = {
          account_code: entry.account_code,
          account_name: entry.account_name,
          debit: 0,
          credit: 0,
          balance: 0, // This will be debit - credit
        };
      }

      // Skip opening balance entries
      if (entry.isOpeningBalance) return;

      // Handle different document types
      switch (entry.doc_type) {
        case "PV": // Purchase Voucher (expense - normally debit, but shown as credit in journal)
          trialBalance[entry.account_code].credit += entry.credit;
          break;
        case "SV": // Sales Voucher (revenue - normally credit, but shown as debit in journal)
          trialBalance[entry.account_code].debit += entry.debit;
          break;
        case "PR": // Purchase Return (reduction in expense - credit)
          trialBalance[entry.account_code].debit += entry.debit;
          break;
        case "SR": // Sales Return (reduction in revenue - debit)
          trialBalance[entry.account_code].credit += entry.credit;
          break;
        default: // JV (Journal Voucher) and others
          trialBalance[entry.account_code].debit += entry.debit;
          trialBalance[entry.account_code].credit += entry.credit;
          break;
      }

      // Calculate net balance (debit - credit)
      trialBalance[entry.account_code].balance =
        trialBalance[entry.account_code].debit -
        trialBalance[entry.account_code].credit;
    });

    // Convert to array and sort by account code
    const trialBalanceArray = Object.values(trialBalance).sort((a, b) =>
      a.account_code.localeCompare(b.account_code)
    );

    // Calculate totals
    const totalDebit = trialBalanceArray.reduce(
      (sum, acc) => sum + acc.debit,
      0
    );
    const totalCredit = trialBalanceArray.reduce(
      (sum, acc) => sum + acc.credit,
      0
    );
    const netBalance = totalDebit - totalCredit;

    // Add totals row
    trialBalanceArray.push({
      account_code: "TOTAL",
      account_name: "",
      debit: totalDebit,
      credit: totalCredit,
      balance: netBalance,
    });

    // Verify that debits equal credits (accounting equation)
    if (Math.abs(netBalance) > 0.01) {
      // Allow for rounding differences
      console.warn(`Trial balance out of balance by ${netBalance}`);
    }

    return trialBalanceArray;
  } catch (error) {
    console.error("Error generating trial balance:", error);
    throw new Error("Failed to generate trial balance");
  }
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
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "PV",
          InventMaster: dateFilter,
        },
      }),
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "SV",
          InventMaster: dateFilter,
        },
      }),
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "SR",
          InventMaster: dateFilter,
        },
      }),
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "PR",
          InventMaster: dateFilter,
        },
      }),
      prisma.JornalDtl.findMany({
        include: { JornalMst: true, COA: true },
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
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "PV",
          InventMaster: {
            dated: {
              lt: new Date(fromDate),
            },
          },
        },
      }),
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "SV",
          InventMaster: {
            dated: {
              lt: new Date(fromDate),
            },
          },
        },
      }),
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "SR",
          InventMaster: {
            dated: {
              lt: new Date(fromDate),
            },
          },
        },
      }),
      prisma.Purchase.findMany({
        include: { InventMaster: { include: { COA: true } } },
        where: {
          doc_type: "PR",
          InventMaster: {
            dated: {
              lt: new Date(fromDate),
            },
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

    // Process opening Purchases (PV)
    openingPurchases.forEach((p) => {
      const accountCode = p.InventMaster.COA.account_code;
      openingBalances[accountCode] =
        (openingBalances[accountCode] || 0) - p.amount;
    });

    // Process opening Sales (SV)
    openingSales.forEach((p) => {
      const accountCode = p.InventMaster.COA.account_code;
      openingBalances[accountCode] =
        (openingBalances[accountCode] || 0) + p.amount;
    });

    // Process opening Sale Returns (SR)
    openingSaleReturn.forEach((p) => {
      const accountCode = p.InventMaster.COA.account_code;
      openingBalances[accountCode] =
        (openingBalances[accountCode] || 0) - p.amount;
    });

    // Process opening Purchase Returns (PR)
    openingPurchaseReturn.forEach((p) => {
      const accountCode = p.InventMaster.COA.account_code;
      openingBalances[accountCode] =
        (openingBalances[accountCode] || 0) + p.amount;
    });

    // Process opening Journal Entries
    openingJournalDtls.forEach((j) => {
      const accountCode = j.account_code;
      openingBalances[accountCode] =
        (openingBalances[accountCode] || 0) + (j.debit - j.credit);
    });
  }

  // Process current period Purchases (PV)
  purchases.forEach((p) => {
    entries.push({
      account_code: p.InventMaster.COA.account_code,
      account_name: p.InventMaster.COA.account_name,
      date: p.InventMaster.dated,
      doc_type: p.doc_type,
      debit: 0,
      credit: p.amount,
      remarks: p.remarks || "",
    });
  });

  // Process current period Sales (SV)
  sales.forEach((p) => {
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

  // Process current period Sale Returns (SR)
  saleReturn.forEach((p) => {
    entries.push({
      account_code: p.InventMaster.COA.account_code,
      account_name: p.InventMaster.COA.account_name,
      date: p.InventMaster.dated,
      doc_type: p.doc_type,
      debit: 0,
      credit: p.amount,
      remarks: p.remarks || "Sale Return",
    });
  });

  // Process current period Purchase Returns (PR)
  purchaseReturn.forEach((p) => {
    entries.push({
      account_code: p.InventMaster.COA.account_code,
      account_name: p.InventMaster.COA.account_name,
      date: p.InventMaster.dated,
      doc_type: p.doc_type,
      debit: p.amount,
      credit: 0,
      remarks: p.remarks || "Purchase Return",
    });
  });

  // Process current period Journal Entries
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

  // Filter entries based on search term
  const filtered = entries.filter(
    (e) =>
      e.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.account_name.toLowerCase().includes(searchTerm.toLowerCase())
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
        debit: 0,
        credit: 0,
        balance: balance,
        isOpeningBalance: true,
        remarks: "Opening Balance",
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

  return result;
}

////////////// DashBoard Total Sale,Products,Purchases

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
