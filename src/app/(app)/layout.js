// src/app/(app)/layout.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import { FaHome, FaTrophy, FaWallet, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";

// --- Navbar Component ---
// This is a reusable component for the top navigation bar.
const Navbar = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // After signing out, Firebase's onAuthStateChanged will trigger,
      // and our AppLayout's useEffect will handle the redirect.
      console.log("User signed out successfully.");
      router.push('/'); // Force redirect to login page.
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <h1 className="text-xl font-bold text-purple-400 cursor-pointer" onClick={() => router.push('/dashboard')}>
        Arena Ace
      </h1>
      <div className="flex items-center space-x-4 md:space-x-6">
        <button onClick={() => router.push('/dashboard')} className="hover:text-purple-400 transition-colors flex items-center space-x-1">
          <FaHome />
          <span className="hidden md:inline">Home</span>
        </button>
        <button onClick={() => router.push('/my-tournaments')} className="hover:text-purple-400 transition-colors flex items-center space-x-1">
    <FaTrophy />
    <span className="hidden md:inline">My Tournaments</span>
</button>
        <button onClick={() => router.push('/wallet')} className="hover:text-purple-400 transition-colors flex items-center space-x-1">
    <FaWallet />
    <span className="hidden md:inline">Wallet</span>
</button>
        <button onClick={() => router.push('/profile')} className="hover:text-purple-400 transition-colors flex items-center space-x-1">
    <FaUser />
    <span className="hidden md:inline">Profile</span>
</button>
        <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md transition-colors text-sm font-semibold flex items-center space-x-1">
          <FaSignOutAlt />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

// --- App Layout Component ---
// This is the main layout for all protected pages.
export default function AppLayout({ children }) {
  const { currentUser, loading } = useAuth(); // Destructure both currentUser and loading
  const router = useRouter();

  useEffect(() => {
    // We want to wait until the initial authentication check is complete.
    // The `loading` state from our AuthContext tells us when that's done.
    if (!loading && !currentUser) {
      // If the check is done and there's still no user, then redirect to the login page.
      console.log("AppLayout: No user found after loading, redirecting to login.");
      router.push('/');
    }
  }, [currentUser, loading, router]);

  // While the initial auth state is being determined, show a full-screen loading indicator.
  // This prevents a "flicker" where the user might see the dashboard for a split second before being redirected.
  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        {/* You can add a spinner component here later */}
        <p className="text-xl">Loading Arena Ace...</p>
        <p className="text-sm text-gray-400 mt-2">Authenticating your session</p>
      </div>
    );
  }
  
  // If the auth check is complete and we have a user, render the main app layout.
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}