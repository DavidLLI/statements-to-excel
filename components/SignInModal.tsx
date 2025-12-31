// Sign-in modal component

"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1 shadow-sm"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Sign-in form */}
        <SignIn
          routing="hash"
          afterSignInUrl="/"
          appearance={{
            elements: {
              rootBox: "m-0 p-0 w-full",
              card: "shadow-none border-0 rounded-lg m-0 p-0 w-full",
              cardBox: "m-0 p-0 w-full",
              main: "p-0 m-0 w-full",
              header: "px-6 pt-6 pb-4",
              headerTitle: "text-xl",
              headerSubtitle: "text-sm",
              form: "px-6 pb-6",
              formButtonPrimary: "mt-4",
              footer: "px-6 pb-6",
              socialButtons: "px-6",
              divider: "px-6",
            },
          }}
        />
      </div>
    </div>
  );
}

