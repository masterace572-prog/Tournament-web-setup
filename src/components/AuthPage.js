// src/components/AuthPage.js

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// ===================================================================
// AuthForm Component (The actual form UI and logic)
// ===================================================================
const AuthForm = ({ isLogin, setIsLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          userID: user.uid,
          username: user.displayName.split(' ').join('').toLowerCase() + Math.floor(Math.random() * 1000),
          email: user.email, inGameName: '', walletBalance: 0, role: 'User', isBanned: false,
          createdAt: new Date(), profilePicUrl: user.photoURL || '',
        });
      }
      // The redirect will be handled by the parent AuthPage component's useEffect
    } catch (error) {
      setError(error.message);
      console.error("Google Sign-In Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!isLogin && !username) {
        setError('Username is required for sign up.');
        setLoading(false);
        return;
    }
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          userID: user.uid, username: username, email: user.email, inGameName: '',
          walletBalance: 0, role: 'User', isBanned: false, createdAt: new Date(), profilePicUrl: '',
        });
      }
      // The redirect will be handled by the parent AuthPage component's useEffect
    } catch (error) {
      setError(error.message);
      console.error("Email Auth Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-lg"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-gray-400 mt-1">{isLogin ? 'Sign in to continue' : 'Join the hub today!'}</p>
      </div>
      {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-3 rounded-md">{error}</p>}
      <form className="space-y-4" onSubmit={handleEmailAuth}>
        {!isLogin && (
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
          </div>
        )}
        <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
        </div>
        <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full py-3 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </motion.button>
      </form>
      <div className="flex items-center justify-center space-x-2">
        <div className="flex-grow h-px bg-gray-600"></div>
        <span className="text-gray-400 text-sm">OR</span>
        <div className="flex-grow h-px bg-gray-600"></div>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center py-3 space-x-3 font-semibold text-gray-700 bg-white rounded-lg hover:bg-gray-200 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
        <FaGoogle />
        <span>Sign in with Google</span>
      </motion.button>
      <p className="text-sm text-center text-gray-400">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-purple-400 hover:underline">{isLogin ? 'Sign Up' : 'Login'}</button>
      </p>
    </motion.div>
  );
};


// ===================================================================
// AuthPage Component (The main wrapper that controls logic)
// ===================================================================
export default function AuthPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  // While checking auth, show a loading screen. Also keep loading if a user is found,
  // because we will be redirecting shortly.
  if (loading || (!loading && currentUser)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-lg">Authenticating...</p>
      </div>
    );
  }

  // Only if loading is done and there is no user, show the full page.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-900">
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-950 bg-[radial-gradient(100%_50%_at_50%_0%,rgba(120,119,198,0.3)_0,rgba(255,255,255,0)_100%)]"></div>
      
      <div className="text-center mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-bold text-white tracking-tight"
        >
          Tournament Hub
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-purple-300 mt-2"
        >
          The Center of Competition.
        </motion.p>
      </div>
      
      {/* Here we render the AuthForm component */}
      <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
    </main>
  );
}