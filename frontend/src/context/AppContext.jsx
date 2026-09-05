import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const INITIAL_SEED_DATA = {
  currentRole: 'sales_rep',
  currentView: 'builder',
  activeQuoteId: 'q-abc',
  
  customers: [
    { id: 'c-abc', name: 'ABC Company', tier: 'Gold', email: 'procurement@abccorp.com', repId: 'u-rahul' },
    { id: 'c-1', name: 'Acme Enterprises', tier: 'Gold', email: 'procurement@acme.com', repId: 'u-rahul' },
    { id: 'c-2', name: 'Beta Industries', tier: 'Silver', email: 'purchasing@betaind.com', repId: 'u-rahul' }
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
    globalTierCeilings: { Bronze: 5, Silver: 10, Gold: 15 },
    categoryCeilings: {
      Hardware: { Bronze: 5, Silver: 10, Gold: 15 },
      Service: { Bronze: 3, Silver: 7, Gold: 10 }, // Stricter Service limit!
      Subscription: { Bronze: 5, Silver: 12, Gold: 20 }
    },
    thresholds: { managerApprovalRiskScore: 0.01, financeApprovalRiskScore: 12.0 }
  },

  warehouses: [
    { id: 'wh-main', name: 'Main Distribution Center (Central)', location: 'Chicago, IL', shippingWeightCost: 1.0, stock: { 'p-laptop': 15, 'p-dock': 80 } },
    { id: 'wh-east', name: 'East Coast Fast-Fulfillment Depot', location: 'Newark, NJ', shippingWeightCost: 1.4, stock: { 'p-laptop': 10, 'p-dock': 40 } }
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
    const saved = localStorage.getItem('dealflow360_frontend_state');
    return saved ? JSON.parse(saved) : INITIAL_SEED_DATA;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('dealflow360_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    localStorage.setItem('dealflow360_frontend_state', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('dealflow360_user', JSON.stringify(currentUser));
  }, [currentUser]);

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

  const login = (email, password) => {
    const name = email.toLowerCase().includes('rahul') ? 'Rahul (Sales Rep)' : email.split('@')[0];
    const role = email.toLowerCase().includes('rahul') ? 'sales_rep' : data.currentRole;
    const user = { name, email, role };
    setCurrentUser(user);
    setRole(role);
  };

  const signup = (name, email, password, role) => {
    const user = { name, email, role };
    setCurrentUser(user);
    setRole(role);
  };

  const magicLinkLogin = (token) => {
    setCurrentUser({ name: 'ABC Company (Customer)', email: 'procurement@abccorp.com', role: 'customer' });
    setRole('customer');
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

  const activeQuote = data.quotations.find(q => q.id === data.activeQuoteId) || data.quotations[0];

  return (
    <AppContext.Provider value={{
      data,
      currentUser,
      currentRole: data.currentRole,
      currentView: data.currentView,
      activeQuote,
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
