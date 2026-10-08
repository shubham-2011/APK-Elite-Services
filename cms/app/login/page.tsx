'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Shield, User, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Real-time validation
  const validateUsername = (val: string) => {
    if (!val.trim()) return 'Username is required';
    if (val.trim().length < 2) return 'Username must be at least 2 characters';
    if (val.trim().length > 50) return 'Username is too long';
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  // Update field errors on change
  useEffect(() => {
    if (usernameTouched) setUsernameError(validateUsername(username));
  }, [username, usernameTouched]);

  useEffect(() => {
    if (passwordTouched) setPasswordError(validatePassword(password));
  }, [password, passwordTouched]);

  const isFormValid = !validateUsername(username) && !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark both as touched to show all errors
    setUsernameTouched(true);
    setPasswordTouched(true);

    const uErr = validateUsername(username);
    const pErr = validatePassword(password);
    setUsernameError(uErr);
    setPasswordError(pErr);

    if (uErr || pErr) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials. Please check your username and password.');
        setLoading(false);
        return;
      }

      // Check for redirect param
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get('redirect') || '/';

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Unable to connect to authentication service. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              APK Elite CMS
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Secure Administrative Control Portal
            </p>
          </div>

          {/* Global Error Notice */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Username Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Admin Username <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className={`w-5 h-5 transition-colors ${usernameError ? 'text-rose-400' : username.trim() && !usernameError ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="cms-username"
                  type="text"
                  required
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setUsernameTouched(true)}
                  placeholder="Enter admin username"
                  aria-invalid={!!usernameError}
                  aria-describedby={usernameError ? 'username-error' : undefined}
                  className={`w-full pl-11 pr-10 py-3 bg-slate-800/80 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                    usernameError
                      ? 'border-rose-500/60 focus:ring-rose-500/40'
                      : username.trim() && usernameTouched
                        ? 'border-emerald-500/60 focus:ring-emerald-500/40'
                        : 'border-slate-700 focus:ring-indigo-500 focus:border-transparent'
                  }`}
                />
                {/* Valid checkmark */}
                {username.trim() && !usernameError && usernameTouched && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
              </div>
              {/* Inline error */}
              {usernameError && (
                <p id="username-error" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {usernameError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Master Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 transition-colors ${passwordError ? 'text-rose-400' : password && !passwordError ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="cms-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="Enter your password"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className={`w-full pl-11 pr-11 py-3 bg-slate-800/80 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                    passwordError
                      ? 'border-rose-500/60 focus:ring-rose-500/40'
                      : password && passwordTouched
                        ? 'border-emerald-500/60 focus:ring-emerald-500/40'
                        : 'border-slate-700 focus:ring-indigo-500 focus:border-transparent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Inline error */}
              {passwordError && (
                <p id="password-error" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button — disabled when fields are empty */}
            <button
              type="submit"
              disabled={loading || (!username.trim() && !password)}
              aria-disabled={loading || (!username.trim() && !password)}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none group text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Empty fields hint */}
            {(!username.trim() || !password) && !loading && (
              <p className="text-center text-xs text-slate-500 -mt-1">
                Both username and password are required to sign in
              </p>
            )}
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            Protected with bcrypt password hashing &amp; signed HTTP-only sessions
          </div>
        </div>
      </div>
    </div>
  );
}
