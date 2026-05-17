"use client";

import React from 'react';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  // This function signs the user in with the specified provider.
  // The scope and other authorization parameters are now correctly handled
  // by the central configuration in your `auth.ts` file.
  const handleLogin = () => {
    signIn('microsoft-entra-id', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-default flex items-center justify-center p-4">
      <div className="bg-background-card p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-text-light mb-4">
          NODA CoPilot
        </h2>
        <p className="text-text-medium mb-8">
          Please log in with your corporate account to continue.
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full flex justify-center items-center gap-3 bg-brand-primary text-text-light py-3 px-4 rounded-md font-semibold hover:bg-brand-accent transition-colors"
        >
          <LogIn size={18} />
          Login with Microsoft
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
