import { COUPLE_TYPES, CoupleTypeCode } from '../../lib/constants/coupleTypes';

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  requiresAuth?: boolean;
  dropdown?: DropdownItem[];
}

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
      href: `/type-indicator/${coupleType.code.toLowerCase().replace(/_/g, '-')}`,
    }));
};

export const navigationItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Lobby",
    href: "/lobby",
    requiresAuth: true,
  },
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Type Indicator",
    href: "/type-indicator",
    dropdown: generateTypeIndicatorDropdown(),
  }
];
