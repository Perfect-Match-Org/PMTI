
"use client";

import Link from "next/link";
import { COUPLE_TYPES } from "@/lib/constants/coupleTypes";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export interface DropdownItem {
    label: string;
    href: string;
}

// Generate dropdown items from couple types
const generateTypeIndicatorDropdown = (): DropdownItem[] => {
    return Object.values(COUPLE_TYPES)
        .filter(coupleType => coupleType && coupleType.displayName && coupleType.code)
        .map((coupleType) => ({
            label: coupleType.displayName,
            href: `/type/${coupleType.code.toLowerCase().replace(/_/g, '-')}`,
        }));
};

interface TypeIndicatorDropdownProps {
    dropdown?: DropdownItem[];
}

export function TypeIndicatorDropdown({ dropdown = generateTypeIndicatorDropdown() }: TypeIndicatorDropdownProps) {
    return (
        <NavigationMenu viewport={false}>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>
                        <Link href="/type">Type Indicator</Link>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="min-w-[480px] p-4 bg-background border-border !transform-none !translate-x-0 !translate-y-0 ![animation:none] data-[motion]:!transform-none !left-auto !right-0" style={{ marginTop: '2vh' }}>
                        {/* Row 1 */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {dropdown.slice(0, 4).map((dropdownItem, index) => (
                                <NavigationMenuLink key={`row1-${index}-${dropdownItem.href}`} asChild>
                                    <Link href={dropdownItem.href || '#'} className="text-center">
                                        <div className="text-sm font-medium leading-none">
                                            {dropdownItem.label || 'Loading...'}
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            ))}
                        </div>
                        <div className="h-px bg-border mb-3"></div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {dropdown.slice(4, 8).map((dropdownItem, index) => (
                                <NavigationMenuLink key={`row2-${index}-${dropdownItem.href}`} asChild>
                                    <Link href={dropdownItem.href || '#'} className="text-center">
                                        <div className="text-sm font-medium leading-none">
                                            {dropdownItem.label || 'Loading...'}
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            ))}
                        </div>
                        <div className="h-px bg-border mb-3"></div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {dropdown.slice(8, 12).map((dropdownItem, index) => (
                                <NavigationMenuLink key={`row3-${index}-${dropdownItem.href}`} asChild>
                                    <Link href={dropdownItem.href || '#'} className="text-center">
                                        <div className="text-sm font-medium leading-none">
                                            {dropdownItem.label || 'Loading...'}
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            ))}
                        </div>
                        <div className="h-px bg-border mb-3"></div>

                        {/* Row 4 */}
                        <div className="grid grid-cols-4 gap-2">
                            {dropdown.slice(12, 16).map((dropdownItem, index) => (
                                <NavigationMenuLink key={`row4-${index}-${dropdownItem.href}`} asChild>
                                    <Link href={dropdownItem.href || '#'} className="text-center">
                                        <div className="text-sm font-medium leading-none">
                                            {dropdownItem.label || 'Loading...'}
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            ))}
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
