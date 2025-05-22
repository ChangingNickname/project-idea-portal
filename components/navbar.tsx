import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  Logo,
  UserIcon,
} from "@/components/icons";

interface NavbarProps {
  children?: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  return (
    <header className="w-full sticky top-0 z-50 backdrop-blur-sm bg-background/70 border-b border-divider">
      <div className="container mx-auto max-w-7xl px-6 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <p className="font-bold text-inherit">{siteConfig.name}</p>
        </Link>
        {children}
      </div>
    </header>
  );
}
