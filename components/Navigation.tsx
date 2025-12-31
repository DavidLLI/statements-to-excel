// Navigation component with sign out

"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import SignInModal from "./SignInModal";

export default function Navigation() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  
  // Don't show nav on auth pages
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");
  
  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="/hawk-wallet-logo.svg"
                  alt="Hawk Wallet Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
                <span className="text-xl font-bold text-gray-900">
                  Hawk Wallet
                </span>
              </Link>
            </div>
          <div className="flex items-center space-x-4">
            <a
              href="#contact"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Contact
            </a>
            {isLoaded && user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.emailAddresses[0]?.emailAddress}
                </span>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign In
              </button>
            )}
          </div>
          </div>
        </div>
      </nav>
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </>
  );
}

