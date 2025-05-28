import { type SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "PIP",
  description: "Project Idea Platform",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/shadcn-ui/ui",
    docs: "https://ui.shadcn.com",
  },
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Article Builder",
      href: "/articlebuilder",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Article Builder",
      href: "/articlebuilder",
    },
  ],
};
