import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, Shield, Sparkles } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, signup } = useApp();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) onClose();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const ok = await signup(name, email, password);
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
            className={`pb-2 px-4 flex-1 text-center ${activeTab === 'login' ? 'border-b-2 border-charcoal text-charcoal font-bold' : 'text-muted'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`pb-2 px-4 flex-1 text-center ${activeTab === 'signup' ? 'border-b-2 border-charcoal text-charcoal font-bold' : 'text-muted'}`}
          >
            Sign Up
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
                required
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
                required
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
                required
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
                required
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
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full py-2 text-xs">
              Create User Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
