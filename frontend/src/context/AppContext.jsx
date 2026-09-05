import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const calculateCustomerTier = (orderCount = 0) => {
  const count = Math.max(0, parseInt(orderCount, 10) || 0);
  if (count >= 10) return 'Platinum';
  if (count >= 8) return 'Gold';
  if (count >= 5) return 'Silver';
  if (count >= 3) return 'Bronze';
  return 'Standard';
};

export const TIER_CONFIG = {
  Standard: {
    label: 'Standard',
    minOrders: 0,
    nextTier: 'Bronze',
    nextThreshold: 3,
    discountCeiling: '3%',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-300',
    headerBadge: 'bg-gray-100 text-gray-800 border-gray-300',
    accentColor: '#6b7280',
    iconName: 'Shield',
    emoji: '🛡️',
    description: 'Entry-level customer tier (< 3 orders). 3 orders unlocks Bronze!'
  },
  Bronze: {
    label: 'Bronze',
    minOrders: 3,
    nextTier: 'Silver',
    nextThreshold: 5,
    discountCeiling: '5%',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    headerBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    accentColor: '#b45309',
    iconName: 'Medal',
    emoji: '🥉',
    description: 'Bronze Customer Tier (3–4 orders). 5 orders unlocks Silver!'
  },
  Silver: {
    label: 'Silver',
    minOrders: 5,
    nextTier: 'Gold',
    nextThreshold: 8,
    discountCeiling: '10%',
    badgeColor: 'bg-slate-200 text-slate-800 border-slate-400',
    headerBadge: 'bg-slate-200 text-slate-900 border-slate-400',
    accentColor: '#64748b',
    iconName: 'Award',
    emoji: '🥈',
    description: 'Silver Customer Tier (5–7 orders). 8 orders unlocks Gold!'
  },
  Gold: {
    label: 'Gold',
    minOrders: 8,
    nextTier: 'Platinum',
    nextThreshold: 10,
    discountCeiling: '15%',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-400',
    headerBadge: 'bg-yellow-100 text-yellow-900 border-yellow-400',
    accentColor: '#d97706',
    iconName: 'Crown',
    emoji: '🥇',
    description: 'Gold Customer Tier (8–9 orders). 10 orders unlocks Platinum!'
  },
  Platinum: {
    label: 'Platinum',
    minOrders: 10,
    nextTier: null,
    nextThreshold: null,
    discountCeiling: '20%',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-400',
    headerBadge: 'bg-purple-100 text-purple-900 border-purple-400 shadow-xs',
    accentColor: '#7e22ce',
    iconName: 'Sparkles',
    emoji: '💎',
    description: 'Platinum Elite Customer Tier (10+ orders). Maximum VIP discounts & priority fulfillment!'
  }
};

