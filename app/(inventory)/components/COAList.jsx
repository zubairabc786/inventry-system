"use client";
import React, { useState, useEffect } from "react";
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

const COAList = ({ coaList, onAccountSelect, value }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [open, setOpen] = useState(false);

  // Sync with external value
  useEffect(() => {
    if (value) {
      const account = coaList.find((acc) => acc.account_code === value);
      if (account) {
        setSelectedAccount(account);
      }
    } else {
      setSelectedAccount(null);
    }
  }, [value, coaList]);

  const handleSelect = (account) => {
    setSelectedAccount(account);
    onAccountSelect(account);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="w-full">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
        >
          {selectedAccount
            ? `${selectedAccount.account_name} (${selectedAccount.account_code})`
            : "Select account..."}
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
                  key={account.account_code}
                  value={account.account_name}
                  onSelect={() => handleSelect(account)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedAccount?.account_code === account.account_code
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {account.account_name} ({account.account_code})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default COAList;
