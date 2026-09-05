import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, UserCheck, Shield, Sparkles, Send, ArrowRight } from 'lucide-react';

export const LoginLandingView = () => {
  const { login, signup, magicLinkLogin, setRole } = useApp();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup' | 'magic'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRoleSelect] = useState('sales_rep');
  const [magicToken, setMagicToken] = useState('acme-secret-token-9988');

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    await signup(name, email, password, role);
  };

  const handleMagic = async (e) => {
    e.preventDefault();
    await magicLinkLogin(magicToken);
  };

  // Demo Quick Login Shortcuts
  const quickLogin = (selectedRole, demoName, demoEmail) => {
    login(demoEmail, 'password');
    setRole(selectedRole);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Branding Column (5 cols) */}
        <div className="md:col-span-5 space-y-4 text-left">
          <div className="h-12 w-12 rounded-xl bg-charcoal text-cream flex items-center justify-center font-bold text-2xl shadow-md">
            DF
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight font-heading">
            DealFlow360
          </h1>
          
          <p className="text-sm text-muted">
            Intelligent, Self-Governing B2B Sales Operations Platform. Requires authenticated role access to open deal Engine workspace.
          </p>

          <div className="p-3 bg-charcoal-03 border border-warm rounded-lg text-xs space-y-2">
            <span className="font-bold text-charcoal block">⚡ Quick Demo Role Logins:</span>
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => quickLogin('sales_rep', 'Rahul (Sales Rep)', 'rahul@dealflow.com')}
                className="btn btn-sm btn-primary text-[11px] py-1 px-2.5"
              >
                👤 Sales Rep (Rahul)
              </button>
              <button 
                onClick={() => quickLogin('sales_manager', 'Mark Manager', 'mark@dealflow.com')}
                className="btn btn-sm btn-outline text-[11px] py-1 px-2.5"
              >
                👔 Manager
              </button>
              <button 
                onClick={() => quickLogin('finance', 'Fiona Finance', 'fiona@dealflow.com')}
                className="btn btn-sm btn-outline text-[11px] py-1 px-2.5"
              >
                💰 Finance
              </button>
              <button 
                onClick={() => quickLogin('customer', 'ABC Company Customer', 'procurement@abccorp.com')}
                className="btn btn-sm btn-outline text-[11px] py-1 px-2.5"
              >
                🤝 Customer (ABC Corp)
              </button>
              <button 
                onClick={() => quickLogin('admin', 'Alex Admin', 'admin@dealflow.com')}
                className="btn btn-sm btn-outline text-[11px] py-1 px-2.5"
              >
                ⚙️ Admin
              </button>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Column (7 cols) */}
        <div className="md:col-span-7">
          <div className="card bg-cream border border-warm p-6 shadow-xl space-y-5">
            
            {/* Auth Tab Selector */}
            <div className="flex border-b border-warm text-xs font-semibold">
              <button
                onClick={() => setActiveTab('login')}
                className={`pb-2.5 px-4 ${activeTab === 'login' ? 'border-b-2 border-charcoal text-charcoal font-bold' : 'text-muted'}`}
              >
                Internal Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`pb-2.5 px-4 ${activeTab === 'signup' ? 'border-b-2 border-charcoal text-charcoal font-bold' : 'text-muted'}`}
              >
                Team Sign Up
              </button>
              <button
                onClick={() => setActiveTab('magic')}
                className={`pb-2.5 px-4 ${activeTab === 'magic' ? 'border-b-2 border-charcoal text-charcoal font-bold' : 'text-muted'}`}
              >
                Customer Magic Link
              </button>
            </div>

            {/* Tab 1: Internal Login */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="label">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@dealflow.com"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-xs"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2">
                  <span>Authenticate & Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Tab 2: Internal Signup */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3 text-left">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@dealflow.com"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Role Access Scope</label>
                  <select
                    value={role}
                    onChange={(e) => setRoleSelect(e.target.value)}
                    className="select text-xs"
                  >
                    <option value="sales_rep">Sales Rep</option>
                    <option value="sales_manager">Sales Manager / Approver</option>
                    <option value="finance">Finance / Operations</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-full py-2.5 text-xs">
                  Create Internal Account & Authenticate
                </button>
              </form>
            )}

            {/* Tab 3: Customer Magic Link */}
            {activeTab === 'magic' && (
              <form onSubmit={handleMagic} className="space-y-4 text-left">
                <p className="text-xs text-muted">
                  Enter your Customer Quote Magic Token or Email to access restricted online quotation negotiations.
                </p>
                <div>
                  <label className="label">Quote Magic Token or Email</label>
                  <input
                    type="text"
                    value={magicToken}
                    onChange={(e) => setMagicToken(e.target.value)}
                    placeholder="acme-secret-token-9988"
                    className="input text-xs font-mono"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full py-2.5 text-xs">
                  Open Customer Portal View
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
