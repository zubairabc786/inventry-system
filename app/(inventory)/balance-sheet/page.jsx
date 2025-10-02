"use client";
import { useState, useEffect } from "react";
import { getBalanceSheet } from "../../action/action";

export default function BalanceSheet() {
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBalanceSheet();

      if (result.success) {
        setBalanceSheet(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load balance sheet");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const AccountSection = ({ title, accounts, total, type = "debit" }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
        {title}
      </h3>
      {accounts.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No accounts</p>
      ) : (
        <>
          {accounts.map((account, index) => (
            <div
              key={account.account_code}
              className="flex justify-between py-2 border-b"
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  {account.account_name}
                  {account.is_adjustment && (
                    <span className="text-xs text-orange-500 ml-2">
                      (Adjustment)
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({account.account_code})
                </span>
              </div>
              <div
                className={`text-sm font-medium ${
                  account.balance_type === "Debit"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(account.balance)}
              </div>
            </div>
          ))}
          <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-300 font-semibold">
            <span>Total {title}</span>
            <span
              className={type === "debit" ? "text-green-600" : "text-red-600"}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">
          Error Loading Balance Sheet
        </div>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <button
          onClick={fetchBalanceSheet}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!balanceSheet) {
    return (
      <div className="text-center text-gray-500 py-8">
        No balance sheet data available
      </div>
    );
  }

  const totalAssets = balanceSheet.assets.total_assets;
  const totalLiabilities = balanceSheet.liabilities.total_liabilities;
  const totalEquity = balanceSheet.equity.total_equity;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) <= 1;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Balance Sheet</h1>
        <p className="text-gray-600">
          As of{" "}
          {new Date(asOfDate).toLocaleDateString("en-PK", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="mt-4">
          <button
            onClick={fetchBalanceSheet}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets Column */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">
            ASSETS
          </h2>

          <AccountSection
            title="Current Assets"
            accounts={balanceSheet.assets.current_assets}
            total={balanceSheet.assets.total_current_assets}
            type="debit"
          />

          <AccountSection
            title="Fixed Assets"
            accounts={balanceSheet.assets.fixed_assets}
            total={balanceSheet.assets.total_fixed_assets}
            type="debit"
          />

          <div className="mt-6 pt-4 border-t-2 border-green-300">
            <div className="flex justify-between text-xl font-bold text-green-800">
              <span>TOTAL ASSETS</span>
              <span>{formatCurrency(totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity Column */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
            LIABILITIES & EQUITY
          </h2>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">
              Liabilities
            </h3>

            <AccountSection
              title="Current Liabilities"
              accounts={balanceSheet.liabilities.current_liabilities}
              total={balanceSheet.liabilities.total_current_liabilities}
              type="credit"
            />

            <AccountSection
              title="Long Term Liabilities"
              accounts={balanceSheet.liabilities.long_term_liabilities}
              total={balanceSheet.liabilities.total_long_term_liabilities}
              type="credit"
            />

            <div className="flex justify-between py-3 mt-2 border-t-2 border-blue-300 font-semibold text-blue-700">
              <span>Total Liabilities</span>
              <span>{formatCurrency(totalLiabilities)}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-700">
              Equity
            </h3>

            <AccountSection
              title="Capital"
              accounts={balanceSheet.equity.capital}
              total={balanceSheet.equity.capital.reduce(
                (sum, acc) => sum + acc.balance,
                0
              )}
              type="credit"
            />

            <AccountSection
              title="Retained Earnings"
              accounts={balanceSheet.equity.retained_earnings}
              total={balanceSheet.equity.retained_earnings.reduce(
                (sum, acc) => sum + acc.balance,
                0
              )}
              type="credit"
            />

            {/* Net Profit/Loss */}
            {balanceSheet.equity.net_profit !== 0 && (
              <div className="mb-4 border-b pb-2">
                <div className="flex justify-between py-2">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      {balanceSheet.equity.net_profit >= 0
                        ? "Net Profit"
                        : "Net Loss"}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      balanceSheet.equity.net_profit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(balanceSheet.equity.net_profit))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between py-3 mt-2 border-t-2 border-purple-300 font-semibold text-purple-700">
              <span>Total Equity</span>
              <span>{formatCurrency(totalEquity)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-blue-300">
            <div className="flex justify-between text-xl font-bold text-blue-800">
              <span>TOTAL LIABILITIES & EQUITY</span>
              <span>{formatCurrency(totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div
        className={`mt-8 p-4 rounded-lg text-center ${
          isBalanced
            ? "bg-green-100 border border-green-300 text-green-800"
            : "bg-orange-100 border border-orange-300 text-orange-800"
        }`}
      >
        <div className="font-semibold">
          {isBalanced
            ? "✓ Balance Sheet is Balanced"
            : "⚠ Balance Sheet Adjustment Made"}
        </div>
        <div className="text-sm mt-1">
          Assets ({formatCurrency(totalAssets)}) = Liabilities (
          {formatCurrency(totalLiabilities)}) + Equity (
          {formatCurrency(totalEquity)})
        </div>
        {!isBalanced && (
          <div className="text-xs mt-2 text-orange-600">
            Note: An adjustment was made to balance the sheet. This usually
            indicates opening balance differences or missing transactions.
          </div>
        )}
      </div>

      {/* Income Statement Summary */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Income Statement Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-green-600 font-semibold">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balanceSheet.income_statement.total_revenue)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-red-600 font-semibold">Total Expenses</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(balanceSheet.income_statement.total_expenses)}
            </div>
          </div>
          <div
            className={`text-center ${
              balanceSheet.income_statement.net_profit >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            <div className="font-semibold">Net Profit/Loss</div>
            <div className="text-2xl font-bold">
              {formatCurrency(balanceSheet.income_statement.net_profit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
