import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface SiteConfig {
  name: string;
  description: string;
  mainNav: {
    title: string;
    href: string;
  }[];
  links: {
    twitter: string;
    github: string;
    docs: string;
  };
  navItems: {
    label: string;
    href: string;
  }[];
  navMenuItems: {
    label: string;
    href: string;
  }[];
}
