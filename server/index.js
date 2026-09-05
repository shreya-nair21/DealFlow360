/**
 * DealFlow360 - Express REST API Server
 */

import express from 'express';
import cors from 'cors';
import { calculateQuotationMetricsServer } from './engine/riskEngine.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Seed Store in Memory
let storeData = {
  users: [
    { id: 'u-client', name: 'Saurav (Client)', email: 'client@dealflow.com', role: 'customer' },
    { id: 'u-admin', name: 'Alex Admin', email: 'admin@dealflow.com', role: 'admin' },
    { id: 'u-rahul', name: 'Rahul (Sales Rep)', email: 'rahul@dealflow.com', role: 'sales_rep' },
    { id: 'u-1', name: 'Sarah Rep', email: 'sarah@dealflow.com', role: 'sales_rep' },
    { id: 'u-2', name: 'Mark Manager', email: 'mark@dealflow.com', role: 'sales_manager' },
    { id: 'u-3', name: 'Fiona Finance', email: 'fiona@dealflow.com', role: 'finance' }
  ],
  customers: [
    { id: 'c-client', name: 'Saurav (Client)', tier: 'Silver', orderCount: 5, email: 'client@dealflow.com' },
    { id: 'c-abc', name: 'ABC Company', tier: 'Gold', orderCount: 8, email: 'procurement@abccorp.com' },
    { id: 'c-1', name: 'Acme Enterprises', tier: 'Platinum', orderCount: 11, email: 'procurement@acme.com' },
    { id: 'c-2', name: 'Beta Industries', tier: 'Bronze', orderCount: 3, email: 'purchasing@betaind.com' },
    { id: 'c-3', name: 'Gamma Logistics', tier: 'Standard', orderCount: 1, email: 'ops@gammalog.com' }
  ],
  products: [
    { id: 'p-101', sku: 'HW-SRV-X1', name: 'Enterprise Edge Server X1', category: 'Hardware', listPrice: 4500, costPrice: 2800, unit: 'Unit', description: 'High-density dual-socket rack server.' },
    { id: 'p-102', sku: 'HW-DSK-99', name: 'Universal Thunderbolt Docking Station', category: 'Hardware', listPrice: 350, costPrice: 180, unit: 'Unit', description: 'Dual 4K display dock.' },
    { id: 'p-103', sku: 'SV-IMP-PRO', name: 'Onsite System Deployment Service', category: 'Service', listPrice: 2500, costPrice: 2100, unit: 'Service Event', description: 'Onsite network configuration.' },
    { id: 'p-104', sku: 'SUB-CLOUD-ADV', name: 'DealFlow Cloud Monitoring Suite', category: 'Subscription', listPrice: 450, costPrice: 120, unit: 'License/Mo', isRecurring: true }
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
    { id: 'wh-main', name: 'Main Distribution Center (Central)', location: 'Chicago, IL', shippingWeightCost: 1.0 },
    { id: 'wh-east', name: 'East Coast Fast-Fulfillment Depot', location: 'Newark, NJ', shippingWeightCost: 1.4 }
  ],
  quotations: [
    {
      id: 'q-101',
      code: 'QT-2026-001',
      customerId: 'c-1',
      repId: 'u-1',
      status: 'Pending Approval',
      portalToken: 'acme-secret-token-9988',
      daysInactive: 2,
      lines: [
        { id: 'ql-1', productId: 'p-101', quantity: 10, unitPrice: 4500, discountPct: 12 },
        { id: 'ql-2', productId: 'p-103', quantity: 2, unitPrice: 2500, discountPct: 18 }
      ],
      comments: [
        { id: 'cm-1', sender: 'Sales Rep', role: 'sales_rep', text: 'Special deployment bundle discount.', timestamp: new Date().toISOString() }
      ]
    }
  ],
  approvalLogs: []
};

// API Endpoints

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth Routes: Signup, Login, Magic Link
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  const role = req.body.role || 'customer'; // Default is client/customer
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = storeData.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const userId = 'u-' + Date.now();
  const userName = name || cleanEmail.split('@')[0];
  const newUser = {
    id: userId,
    name: userName,
    email: cleanEmail,
    role,
    createdAt: new Date().toISOString()
  };

  storeData.users.push(newUser);

  if (role === 'customer') {
    storeData.customers.push({
      id: 'c-' + Date.now(),
      name: userName,
      tier: 'Gold',
      email: cleanEmail
    });
  }

  res.status(201).json({ user: newUser, token: 'jwt-token-' + Date.now() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  let user = storeData.users.find(u => u.email.toLowerCase() === cleanEmail);
  
  if (!user) {
    // Check if customer email exists in customers array
    const customer = storeData.customers.find(c => c.email.toLowerCase() === cleanEmail);
    if (customer) {
      user = { id: customer.id, name: customer.name, email: customer.email, role: 'customer' };
    } else {
      // Default: create and log in as client/customer automatically
      user = {
        id: 'u-' + Date.now(),
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'customer'
      };
      storeData.users.push(user);
      storeData.customers.push({
        id: 'c-' + Date.now(),
        name: user.name,
        tier: 'Gold',
        email: cleanEmail
      });
    }
  }

  res.json({ user, token: 'jwt-token-' + Date.now() });
});

