import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sliders, 
  Save, 
  FileText, 
  FileSpreadsheet, 
  Package, 
  ShieldAlert, 
  Warehouse, 
  RefreshCw, 
  Sparkles, 
  BarChart3, 
  Users, 
  Filter, 
  CheckCircle2, 
  Layers,
  Key,
  DollarSign
} from 'lucide-react';

export const BackendConfigView = () => {
  const { data, addApprovalLog } = useApp();
  const [activeTab, setActiveTab] = useState('a3_discounts');

  // Filter state for A7 Reporting
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterRep, setFilterRep] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Interactive config state
  const [discountRules, setDiscountRules] = useState(data.discountRules);
  const [warehouses, setWarehouses] = useState(data.warehouses);
  const [promotedProductId, setPromotedProductId] = useState('p-warranty');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  const triggerSave = (msg) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  // Filter quotations for A7 Reporting
  const filteredQuotations = data.quotations.filter(q => {
    if (filterRep !== 'all' && (q.repId !== filterRep && q.repName !== filterRep)) return false;
    if (filterStatus !== 'all' && q.status !== filterStatus) return false;
    return true;
  });

  const exportPDF = () => {
    const reportText = `DEALFLOW360 PERFORMANCE REPORT\nGenerated: ${new Date().toLocaleString()}\nTotal Quotations: ${filteredQuotations.length}\nRep Filter: ${filterRep}\nStatus Filter: ${filterStatus}`;
    const blob = new Blob([reportText], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DealFlow360_Report_${Date.now()}.pdf`;
    a.click();
    triggerSave('PDF Report downloaded successfully.');
  };

  const exportXLS = () => {
    let csv = "Quote Code,Customer,Rep,Status,Line Count\n";
    filteredQuotations.forEach(q => {
      csv += `${q.code},${q.customerId},${q.repName || 'Rahul'},${q.status},${q.lines.length}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DealFlow360_Audit_Log_${Date.now()}.csv`;
    a.click();
    triggerSave('XLS/CSV Audit Log downloaded successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Sliders className="w-6 h-6 text-charcoal" /> Sales Backend (Configuration Area)
          </h2>
          <p className="text-xs text-muted">Master engine rules: Product catalog, discount ceilings, approval chains, warehouses, subscriptions & reporting.</p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccessMsg && (
            <span className="badge badge-success text-xs animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> {savedSuccessMsg}
            </span>
          )}
          <span className="badge badge-neutral text-xs px-3 py-1 font-bold">Admin Master View</span>
        </div>
      </div>

      {/* Configuration Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-warm pb-2">
        <button 
          onClick={() => setActiveTab('a1_auth')}
          className={`btn btn-sm ${activeTab === 'a1_auth' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Key className="w-3.5 h-3.5" /> A1. Auth & Portal
        </button>
        <button 
          onClick={() => setActiveTab('a2_products')}
          className={`btn btn-sm ${activeTab === 'a2_products' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Package className="w-3.5 h-3.5" /> A2. Products & Variants
        </button>
        <button 
          onClick={() => setActiveTab('a3_discounts')}
          className={`btn btn-sm ${activeTab === 'a3_discounts' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> A3. Discount & Approval Chain
        </button>
        <button 
          onClick={() => setActiveTab('a4_warehouses')}
          className={`btn btn-sm ${activeTab === 'a4_warehouses' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Warehouse className="w-3.5 h-3.5" /> A4. Warehouse & Split Weighting
        </button>
        <button 
          onClick={() => setActiveTab('a5_subscriptions')}
          className={`btn btn-sm ${activeTab === 'a5_subscriptions' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> A5. Subscription & Proration
        </button>
        <button 
          onClick={() => setActiveTab('a6_upsells')}
          className={`btn btn-sm ${activeTab === 'a6_upsells' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> A6. Upsell Rules
        </button>
        <button 
          onClick={() => setActiveTab('a7_reporting')}
          className={`btn btn-sm ${activeTab === 'a7_reporting' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> A7. Reporting & Exports
        </button>
      </div>

      {/* TAB A1: AUTHENTICATION */}
      {activeTab === 'a1_auth' && (
        <div className="card space-y-4">
          <div className="card-header border-b border-warm pb-3">
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Key className="w-4 h-4 text-charcoal" /> A1) Authentication & Portal Settings
            </h3>
            <p className="text-xs text-muted">Manage internal user login modes and customer portal magic link security.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-warm rounded-lg bg-cream space-y-3">
              <h4 className="font-bold text-charcoal text-sm">Internal Staff Authentication</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="checkbox" /> Standard Email & Password
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="checkbox" /> Single Sign-On (SSO / OAuth2)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="checkbox" /> Force Role Lockdown Badge in Header
                </label>
              </div>
            </div>

            <div className="p-4 border border-warm rounded-lg bg-cream space-y-3">
              <h4 className="font-bold text-charcoal text-sm">Customer Portal Access Mode</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="portal_mode" defaultChecked className="radio" /> Tokenized Magic Links (Instant 1-Click Access)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="portal_mode" className="radio" /> Customer Account Password Portal
                </label>
                <p className="text-[11px] text-muted">Magic links expire after 30 days unless renewed by Sales Rep.</p>
              </div>
            </div>
          </div>

          <button onClick={() => triggerSave('Authentication settings updated.')} className="btn btn-sm btn-primary">
            <Save className="w-4 h-4" /> Save Auth Settings
          </button>
        </div>
      )}

      {/* TAB A2: PRODUCT & PRICE LIST MANAGEMENT */}
      {activeTab === 'a2_products' && (
        <div className="card space-y-4">
          <div className="card-header border-b border-warm pb-3">
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Package className="w-4 h-4 text-charcoal" /> A2) Product Catalog & Price Lists
            </h3>
            <p className="text-xs text-muted">Manage product attributes, variants, tax rates, and customer tier pricing.</p>
          </div>

          <div className="table-container">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>List Price</th>
                  <th>Cost Price</th>
                  <th>Tax %</th>
                  <th>Variants / Attributes</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map(p => (
                  <tr key={p.id}>
                    <td className="font-bold text-charcoal">{p.name}</td>
                    <td className="font-mono text-muted">{p.sku}</td>
                    <td><span className="badge badge-neutral text-[10px]">{p.category}</span></td>
                    <td className="font-bold">${p.listPrice}</td>
                    <td className="text-muted">${p.costPrice}</td>
                    <td>18% GST</td>
                    <td>
                      <span className="badge badge-info text-[10px]">
                        {p.category === 'Hardware' ? 'Attribute: RAM / Storage (+ $150)' : 'Standard Plan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB A3: DISCOUNT TIER & APPROVAL CHAIN */}
      {activeTab === 'a3_discounts' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="card-header border-b border-warm pb-3">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-charcoal" /> A3) Category & Customer Tier Discount Ceilings
              </h3>
              <p className="text-xs text-muted">Define maximum allowed discount percentages before routing for Manager or Finance approvals.</p>
            </div>

            <div className="table-container">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Product Category</th>
                    <th>Bronze Tier Ceiling</th>
                    <th>Silver Tier Ceiling</th>
                    <th>Gold Tier Ceiling</th>
                    <th>Approval Chain Routing</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(discountRules.categoryCeilings).map(([cat, ceilings]) => (
                    <tr key={cat}>
                      <td className="font-bold text-charcoal">{cat}</td>
                      <td>
                        <input 
                          type="number" 
                          value={ceilings.Bronze} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setDiscountRules(prev => ({
                              ...prev,
                              categoryCeilings: {
                                ...prev.categoryCeilings,
                                [cat]: { ...prev.categoryCeilings[cat], Bronze: val }
                              }
                            }));
                          }}
                          className="input py-0.5 px-2 text-xs w-20 text-center" 
                        /> %
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={ceilings.Silver} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setDiscountRules(prev => ({
                              ...prev,
                              categoryCeilings: {
                                ...prev.categoryCeilings,
                                [cat]: { ...prev.categoryCeilings[cat], Silver: val }
                              }
                            }));
                          }}
                          className="input py-0.5 px-2 text-xs w-20 text-center" 
                        /> %
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={ceilings.Gold} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setDiscountRules(prev => ({
                              ...prev,
                              categoryCeilings: {
                                ...prev.categoryCeilings,
                                [cat]: { ...prev.categoryCeilings[cat], Gold: val }
                              }
                            }));
                          }}
                          className="input py-0.5 px-2 text-xs w-20 text-center" 
                        /> %
                      </td>
                      <td>
                        <span className="badge badge-warning text-[10px]">
                          {cat === 'Service' ? 'Sales Manager -> Finance' : 'Sales Manager Only'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <strong>Blended Risk Score Formula:</strong>
              <p className="font-mono text-[11px]">
                Score = (Sum(Line Overage Pct × Line Revenue) / Total Net Revenue) × 10 + (Max Single Line Overage × 0.5)
              </p>
              <p className="text-[11px]">Quotes with Risk Score &gt; 0.0 require Manager approval; Risk Score &gt; 10.0 require Finance approval.</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => triggerSave('Discount ceiling rules updated successfully.')} className="btn btn-sm btn-primary">
                <Save className="w-4 h-4" /> Save Discount Ceilings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB A4: WAREHOUSE & FULFILLMENT SETUP */}
      {activeTab === 'a4_warehouses' && (
        <div className="card space-y-4">
          <div className="card-header border-b border-warm pb-3">
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-charcoal" /> A4) Warehouse & Fulfillment Split Rules
            </h3>
            <p className="text-xs text-muted">Configure shipping cost weighting and stock split priority across regional depots.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map(w => (
              <div key={w.id} className="p-4 border border-warm rounded-lg bg-cream space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-charcoal text-sm">{w.name} ({w.code})</h4>
                  <span className="badge badge-neutral text-[10px]">{w.location}</span>
                </div>
                <p className="text-muted">Weighting Factor: <strong>1.0 (Standard Priority)</strong></p>
                <div className="pt-2 flex items-center justify-between font-mono">
                  <span>Available Stock: {w.stock['p-laptop'] || 0} Laptops</span>
                  <span className="text-emerald-700 font-bold">Active Operational</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-cream border border-warm rounded-lg text-xs space-y-1">
            <strong>Auto-Split Weighting Logic:</strong>
            <p className="text-muted">Minimizes number of shipments by consolidating items from primary regional warehouses before issuing partial backorders.</p>
          </div>
        </div>
      )}

      {/* TAB A5: SUBSCRIPTION SETUP */}
      {activeTab === 'a5_subscriptions' && (
        <div className="card space-y-4">
          <div className="card-header border-b border-warm pb-3">
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-charcoal" /> A5) Subscription Plans & Proration Rules
            </h3>
            <p className="text-xs text-muted">Configure monthly/annual SaaS recurring plans, mid-cycle seat additions, and credit refund policies.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 border border-warm rounded-lg bg-cream space-y-2">
              <h4 className="font-bold text-charcoal">Monthly Subscription Plan</h4>
              <p className="text-muted">$25 / seat / month</p>
              <span className="badge badge-info text-[10px]">Proration: Per-Day Exact</span>
            </div>

            <div className="p-3 border border-warm rounded-lg bg-cream space-y-2">
              <h4 className="font-bold text-charcoal">Annual Subscription Plan</h4>
              <p className="text-muted">$250 / seat / year (2 Months Free)</p>
              <span className="badge badge-info text-[10px]">Proration: Monthly Rounding</span>
            </div>

            <div className="p-3 border border-warm rounded-lg bg-cream space-y-2">
              <h4 className="font-bold text-charcoal">Cancellation & Refund Policy</h4>
              <p className="text-muted">Partial credit note issued within 14 days of mid-cycle cancellation.</p>
              <span className="badge badge-warning text-[10px]">Credit Note Refund</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB A6: UPSELL & CROSS-SELL RULES */}
      {activeTab === 'a6_upsells' && (
        <div className="card space-y-4">
          <div className="card-header border-b border-warm pb-3">
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-charcoal" /> A6) Upsell & Cross-Sell Recommendation Setup
            </h3>
            <p className="text-xs text-muted">Historical co-purchase pairings, promoted item ranking, and minimum margin thresholds.</p>
          </div>

          <div className="space-y-3 text-xs">
            {data.upsellRules.map(rule => (
              <div key={rule.triggerProductId} className="p-3 border border-warm rounded-lg bg-cream flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="badge badge-warning text-[10px] mr-2">+{rule.marginDelta}% Margin Delta</span>
                  <strong className="text-charcoal">{data.products.find(p => p.id === rule.suggestedProductId)?.name}</strong>
                  <p className="text-muted text-[11px] mt-0.5">{rule.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px]">
                    <input 
                      type="radio" 
                      name="promoted_item" 
                      checked={promotedProductId === rule.suggestedProductId}
                      onChange={() => setPromotedProductId(rule.suggestedProductId)}
                      className="radio" 
                    /> Mark Promoted
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB A7: REPORTING & DASHBOARD CONFIGURATION */}
      {activeTab === 'a7_reporting' && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="card-header border-b border-warm pb-3">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-charcoal" /> A7) Reporting Controls & Filter Console
              </h3>
              <p className="text-xs text-muted">Filter deals by period, sales rep, approval status, and category. Export PDF/XLS packages.</p>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-cream border border-warm rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="label text-[11px] font-bold">Period</label>
                <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="select w-full text-xs">
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div>
                <label className="label text-[11px] font-bold">Sales Rep / Team</label>
                <select value={filterRep} onChange={e => setFilterRep(e.target.value)} className="select w-full text-xs">
                  <option value="all">All Reps</option>
                  <option value="u-rahul">Rahul (Sales Rep)</option>
                  <option value="u-sarah">Sarah (Enterprise Rep)</option>
                </select>
              </div>

              <div>
                <label className="label text-[11px] font-bold">Approval Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select w-full text-xs">
                  <option value="all">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Fulfilled">Fulfilled</option>
                </select>
              </div>

              <div>
                <label className="label text-[11px] font-bold">Export Package</label>
                <div className="flex gap-2 pt-0.5">
                  <button onClick={exportPDF} className="btn btn-sm btn-outline text-red-700 flex-1 flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={exportXLS} className="btn btn-sm btn-outline text-emerald-700 flex-1 flex items-center justify-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> XLS
                  </button>
                </div>
              </div>
            </div>

            {/* Filtered Results Table */}
            <div className="table-container">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Quote Code</th>
                    <th>Customer ID</th>
                    <th>Sales Rep</th>
                    <th>Status</th>
                    <th>Line Items</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map(q => (
                    <tr key={q.id}>
                      <td className="font-bold font-mono text-charcoal">{q.code}</td>
                      <td>{q.customerId}</td>
                      <td>{q.repName || 'Rahul'}</td>
                      <td>
                        <span className={`badge ${
                          q.status === 'Approved' ? 'badge-success' :
                          q.status === 'Pending Approval' ? 'badge-warning' : 'badge-neutral'
                        } text-[10px]`}>
                          {q.status}
                        </span>
                      </td>
                      <td>{q.lines.length} Line Items</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
