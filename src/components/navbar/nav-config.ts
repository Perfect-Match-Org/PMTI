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
    label: "Dashboard",
    href: "/dashboard",
    requiresAuth: true,
  },
  {
    label: "Profile",
    href: "/profile",
    requiresAuth: true,
  },
  {
    label: "About",
    href: "/about",
  },
];