app.post('/api/auth/magic-link', (req, res) => {
  const { token, email } = req.body;
  
  if (token) {
    const quote = storeData.quotations.find(q => q.portalToken === token);
    if (quote) {
      const customer = storeData.customers.find(c => c.id === quote.customerId);
      return res.json({
        user: { id: customer?.id || 'c-1', name: customer?.name || 'Portal Customer', role: 'customer' },
        quoteId: quote.id,
        token
      });
    }
  }

  if (email) {
    const customer = storeData.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (customer) {
      return res.json({
        message: 'Magic link dispatched to customer email.',
        magicLink: `http://localhost:5175/portal/quote/${customer.id}`
      });
    }
  }

  return res.status(404).json({ error: 'Customer quotation or email not found.' });
});

app.get('/api/products', (req, res) => {
  res.json(storeData.products);
});

app.get('/api/users', (req, res) => {
  res.json(storeData.users);
});

app.put('/api/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });
  const user = storeData.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.role = role;
  res.json({ message: 'Role updated successfully', user });
});

app.get('/api/customers', (req, res) => {
  res.json(storeData.customers);
});

app.get('/api/quotations', (req, res) => {
  res.json(storeData.quotations);
});

app.get('/api/quotations/:id', (req, res) => {
  const quote = storeData.quotations.find(q => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });
  const metrics = calculateQuotationMetricsServer(quote, storeData.customers, storeData.products, storeData.discountRules);
  res.json({ ...quote, metrics });
});

app.post('/api/quotations', (req, res) => {
  const newQuote = {
    id: 'q-' + Date.now(),
    code: `QT-2026-0${storeData.quotations.length + 1}`,
    customerId: req.body.customerId || 'c-1',
    repId: 'u-1',
    status: 'Draft',
    portalToken: 'token-' + Date.now(),
    daysInactive: 0,
    lines: req.body.lines || [{ id: 'ql-init', productId: 'p-101', quantity: 1, unitPrice: 4500, discountPct: 0 }],
    comments: []
  };
  storeData.quotations.unshift(newQuote);
  res.status(201).json(newQuote);
});

app.put('/api/quotations/:id', (req, res) => {
  const idx = storeData.quotations.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Quotation not found' });
  storeData.quotations[idx] = { ...storeData.quotations[idx], ...req.body };
  res.json(storeData.quotations[idx]);
});

app.post('/api/quotations/:id/approve', (req, res) => {
  const quote = storeData.quotations.find(q => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });
  
  quote.status = 'Approved';
  const metrics = calculateQuotationMetricsServer(quote, storeData.customers, storeData.products, storeData.discountRules);

  const logEntry = {
    id: 'log-' + Date.now(),
    quoteId: quote.id,
    user: req.body.user || 'Sales Manager',
    role: req.body.role || 'sales_manager',
    action: 'Approved Quotation',
    blendedRiskScore: metrics.blendedRiskScore,
    reason: req.body.reason || 'Approved within authority.',
    timestamp: new Date().toISOString()
  };
  storeData.approvalLogs.unshift(logEntry);
  res.json({ message: 'Quotation approved successfully', quote, log: logEntry });
});

// Portal Endpoint
app.get('/api/portal/quote/:token', (req, res) => {
  const quote = storeData.quotations.find(q => q.portalToken === req.params.token);
  if (!quote) return res.status(404).json({ error: 'Portal token invalid' });
  const metrics = calculateQuotationMetricsServer(quote, storeData.customers, storeData.products, storeData.discountRules);
  res.json({ quote, metrics });
});

// Tier calculation helper: 3 orders = Bronze, 5 = Silver, 8 = Gold, 10+ = Platinum
function calculateCustomerTier(orderCount = 0) {
  const count = Math.max(0, parseInt(orderCount, 10) || 0);
  if (count >= 10) return 'Platinum';
  if (count >= 8) return 'Gold';
  if (count >= 5) return 'Silver';
  if (count >= 3) return 'Bronze';
  return 'Standard';
}

// Customers & Tier Management Endpoints
app.get('/api/customers', (req, res) => {
  res.json(storeData.customers);
});

app.put('/api/customers/:id/orders', (req, res) => {
  const { orderCount } = req.body;
  const custId = req.params.id;
  let customer = storeData.customers.find(c => c.id === custId || c.email === custId);
  if (!customer) {
    customer = { id: custId, name: 'Customer', email: custId, orderCount: 0, tier: 'Standard' };
    storeData.customers.push(customer);
  }
  customer.orderCount = Math.max(0, parseInt(orderCount, 10) || 0);
  customer.tier = calculateCustomerTier(customer.orderCount);
  res.json({ customer });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 DealFlow360 Express API Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const ALT_PORT = PORT + 1;
    console.warn(`⚠️ Port ${PORT} is occupied. Retrying on alternative port ${ALT_PORT}...`);
    app.listen(ALT_PORT, () => {
      console.log(`🚀 DealFlow360 Express API Server running on port ${ALT_PORT}`);
    });
  } else {
    console.error('Server error:', err);
  }
});

