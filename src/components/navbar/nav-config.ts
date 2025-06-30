export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  requiresAuth?: boolean;
}

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
    href: "/type",
  }
];
