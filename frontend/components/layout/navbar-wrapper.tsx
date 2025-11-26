"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
  NavbarButton,
} from "@/components/ui/resizable-navbar";
import { useState, useEffect } from "react";

export function NavbarWrapper() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const tokens = localStorage.getItem("gmail_tokens");
    setIsAuthenticated(!!tokens);
  }, []);

  const handleGmailAuth = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/google");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to get auth URL:", error);
    }
  };

  const navItems = [
    { name: "Home", link: "/" },
    { name: "Features", link: "/features" },
    { name: "About", link: "/about" },
  ];

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        {isAuthenticated ? (
          <NavbarButton as="button" onClick={() => {}} variant="primary">
            Connected
          </NavbarButton>
        ) : (
          <NavbarButton as="button" onClick={handleGmailAuth} variant="primary">
            Connect Gmail
          </NavbarButton>
        )}
      </NavBody>
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </MobileNavHeader>
        <MobileNavMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              className="text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </a>
          ))}
          {isAuthenticated ? (
            <NavbarButton as="button" onClick={() => {}} variant="primary" className="w-full mt-4">
              Connected
            </NavbarButton>
          ) : (
            <NavbarButton as="button" onClick={handleGmailAuth} variant="primary" className="w-full mt-4">
              Connect Gmail
            </NavbarButton>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

