import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Shield, Sparkles, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

export const LoginLandingView = () => {
  const { login, signup } = useApp();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'

  const [email, setEmail] = useState('client@dealflow.com');
  const [password, setPassword] = useState('client123');
  const [name, setName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    await signup(name, email, password);
  };

  const fillCredentials = (type) => {
    if (type === 'client') {
      setEmail('client@dealflow.com');
      setPassword('client123');
    } else if (type === 'admin') {
      setEmail('admin@dealflow.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-6 md:p-12 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* Left Branding Column (5 cols) */}
        <div className="md:col-span-5 space-y-5 text-left">
          <div className="h-11 w-11 rounded-xl bg-charcoal text-cream flex items-center justify-center font-bold text-xl shadow-md">
            DF
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-charcoal font-heading leading-tight">
            DealFlow360
          </h1>
          
          <p className="text-sm text-muted leading-relaxed font-normal">
            Intelligent, Self-Governing B2B Sales Operations Platform. Manage end-to-end deal lifecycles, automated multi-depot fulfillment, and contract billing.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2.5 text-xs md:text-sm text-muted">
              <Shield className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
              <span>Self-service customer negotiation with instant margin feedback.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs md:text-sm text-muted">
              <Sparkles className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
              <span>Automated multi-warehouse split engine with live freight optimization.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs md:text-sm text-muted">
              <UserCheck className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
              <span>Role-governed approval queues with progressive risk evaluation.</span>
            </div>
          </div>

          {/* Quick Demo Access (Subtle & Clean) */}
          <div className="pt-2">
            <span className="text-xs text-muted block mb-2 font-medium">Quick Demo Autofill:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('client')}
                className="btn btn-sm text-xs rounded-full px-3.5 py-1.5 flex items-center gap-1.5 bg-white border border-[#e2e2e2] text-black hover:bg-[#efefef] transition-all cursor-pointer shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-black" />
                <span>Client Portal Demo</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="btn btn-sm text-xs rounded-full px-3.5 py-1.5 flex items-center gap-1.5 bg-white border border-[#e2e2e2] text-black hover:bg-[#efefef] transition-all cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>Admin Workspace Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Column (7 cols) */}
        <div className="md:col-span-7">
          <div className="card bg-white border border-warm p-6 md:p-8 shadow-xl rounded-2xl space-y-5">
            
            {/* Auth Tab Selector */}
            <div className="flex border-b border-warm text-sm font-semibold">
              <button
                onClick={() => setActiveTab('login')}
                className={`pb-3 px-6 flex-1 text-center transition-all ${
                  activeTab === 'login'
                    ? 'border-b-2 border-charcoal text-charcoal font-bold text-base'
                    : 'text-muted hover:text-charcoal'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`pb-3 px-6 flex-1 text-center transition-all ${
                  activeTab === 'signup'
                    ? 'border-b-2 border-charcoal text-charcoal font-bold text-base'
                    : 'text-muted hover:text-charcoal'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Tab 1: Sign In */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="label text-xs">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="input text-sm py-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input text-sm py-2.5"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-md mt-2">
                  <span>Sign In & Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Tab 2: Sign Up */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5 text-left">
                <div>
                  <label className="label text-xs">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="input text-sm py-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="input text-sm py-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="input text-sm py-2.5"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-md mt-2">
                  <span>Create Account & Open Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