const INITIAL_SEED_DATA = {
  currentRole: 'customer',
  currentView: 'portal',
  activeQuoteId: 'q-abc',
  
  customers: [
    { id: 'c-client', name: 'Saurav (Client)', tier: 'Silver', orderCount: 5, email: 'client@dealflow.com', repId: 'u-rahul' },
    { id: 'c-abc', name: 'ABC Company', tier: 'Gold', orderCount: 8, email: 'procurement@abccorp.com', repId: 'u-rahul' },
    { id: 'c-1', name: 'Acme Enterprises', tier: 'Platinum', orderCount: 11, email: 'procurement@acme.com', repId: 'u-rahul' },
    { id: 'c-2', name: 'Beta Industries', tier: 'Bronze', orderCount: 3, email: 'purchasing@betaind.com', repId: 'u-rahul' }
  ],

  products: [
    {
      id: 'p-laptop',
      sku: 'HW-LPT-X20',
      name: 'Enterprise Business Laptop X20',
      category: 'Hardware',
      listPrice: 1200,
      costPrice: 800,
      unit: 'Unit',
      description: '14-inch i7, 32GB RAM, 1TB SSD business laptop.'
    },
    {
      id: 'p-install',
      sku: 'SV-INS-ONST',
      name: 'Onsite Laptop Installation & Setup Service',
      category: 'Service',
      listPrice: 1500,
      costPrice: 1100,
      unit: 'Event',
      description: 'Onsite domain joining, OS imaging, and peripheral setup.'
    },
    {
      id: 'p-cloud',
      sku: 'SUB-CLD-1YR',
      name: '1-Year Cloud Suite Annual License',
      category: 'Subscription',
      listPrice: 360,
      costPrice: 90,
      unit: 'License/Yr',
      isRecurring: true
    },
    {
      id: 'p-dock',
      sku: 'HW-DSK-99',
      name: 'Universal Thunderbolt Docking Station',
      category: 'Hardware',
      listPrice: 350,
      costPrice: 180,
      unit: 'Unit',
      description: 'Dual 4K display dock with 100W power delivery.'
    }
  ],

  discountRules: {
    globalTierCeilings: { Standard: 3, Bronze: 5, Silver: 10, Gold: 15, Platinum: 20 },
    categoryCeilings: {
      Hardware: { Standard: 3, Bronze: 5, Silver: 10, Gold: 15, Platinum: 20 },
      Service: { Standard: 2, Bronze: 3, Silver: 7, Gold: 10, Platinum: 15 },
      Subscription: { Standard: 3, Bronze: 5, Silver: 12, Gold: 20, Platinum: 25 }
    },
    thresholds: { managerApprovalRiskScore: 0.01, financeApprovalRiskScore: 12.0 }
  },

  warehouses: [
    { 
      id: 'wh-main', 
      name: 'Main Distribution Center (Central Hub)', 
      location: 'Chicago, IL', 
      shippingWeightCost: 1.0, 
      baseCost: 15, 
      perUnitCost: 4, 
      eta: '2 Business Days',
      carrier: 'FedEx Freight Direct',
      isPrimary: true,
      stock: { 'p-laptop': 12, 'p-dock': 60 } 
    },
    { 
      id: 'wh-east', 
      name: 'East Coast Fast-Fulfillment Depot', 
      location: 'Newark, NJ', 
      shippingWeightCost: 1.4, 
      baseCost: 20, 
      perUnitCost: 6, 
      eta: '1-2 Business Days',
      carrier: 'UPS Ground Regional',
      isPrimary: false,
      stock: { 'p-laptop': 6, 'p-dock': 30 } 
    },
    { 
      id: 'wh-west', 
      name: 'West Coast Logistics Hub', 
      location: 'San Francisco, CA', 
      shippingWeightCost: 1.6, 
      baseCost: 25, 
      perUnitCost: 7, 
      eta: '3 Business Days',
      carrier: 'OnTrac Express Freight',
      isPrimary: false,
      stock: { 'p-laptop': 8, 'p-dock': 25 } 
    }
  ],

  subscriptionPlans: [
    { id: 'sub-plan-yearly', name: 'Annual Cloud Suite', frequency: 'Yearly', prorationRule: 'Monthly Block Proration' }
  ],

  upsellRules: [
    {
      triggerProductId: 'p-laptop',
      suggestedProductId: 'p-dock',
      reason: 'Recommended Dock: 88% of Laptop customers add Thunderbolt Docks for office setups.',
      marginDelta: 4.8,
      isPromoted: true
    }
  ],

  quotations: [
    {
      id: 'q-abc',
      code: 'QT-2026-ABC',
      customerId: 'c-abc', // ABC Company (Gold Tier)
      repId: 'u-rahul',
      repName: 'Rahul',
      status: 'Draft',
      portalToken: 'abc-secret-token-2026',
      daysInactive: 1,
      lines: [
        { id: 'ql-laptop', productId: 'p-laptop', quantity: 20, unitPrice: 1200, discountPct: 12 }, // Gold Hardware (allowed 15%) -> OK
        { id: 'ql-install', productId: 'p-install', quantity: 1, unitPrice: 1500, discountPct: 18 }, // Gold Service (allowed 10%) -> OVER LIMIT by 8 points!
        { id: 'ql-cloud', productId: 'p-cloud', quantity: 20, unitPrice: 360, discountPct: 10 } // Gold Subscription (allowed 20%) -> OK
      ],
      comments: [
        { id: 'cm-init', sender: 'Sales Rep (Rahul)', role: 'sales_rep', text: 'Created quote for ABC Company request (20 Laptops + Installation + 1-Year Cloud). Applied special service discount.', timestamp: new Date().toISOString() }
      ]
    }
  ],

  approvalLogs: []
};

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('dealflow360_frontend_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.quotations) && Array.isArray(parsed.products)) {
          // Synchronize Platinum ceilings
          if (!parsed.discountRules?.globalTierCeilings?.Platinum) {
            parsed.discountRules = INITIAL_SEED_DATA.discountRules;
          }
          // Synchronize orderCount & tier for all customers
          if (Array.isArray(parsed.customers)) {
            parsed.customers = parsed.customers.map(c => {
              const count = c.orderCount !== undefined ? c.orderCount : (c.tier === 'Gold' ? 8 : c.tier === 'Platinum' ? 10 : c.tier === 'Bronze' ? 3 : 5);
              return {
                ...c,
                orderCount: count,
                tier: calculateCustomerTier(count)
              };
            });
          }
          // Synchronize multi-warehouse network data
          if (!Array.isArray(parsed.warehouses) || parsed.warehouses.length < 3 || !parsed.warehouses[0]?.baseCost) {
            parsed.warehouses = INITIAL_SEED_DATA.warehouses;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading dealflow360_frontend_state:', e);
    }
    return INITIAL_SEED_DATA;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('dealflow360_user');
      if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.email || parsed.name)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading dealflow360_user:', e);
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('dealflow360_frontend_state', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('dealflow360_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(prods => {
        if (prods && prods.length) {
          setData(prev => ({ ...prev, products: prods }));
        }
      })
      .catch(() => console.log('Express API proxy offline, using local React state store.'));
  }, []);

  const setRole = (role) => {
    let view = data.currentView;
    if (role === 'customer') view = 'portal';
    else if (role === 'sales_manager' || role === 'finance') view = 'approval';
    else if (role === 'admin') view = 'config';
    else view = 'builder';

    setCurrentUser(prev => ({ ...prev, role }));
    setData(prev => ({ ...prev, currentRole: role, currentView: view }));
  };

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('dealflow360_registered_users');
    return saved ? JSON.parse(saved) : [
      { id: 'u-client', name: 'Saurav (Client)', email: 'client@dealflow.com', role: 'customer' },
      { id: 'u-admin', name: 'Alex Admin', email: 'admin@dealflow.com', role: 'admin' },
      { id: 'u-rahul', name: 'Rahul (Sales Rep)', email: 'rahul@dealflow.com', role: 'sales_rep' },
      { id: 'u-1', name: 'Sarah Rep', email: 'sarah@dealflow.com', role: 'sales_rep' },
      { id: 'u-2', name: 'Mark Manager', email: 'mark@dealflow.com', role: 'sales_manager' },
      { id: 'u-3', name: 'Fiona Finance', email: 'fiona@dealflow.com', role: 'finance' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('dealflow360_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const login = async (email, password) => {
    if (!email || !email.trim()) {
      showToast('Please enter your email address.', 'warning');
      return false;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      if (res.ok) {
        const body = await res.json();
        const user = body.user;
        setCurrentUser(user);
        setRole(user.role || 'customer');
        showToast(`Welcome back, ${user.name}!`, 'success');
        return true;
      }
    } catch {
      // Backend offline fallback
    }

    const cleanEmail = email.trim().toLowerCase();
    let matchedUser = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      // Default: create as a client/customer and proceed
      matchedUser = {
        id: 'u-' + Date.now(),
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'customer'
      };
      setRegisteredUsers(prev => [...prev, matchedUser]);
    }

    setCurrentUser(matchedUser);
    setRole(matchedUser.role || 'customer');
    showToast(`Welcome, ${matchedUser.name}!`, 'success');
    return true;
  };

  const signup = async (name, email, password, role = 'customer') => {
    if (!email || !email.trim()) {
      showToast('Please provide a valid email address.', 'warning');
      return false;
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = role || 'customer';

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || email.split('@')[0], email: cleanEmail, password, role: assignedRole })
      });
      if (res.ok) {
        const body = await res.json();
        const user = body.user;
        setRegisteredUsers(prev => [...prev.filter(u => u.email.toLowerCase() !== cleanEmail), user]);
        setCurrentUser(user);
        setRole(user.role || 'customer');
        showToast(`Client account created for ${user.name}!`, 'success');
        return true;
      }
    } catch {
      // Backend offline fallback
    }

    const newUser = { id: 'u-' + Date.now(), name: name || email.split('@')[0], email: cleanEmail, role: assignedRole };
    setRegisteredUsers(prev => [...prev.filter(u => u.email.toLowerCase() !== cleanEmail), newUser]);
    setCurrentUser(newUser);
    setRole(newUser.role);
    showToast(`Client account created for ${newUser.name}!`, 'success');
    return true;
  };

  const magicLinkLogin = async (token) => {
    if (!token || !token.trim()) {
      showToast('Please enter a valid portal token.', 'warning');
      return false;
    }

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      });
      if (res.ok) {
        const body = await res.json();
        const user = body.user;
        setCurrentUser(user);
        setRole('customer');
        if (body.quoteId) setActiveQuoteId(body.quoteId);
        showToast(`Customer Magic Link authenticated!`, 'success');
        return true;
      }
    } catch {
      // Backend offline fallback
    }

    const matchedQuote = data.quotations.find(q => q.portalToken === token.trim() || q.code === token.trim());
    if (matchedQuote || token.trim().startsWith('token-') || token.trim().includes('abc')) {
      if (matchedQuote) setActiveQuoteId(matchedQuote.id);
      const cust = matchedQuote ? data.customers.find(c => c.id === matchedQuote.customerId) : null;
      const user = { name: cust?.name || 'ABC Company (Customer)', email: 'procurement@abccorp.com', role: 'customer' };
      setCurrentUser(user);
      setRole('customer');
      showToast(`Welcome to Customer Portal (${user.name})`, 'success');
      return true;
    }

    showToast('Invalid or expired customer portal token.', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const setView = (view) => setData(prev => ({ ...prev, currentView: view }));
  const setActiveQuoteId = (id) => setData(prev => ({ ...prev, activeQuoteId: id }));

  const updateActiveQuote = (updater) => {
    setData(prev => {
      const idx = prev.quotations.findIndex(q => q.id === prev.activeQuoteId);
      if (idx === -1) return prev;
      const updatedQuotes = [...prev.quotations];
      const target = { ...updatedQuotes[idx] };
      updater(target);
      updatedQuotes[idx] = target;
      return { ...prev, quotations: updatedQuotes };
    });
  };

  const addQuotation = (newQuote) => {
    setData(prev => ({
      ...prev,
      quotations: [newQuote, ...prev.quotations],
      activeQuoteId: newQuote.id
    }));
  };

  const addApprovalLog = (log) => {
    setData(prev => ({
      ...prev,
      approvalLogs: [{ ...log, id: 'log-' + Date.now(), timestamp: new Date().toISOString() }, ...prev.approvalLogs]
    }));
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
    } catch {
      // Offline fallback
    }

    setRegisteredUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId || u.email === userId) {
          return { ...u, role: newRole };
        }
        return u;
      });
      return updated;
    });

    if (currentUser && (currentUser.id === userId || currentUser.email === userId)) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }

    const targetUser = registeredUsers.find(u => u.id === userId || u.email === userId);
    const roleLabels = {
      admin: 'Admin',
      sales_manager: 'Sales Manager',
      sales_rep: 'Sales Rep',
      finance: 'Finance / Operations',
      customer: 'Customer / Client'
    };
    showToast(`Role for ${targetUser?.name || 'User'} assigned to ${roleLabels[newRole] || newRole}!`, 'success');
  };

  const updateCustomerOrderCount = async (customerId, newCount) => {
    const count = Math.max(0, parseInt(newCount, 10) || 0);
    const newTier = calculateCustomerTier(count);

    try {
      await fetch(`/api/customers/${customerId}/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCount: count })
      });
    } catch {
      // Offline fallback
    }

    setData(prev => {
      let found = false;
      const customers = (prev.customers || []).map(c => {
        if (c.id === customerId || c.email === customerId) {
          found = true;
          return { ...c, orderCount: count, tier: newTier };
        }
        return c;
      });
      if (!found) {
        customers.push({
          id: customerId,
          name: customerId,
          email: customerId,
          orderCount: count,
          tier: newTier
        });
      }
      return { ...prev, customers };
    });

    const oldCust = (data.customers || []).find(c => c.id === customerId || c.email === customerId);
    if (oldCust && oldCust.tier !== newTier) {
      showToast(`🎉 Tier Upgraded to ${newTier}! (${count} Orders)`, 'success');
    } else {
      showToast(`Customer orders updated to ${count} (${newTier} Tier)`, 'info');
    }
    return newTier;
  };

  const incrementCustomerOrders = (customerId) => {
    const cust = (data.customers || []).find(c => c.id === customerId || c.email === customerId);
    const currentCount = cust ? (cust.orderCount || 0) : 5;
    return updateCustomerOrderCount(customerId, currentCount + 1);
  };

  const upsertCustomer = (customer) => {
    const orderCount = customer.orderCount !== undefined ? Math.max(0, parseInt(customer.orderCount, 10) || 0) : 3;
    const tier = customer.tier || calculateCustomerTier(orderCount);
    const updatedCustomer = {
      ...customer,
      id: customer.id || 'c-' + Date.now(),
      orderCount,
      tier
    };

    setData(prev => {
      const customers = [...(prev.customers || [])];
      const idx = customers.findIndex(c => c.id === updatedCustomer.id || (updatedCustomer.email && c.email === updatedCustomer.email));
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...updatedCustomer };
      } else {
        customers.push(updatedCustomer);
      }
      return { ...prev, customers };
    });

    return updatedCustomer;
  };

  const dispatchFulfillmentSplit = ({ quoteId, splitPlan, shipmentCount, totalFreightCost, isManualOverride }) => {
    setData(prev => {
      // 1. Deduct stock from warehouses
      const updatedWarehouses = (prev.warehouses || []).map(wh => {
        const whCopy = { ...wh, stock: { ...(wh.stock || {}) } };
        (splitPlan || []).forEach(item => {
          if (item.allocations && item.allocations[wh.id]) {
            const deducted = item.allocations[wh.id];
            whCopy.stock[item.productId] = Math.max(0, (whCopy.stock[item.productId] || 0) - deducted);
          }
        });
        return whCopy;
      });

      // 2. Mark quote fulfillment status
      const updatedQuotes = (prev.quotations || []).map(q => {
        if (q.id === quoteId) {
          return {
            ...q,
            fulfillmentStatus: 'Split Dispatched',
            fulfillmentData: {
              splitPlan,
              shipmentCount,
              totalFreightCost,
              isManualOverride,
              dispatchedAt: new Date().toISOString()
            }
          };
        }
        return q;
      });

      // 3. Log audit entry
      const newLog = {
        id: 'log-' + Date.now(),
        quoteId,
        user: currentUser?.name || 'Operations Officer',
        role: currentUser?.role || 'finance',
        action: isManualOverride ? 'Manual Warehouse Split Dispatched' : 'Automated AI Warehouse Split Accepted',
        blendedRiskScore: 0,
        reason: `Generated ${shipmentCount} multi-warehouse shipment(s) at total freight cost of $${totalFreightCost.toFixed(2)}.`,
        timestamp: new Date().toISOString()
      };

      return {
        ...prev,
        warehouses: updatedWarehouses,
        quotations: updatedQuotes,
        approvalLogs: [newLog, ...(prev.approvalLogs || [])]
      };
    });

    showToast(`📦 Multi-warehouse split confirmed! ${shipmentCount} shipment(s) scheduled ($${totalFreightCost.toFixed(2)} freight).`, 'success');
  };

  const activeQuote = (data.quotations || []).find(q => q.id === data.activeQuoteId) || (data.quotations || [])[0] || null;

  return (
    <AppContext.Provider value={{
      data,
      currentUser,
      currentRole: data.currentRole,
      currentView: data.currentView,
      activeQuote,
      registeredUsers,
      updateUserRole,
      calculateCustomerTier,
      TIER_CONFIG,
      updateCustomerOrderCount,
      incrementCustomerOrders,
      upsertCustomer,
      dispatchFulfillmentSplit,
      toasts,
      showToast,
      removeToast,
      setRole,
      setView,
      login,
      signup,
      logout,
      magicLinkLogin,
      setActiveQuoteId,
      updateActiveQuote,
      addQuotation,
      addApprovalLog
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
