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
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-6 md:p-10 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        
        {/* Left Branding Column (5 cols) */}
        <div className="md:col-span-5 space-y-5 text-left">
          <div className="h-14 w-14 rounded-2xl bg-charcoal text-cream flex items-center justify-center font-bold text-3xl shadow-lg">
            DF
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal tracking-tight font-heading leading-tight">
            DealFlow360
          </h1>
          
          <p className="text-base md:text-lg text-muted leading-relaxed font-normal">
            Intelligent, Self-Governing B2B Sales Operations Platform. Sign in with client credentials for self-service portal, or admin credentials for full governance operations.
          </p>

          {/* Quick Credential Badges */}
          <div className="p-4 bg-white border border-warm rounded-2xl space-y-3 shadow-sm">
            <span className="text-xs md:text-sm font-bold text-charcoal block uppercase tracking-wider">
              🔑 Configured Accounts:
            </span>
            <div className="space-y-2.5 text-sm">
              <div 
                onClick={() => fillCredentials('client')}
                className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                title="Click to fill Client credentials"
              >
                <div>
                  <div className="font-bold text-emerald-950 text-sm md:text-base flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-700" /> Client / Customer (Default)
                  </div>
                  <div className="text-xs md:text-sm text-emerald-800 font-mono mt-0.5">
                    client@dealflow.com <span className="text-emerald-500 font-sans">/</span> client123
                  </div>
                </div>
                <span className="text-xs font-semibold bg-emerald-200/90 text-emerald-900 px-2.5 py-1 rounded-full">
                  Portal
                </span>
              </div>

              <div 
                onClick={() => fillCredentials('admin')}
                className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 hover:bg-purple-100 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                title="Click to fill Admin credentials"
              >
                <div>
                  <div className="font-bold text-purple-950 text-sm md:text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" /> Admin Account
                  </div>
                  <div className="text-xs md:text-sm text-purple-800 font-mono mt-0.5">
                    admin@dealflow.com <span className="text-purple-500 font-sans">/</span> admin123
                  </div>
                </div>
                <span className="text-xs font-semibold bg-purple-200/90 text-purple-900 px-2.5 py-1 rounded-full">
                  Workspace
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2.5 text-sm text-muted">
              <Shield className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
              <span>Clients build custom quotes & counter-proposals with real-time feedback.</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-muted">
              <Sparkles className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
              <span>Admins review, approve, and orchestrate split fulfillment and billing.</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Column (7 cols) */}
        <div className="md:col-span-7">
          <div className="card bg-cream border border-warm p-8 shadow-2xl rounded-2xl space-y-6">
            
            {/* Auth Tab Selector */}
            <div className="flex border-b border-warm text-sm md:text-base font-semibold">
              <button
                onClick={() => setActiveTab('login')}
                className={`pb-3 px-6 flex-1 text-center transition-all ${
                  activeTab === 'login'
                    ? 'border-b-2 border-charcoal text-charcoal font-bold text-base md:text-lg'
                    : 'text-muted hover:text-charcoal'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`pb-3 px-6 flex-1 text-center transition-all ${
                  activeTab === 'signup'
                    ? 'border-b-2 border-charcoal text-charcoal font-bold text-base md:text-lg'
                    : 'text-muted hover:text-charcoal'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Tab 1: Sign In */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5 text-left">
                <div>
                  <label className="label text-sm">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@dealflow.com"
                    className="input text-base py-3"
                    required
                  />
                </div>
                <div>
                  <label className="label text-sm">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-base py-3"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2.5 shadow-md">
                  <span>Sign In & Open Workspace</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            {/* Tab 2: Sign Up (Defaults to Client/Customer) */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4 text-left">
                <div>
                  <label className="label text-sm">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Saurav Client"
                    className="input text-base py-3"
                    required
                  />
                </div>
                <div>
                  <label className="label text-sm">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="saurav@client.com"
                    className="input text-base py-3"
                    required
                  />
                </div>
                <div>
                  <label className="label text-sm">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-base py-3"
                    required
                  />
                </div>
                <div className="p-3 bg-charcoal-03 border border-warm rounded-xl text-xs md:text-sm text-muted leading-relaxed">
                  ℹ️ New accounts are provisioned as <strong>Client Customer Accounts</strong> by default and connect directly to the Client Self-Service Portal.
                </div>
                <button type="submit" className="btn btn-primary w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2.5 shadow-md">
                  <span>Create Account & Open Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
