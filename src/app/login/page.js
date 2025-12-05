'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Image from 'next/image';
import { login, isAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@autounite.com');
  const [password, setPassword] = useState('SecurePassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Redirect to dashboard on success
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-900 pointer-events-none" />
      
      {/* Login Card */}
      <div className="
        relative w-full max-w-md
        bg-slate-800/80 backdrop-blur-md
        border border-slate-700/50
        rounded-2xl
        shadow-2xl shadow-blue-500/10
        p-8 md:p-10
        space-y-8
      ">
        {/* Logo/Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="
              p-4 rounded-xl
      

           
            ">
              <Image
                src="/logo.png"
                alt="Logo"
                width={160}
                height={60}
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="
            text-3xl md:text-4xl font-bold
            bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500
            bg-clip-text text-transparent
            drop-shadow-[0_0_20px_rgba(96,165,250,0.3)]
          ">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="
            p-4 rounded-lg
            bg-red-500/10 border border-red-500/50
            text-red-400 text-sm
          ">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="
              block text-sm font-medium text-slate-300
            ">
              Email Address
            </label>
            <div className="relative">
              <div className="
                absolute left-4 top-1/2 -translate-y-1/2
                text-slate-400
              ">
                <FaEnvelope className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  w-full pl-12 pr-4 py-3
                  bg-slate-900/50 border border-slate-700/50
                  rounded-lg
                  text-slate-100 placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  focus:border-blue-500/50
                  transition-all duration-300 ease-in-out
                  hover:border-slate-600/50
                "
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="
              block text-sm font-medium text-slate-300
            ">
              Password
            </label>
            <div className="relative">
              <div className="
                absolute left-4 top-1/2 -translate-y-1/2
                text-slate-400
              ">
                <FaLock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  w-full pl-12 pr-12 py-3
                  bg-slate-900/50 border border-slate-700/50
                  rounded-lg
                  text-slate-100 placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  focus:border-blue-500/50
                  transition-all duration-300 ease-in-out
                  hover:border-slate-600/50
                "
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute right-4 top-1/2 -translate-y-1/2
                  text-slate-400 hover:text-blue-400
                  transition-colors duration-300
                  p-1
                "
              >
                {showPassword ? (
                  <FaEyeSlash className="w-5 h-5" />
                ) : (
                  <FaEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="
                  w-4 h-4
                  rounded
                  bg-slate-900/50 border-slate-700/50
                  text-blue-500
                  focus:ring-2 focus:ring-blue-500/50
                  focus:ring-offset-2 focus:ring-offset-slate-800
                "
              />
              <span className="text-sm text-slate-400">Remember me</span>
            </label>
            <a
              href="#"
              className="
                text-sm text-blue-400 hover:text-blue-300
                transition-colors duration-300
                hover:underline
              "
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-3 px-4
              bg-gradient-to-r from-blue-500 to-blue-600
              hover:from-blue-400 hover:to-blue-500
              text-white font-semibold
              rounded-lg
              shadow-lg shadow-blue-500/30
              transition-all duration-300 ease-in-out
              hover:shadow-xl hover:shadow-blue-500/40
              active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:scale-100
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <a
              href="#"
              className="
                text-blue-400 hover:text-blue-300
                transition-colors duration-300
                hover:underline font-medium
              "
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

