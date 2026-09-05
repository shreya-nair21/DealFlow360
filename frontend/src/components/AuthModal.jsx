import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, Shield, Sparkles } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, signup, magicLinkLogin } = useApp();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup' | 'magic'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('sales_rep');
  const [magicToken, setMagicToken] = useState('acme-secret-token-9988');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) onClose();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const ok = await signup(name, email, password, role);
    if (ok) onClose();
  };

  const handleMagic = async (e) => {
    e.preventDefault();
    const ok = await magicLinkLogin(magicToken);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-cream border border-warm rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm pb-3">
          <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <Lock className="w-5 h-5 text-charcoal" /> DealFlow360 Authentication
          </h3>
          <button onClick={onClose} className="text-muted hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Tabs */}
        <div className="flex border-b border-warm text-xs font-semibold">
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-2 px-3 ${activeTab === 'login' ? 'border-b-2 border-charcoal text-charcoal' : 'text-muted'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`pb-2 px-3 ${activeTab === 'signup' ? 'border-b-2 border-charcoal text-charcoal' : 'text-muted'}`}
          >
            Internal Sign Up
          </button>
          <button
            onClick={() => setActiveTab('magic')}
            className={`pb-2 px-3 ${activeTab === 'magic' ? 'border-b-2 border-charcoal text-charcoal' : 'text-muted'}`}
          >
            Customer Magic Link
          </button>
        </div>

        {/* Tab 1: Internal Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
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
            <button type="submit" className="btn btn-primary w-full py-2 text-xs">
              Sign In to Sales Operations Workspace
            </button>
          </form>
        )}

        {/* Tab 2: Internal Signup */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
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
              <label className="label">Assign Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="select text-xs"
              >
                <option value="sales_rep">Sales Rep</option>
                <option value="sales_manager">Sales Manager / Approver</option>
                <option value="finance">Finance / Operations</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full py-2 text-xs">
              Create Internal User Account
            </button>
          </form>
        )}

        {/* Tab 3: Customer Magic Link */}
        {activeTab === 'magic' && (
          <form onSubmit={handleMagic} className="space-y-3">
            <p className="text-xs text-muted">
              Enter your Customer Quote Magic Token or Email to access online quotation negotiations.
            </p>
            <div>
              <label className="label">Quote Magic Token or Email</label>
              <input
                type="text"
                value={magicToken}
                onChange={(e) => setMagicToken(e.target.value)}
                placeholder="acme-secret-token-9988"
                className="input text-xs"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full py-2 text-xs">
              Open Restricted Customer Portal
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
