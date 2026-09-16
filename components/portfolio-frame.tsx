"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { LineField } from "@/components/line-field";
import { RippleField } from "@/components/ripple-field";
import { routeFromPathname } from "@/lib/visual-shapes";

const navigation = [
  { href: "/", label: "简介", route: "intro" },
  { href: "/photography", label: "摄影作品", route: "photography" },
  { href: "/projects", label: "项目", route: "projects" },
] as const;

export function PortfolioFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const route = routeFromPathname(pathname);

  return (
    <div className="portfolio-frame" data-route={route}>
      <a className="skip-link" href="#content">
        跳到主要内容
      </a>
      <LineField route={route} />
      <RippleField route={route} />

      <header className="site-header">
        <Link aria-label="返回简介主页" className="site-mark" href="/">
          LIN
        </Link>
        <nav aria-label="主要导航" className="site-nav">
          {navigation.map((item) => (
            <Link
              aria-current={route === item.route ? "page" : undefined}
              className="site-nav__link"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <span className="drag-hint">移动鼠标 · 留下波纹</span>
      </header>

      <main className="page-content" id="content">
        {children}
      </main>
    </div>
  );
}
