'use client'
import Link from "next/link";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/sign-up-form";
import { useState } from "react";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.blur();
    setShowLogin(true);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowLogin(true);
  };

  return (
    <main className="min-h-screen bg-black dark:bg-black flex flex-col">
      {/* Header */}
      <nav className="w-full flex items-center justify-between px-8 py-4">
        <Link
          href="/"
          className="text-2xl font-bold text-white dark:text-white tracking-tight"
        >
          Mental Health AI
        </Link>
        <div className="flex items-center gap-4">
          <button
            className="bg-neutral-900 dark:bg-neutral-900 text-white px-4 py-2 rounded-full font-medium"
            onClick={() => setShowLogin(true)}
          >
            Log in
          </button>
          <button
            className="bg-neutral-900 dark:bg-neutral-900 text-white px-4 py-2 rounded-full font-medium"
            onClick={() => setShowSignUp(true)}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Centered Main */}
      <section className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-white dark:text-white mb-8 text-center">
          How have you been feeling today?
        </h1>
        <form className="w-full max-w-2xl flex flex-col items-center" onSubmit={handleFormSubmit}>
          <div className="w-full flex items-center bg-[#171717] dark:bg-neutral-900 rounded-2xl px-6 py-4 mb-6 shadow-lg">
            <Input
              type="text"
              placeholder="Tell me how you feel..."
              className="flex-1 bg-[#171717] text-white dark:text-white text-lg placeholder:text-neutral-400 outline-none border-none"
              onFocus={handleInputFocus}
            />
            <button
              type="submit"
              className="ml-4 bg-neutral-800 dark:bg-neutral-800 hover:bg-neutral-700 dark:hover:bg-neutral-700 p-2 rounded-full"
            >
              <ArrowUpIcon className="h-5 w-5 text-neutral-400" />
            </button>
          </div>
        </form>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-neutral-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Login</h2>
              <button 
                onClick={() => setShowLogin(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <LoginForm />
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-neutral-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Sign Up</h2>
              <button 
                onClick={() => setShowSignUp(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <SignUpForm />
          </div>
        </div>
      )}
    </main>
  );
}