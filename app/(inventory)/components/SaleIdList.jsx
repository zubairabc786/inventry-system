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
import { Check, ChevronsUpDown } from "lucide-react";

const SaleIdList = ({ coaList, onAccountSelect }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="w-full">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
        >
          {selectedAccount ? `${selectedAccount.doc_id}` : "Select account..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command>
          <CommandInput placeholder="Search account by name..." />
          <CommandList>
            <CommandEmpty>No account found.</CommandEmpty>
            <CommandGroup>
              {coaList.map((account) => (
                <CommandItem
                  key={account.doc_id}
                  value={account.doc_id}
                  onSelect={() => {
                    setSelectedAccount(account);
                    onAccountSelect(account);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedAccount?.doc_id === account.doc_id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {account.doc_id}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SaleIdList;
