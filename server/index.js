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
    { id: 'u-1', name: 'Sarah Rep', email: 'sarah@dealflow.com', role: 'sales_rep' },
    { id: 'u-2', name: 'Mark Manager', email: 'mark@dealflow.com', role: 'sales_manager' },
    { id: 'u-3', name: 'Fiona Finance', email: 'fiona@dealflow.com', role: 'finance' },
    { id: 'u-4', name: 'Alex Admin', email: 'admin@dealflow.com', role: 'admin' }
  ],
  customers: [
    { id: 'c-1', name: 'Acme Enterprises', tier: 'Gold', email: 'procurement@acme.com' },
    { id: 'c-2', name: 'Beta Industries', tier: 'Silver', email: 'purchasing@betaind.com' },
    { id: 'c-3', name: 'Gamma Logistics', tier: 'Bronze', email: 'ops@gammalog.com' }
  ],
  products: [
    { id: 'p-101', sku: 'HW-SRV-X1', name: 'Enterprise Edge Server X1', category: 'Hardware', listPrice: 4500, costPrice: 2800, unit: 'Unit', description: 'High-density dual-socket rack server.' },
    { id: 'p-102', sku: 'HW-DSK-99', name: 'Universal Thunderbolt Docking Station', category: 'Hardware', listPrice: 350, costPrice: 180, unit: 'Unit', description: 'Dual 4K display dock.' },
    { id: 'p-103', sku: 'SV-IMP-PRO', name: 'Onsite System Deployment Service', category: 'Service', listPrice: 2500, costPrice: 2100, unit: 'Service Event', description: 'Onsite network configuration.' },
    { id: 'p-104', sku: 'SUB-CLOUD-ADV', name: 'DealFlow Cloud Monitoring Suite', category: 'Subscription', listPrice: 450, costPrice: 120, unit: 'License/Mo', isRecurring: true }
  ],
  discountRules: {
    globalTierCeilings: { Bronze: 5, Silver: 10, Gold: 15 },
    categoryCeilings: {
      Hardware: { Bronze: 5, Silver: 10, Gold: 15 },
      Service: { Bronze: 3, Silver: 7, Gold: 10 },
      Subscription: { Bronze: 5, Silver: 12, Gold: 20 }
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
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  const existing = storeData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const newUser = {
    id: 'u-' + Date.now(),
    name,
    email,
    role,
    createdAt: new Date().toISOString()
  };

  storeData.users.push(newUser);
  res.status(201).json({ user: newUser, token: 'jwt-token-' + Date.now() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = storeData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Check if customer
    const customer = storeData.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (customer) {
      return res.json({
        user: { id: customer.id, name: customer.name, email: customer.email, role: 'customer' },
        token: 'cust-token-' + Date.now()
      });
    }
    return res.status(401).json({ error: 'Invalid email or password.' });
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

