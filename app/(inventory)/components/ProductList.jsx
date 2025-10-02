"use client";
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Check, ChevronsUpDown, Package } from "lucide-react";

const ProductList = ({ productList, handleProductValue }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className="w-full">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full"
          >
            {selectedProduct
              ? `${selectedProduct.product_name}`
              : "Select product..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[400px]">
          <Command>
            <CommandInput placeholder="Search product by name..." />
            <CommandList>
              <CommandEmpty>No product found.</CommandEmpty>
              <CommandGroup>
                {productList.map((product) => (
                  <CommandItem
                    key={product.product_code}
                    value={product.product_name}
                    onSelect={() => {
                      setSelectedProduct(product);
                      handleProductValue(product);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProduct?.product_code === product.product_code
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">
                          {product.product_name}
                        </span>

                        <div className="text-sm text-gray-500">
                          {product.design_number}
                          {/* {product.product_code} */}
                        </div>

                        <div
                          className={cn(
                            "flex items-center text-xs px-2 py-1 rounded-full ml-2",
                            product.stock > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Stock: {product.stock || 0}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProductList;
