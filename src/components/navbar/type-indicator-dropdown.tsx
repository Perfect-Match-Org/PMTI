"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DropdownItem } from "./nav-config";

interface TypeIndicatorDropdownProps {
  dropdown: DropdownItem[];
}

export function TypeIndicatorDropdown({ dropdown }: TypeIndicatorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => setIsOpen(false), 150);
          }
        }}
        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
        data-state={isOpen ? "open" : "closed"}
      >
        Type Indicator
        <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-50 border border-border bg-popover text-popover-foreground shadow-md rounded-md"
          style={{
            top: 'calc(100% + 2vh)',
            right: '-12px',
            minWidth: '480px',
            transform: 'none'
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="w-[480px] p-4">
            {/* Row 1 */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {dropdown.slice(0, 4).map((dropdownItem, index) => (
                <Link
                  key={`row1-${index}-${dropdownItem.href}`}
                  href={dropdownItem.href || '#'}
                  onClick={() => setIsOpen(false)}
                  className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-center"
                >
                  <div className="text-sm font-medium leading-none">
                    {dropdownItem.label || 'Loading...'}
                  </div>
                </Link>
              ))}
            </div>
            <div className="h-px bg-border mb-3"></div>

            {/* Row 2 */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {dropdown.slice(4, 8).map((dropdownItem, index) => (
                <Link
                  key={`row2-${index}-${dropdownItem.href}`}
                  href={dropdownItem.href || '#'}
                  onClick={() => setIsOpen(false)}
                  className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-center"
                >
                  <div className="text-sm font-medium leading-none">
                    {dropdownItem.label || 'Loading...'}
                  </div>
                </Link>
              ))}
            </div>    
            <div className="h-px bg-border mb-3"></div>

            {/* Row 3 */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {dropdown.slice(8, 12).map((dropdownItem, index) => (
                <Link
                  key={`row3-${index}-${dropdownItem.href}`}
                  href={dropdownItem.href || '#'}
                  onClick={() => setIsOpen(false)}
                  className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-center"
                >
                  <div className="text-sm font-medium leading-none">
                    {dropdownItem.label || 'Loading...'}
                  </div>
                </Link>
              ))}
            </div>
            <div className="h-px bg-border mb-3"></div>

            {/* Row 4 */}
            <div className="grid grid-cols-4 gap-2">
              {dropdown.slice(12, 16).map((dropdownItem, index) => (
                <Link
                  key={`row4-${index}-${dropdownItem.href}`}
                  href={dropdownItem.href || '#'}
                  onClick={() => setIsOpen(false)}
                  className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-center"
                >
                  <div className="text-sm font-medium leading-none">
                    {dropdownItem.label || 'Loading...'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}