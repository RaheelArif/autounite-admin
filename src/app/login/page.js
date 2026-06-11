'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Image from 'next/image';
import { login, isAuthenticated } from '@/lib/auth';
import AdminPageLayout from '@/components/AdminPageLayout';
import AdminAuthGlassCard from '@/components/AdminAuthGlassCard';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('adminpassword123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/search-governance');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/search-governance');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminPageLayout overlayOpacity={0}>
      <main className="au-admin-auth-main">
        <AdminAuthGlassCard>
          <div className="flex justify-center pb-1">
            <Image
              src="/logo.png"
              alt="AutoUnite"
              width={140}
              height={48}
              className="object-contain h-10 w-auto"
              priority
            />
          </div>

          <div className="space-y-1">
            <h1 className="au-auth-title">Admin Sign In</h1>
            <p className="au-auth-desc">Sign in to access the control panel</p>
          </div>

          {error ? (
            <div className="au-auth-alert au-auth-alert--error" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 'var(--au-auth-form-gap)' }}>
            <div className="au-auth-field">
              <label htmlFor="email" className="au-auth-label">
                Email Address
              </label>
              <div className="au-auth-input-wrap">
                <span className="au-auth-input-icon" aria-hidden>
                  <FaEnvelope className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="au-auth-input au-auth-input--with-icon"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="au-auth-field">
              <label htmlFor="password" className="au-auth-label">
                Password
              </label>
              <div className="au-auth-input-wrap">
                <span className="au-auth-input-icon" aria-hidden>
                  <FaLock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="au-auth-input au-auth-input--with-icon au-auth-input--with-toggle"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="au-auth-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="au-auth-submit">
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </AdminAuthGlassCard>
      </main>
    </AdminPageLayout>
  );
}
