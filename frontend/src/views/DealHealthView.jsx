import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Activity, 
  Clock, 
  AlertOctagon, 
  Truck, 
  Send, 
  ArrowRight, 
  Filter, 
  CheckCircle2, 
  ShieldAlert, 
  Percent, 
  Calendar, 
  Sparkles,
  UserCheck,
  TrendingUp,
  Sliders,
  ExternalLink
} from 'lucide-react';

export const DealHealthView = () => {
  const { 
    data, 
    setActiveQuoteId, 
    setView, 
    showToast, 
    addApprovalLog, 
    currentUser 
  } = useApp();

  const [stalledDaysThreshold, setStalledDaysThreshold] = useState(5);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'stalled', 'anomaly', 'slippage'

  // Dynamic Analysis of all quotations in the pipeline
  const { stalledDeals, discountAnomalies, deliverySlippages, allAlerts } = useMemo(() => {
    const stalled = [];
    const anomalies = [];
    const slippages = [];
    const alerts = [];

    const repHistoricalAverageDiscount = 10; // Rep benchmark discount

    (data.quotations || []).forEach(q => {
      const customer = (data.customers || []).find(c => c.id === q.customerId);
      const custName = customer?.name || q.customerName || 'Corporate Client';
      const days = q.daysInactive !== undefined ? q.daysInactive : (q.id === 'q-abc' ? 5 : 2);

      // Check 1: Stalled Deal (Inactive >= threshold)
      if (days >= stalledDaysThreshold && q.status !== 'Fulfilled' && q.status !== 'Approved') {
        const item = {
          quote: q,
          customerName: custName,
          type: 'stalled',
          severity: days >= 7 ? 'critical' : 'warning',
          title: `Deal Stalled for ${days} Days`,
          desc: `Quotation ${q.code} has had zero sales rep or client activity for ${days} business days. Momentum at risk.`,
          metric: `${days} Days Inactive`
        };
        stalled.push(item);
        alerts.push(item);
      }

      // Check 2: Discount Anomaly (Discount well above rep's historical average of 10%)
      const maxLineDiscount = (q.lines || []).reduce((max, l) => Math.max(max, l.discountPct || 0), q.discountPct || 0);
      if (maxLineDiscount >= 15) {
        const delta = maxLineDiscount - repHistoricalAverageDiscount;
        const item = {
          quote: q,
          customerName: custName,
          type: 'anomaly',
          severity: maxLineDiscount >= 18 ? 'critical' : 'warning',
          title: `Discount Anomaly Detected (${maxLineDiscount}%)`,
          desc: `Line discount of ${maxLineDiscount}% is +${delta}% higher than rep's historical average (${repHistoricalAverageDiscount}% benchmark). Significant margin dilution risk.`,
          metric: `+${delta}% Above Avg`
        };
        anomalies.push(item);
        alerts.push(item);
      }

      // Check 3: Delivery Promise Slippage (Backorders or pending fulfillment)
      const hasBackorders = (q.lines || []).some(l => l.quantity > 15) || q.fulfillmentStatus === 'Pending Backorder';
      if (hasBackorders || (days >= 4 && q.status === 'Pending Approval')) {
        const item = {
          quote: q,
          customerName: custName,
          type: 'slippage',
          severity: 'warning',
          title: `Fulfillment Slippage Risk`,
          desc: `High order volume requires multi-depot split or backorder lead times of 7–10 days. May exceed delivery promise.`,
          metric: `7–10 Day Lead Risk`
        };
        slippages.push(item);
        alerts.push(item);
      }
    });

    return {
      stalledDeals: stalled,
      discountAnomalies: anomalies,
      deliverySlippages: slippages,
      allAlerts: alerts
    };
  }, [data.quotations, data.customers, stalledDaysThreshold]);

  const displayedAlerts = useMemo(() => {
    if (activeFilter === 'stalled') return stalledDeals;
    if (activeFilter === 'anomaly') return discountAnomalies;
    if (activeFilter === 'slippage') return deliverySlippages;
    return allAlerts;
  }, [activeFilter, allAlerts, stalledDeals, discountAnomalies, deliverySlippages]);

  // ACTION: Open Quote in Builder
  const handleOpenQuote = (quoteId) => {
    setActiveQuoteId(quoteId);
    setView('builder');
  };

  // ACTION: Trigger Automated Nudge
  const handleTriggerNudge = (alertItem) => {
    addApprovalLog({
      quoteId: alertItem.quote.id,
      user: currentUser?.name || 'Deal Health Bot',
      role: 'admin',
      action: 'Automated Deal Health Nudge Triggered',
      blendedRiskScore: 0,
      reason: `Automated nudge dispatched to rep (${alertItem.quote.repName || 'Rahul'}) and client for alert: "${alertItem.title}".`
    });

    showToast(`📩 Automated nudge notification dispatched for ${alertItem.quote.code} (${alertItem.customerName})!`, 'success');
  };

  // ACTION: Escalate to Manager
  const handleEscalateToManager = (alertItem) => {
    addApprovalLog({
      quoteId: alertItem.quote.id,
      user: currentUser?.name || 'Deal Health Bot',
      role: 'admin',
      action: 'Deal Escalated to Sales Leadership',
      blendedRiskScore: 12.0,
      reason: `Executive escalation triggered: ${alertItem.desc}`
    });

    showToast(`🚨 Deal ${alertItem.quote.code} escalated to Sales Leadership & Manager Queue!`, 'warning');
  };

  return (
    <div className="space-y-6">
      
      {/* ================= TOP HEADER BANNER ================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-600" /> B9) Deal Health & Anomaly Command Center
            </h2>
            <span className="badge badge-danger text-[10px] font-bold">Live Risk Engine</span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Proactively identifies stalled deal momentum, discount spikes above sales rep benchmarks, and delivery promise slippage.
          </p>
        </div>

        {/* Stalled Threshold Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-warm shadow-2xs">
          <Sliders className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs font-semibold text-muted">Stalled Inactive Threshold:</span>
          <select
            value={stalledDaysThreshold}
            onChange={(e) => setStalledDaysThreshold(parseInt(e.target.value, 10) || 5)}
            className="select text-xs font-bold border-none bg-transparent py-0 px-1 focus:ring-0 cursor-pointer text-charcoal"
          >
            <option value="3">3+ Days Inactive</option>
            <option value="5">5+ Days Inactive (Standard)</option>
            <option value="7">7+ Days Inactive (Critical)</option>
            <option value="10">10+ Days Inactive</option>
          </select>
        </div>
      </div>

      {/* ================= 3 DYNAMIC ANOMALY KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Stalled Deals */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'stalled' ? 'all' : 'stalled')}
          className={`card p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeFilter === 'stalled' ? 'bg-amber-100/60 border-amber-400 ring-2 ring-amber-400/20' : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">Stalled Deals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-950 font-mono">{stalledDeals.length}</span>
            <span className="text-xs text-amber-800 font-medium">&gt;{stalledDaysThreshold} Days Inactive</span>
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1">
            Quotes lacking sales activity or customer responses. Click to filter.
          </p>
        </div>

        {/* Card 2: Discount Anomalies */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'anomaly' ? 'all' : 'anomaly')}
          className={`card p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeFilter === 'anomaly' ? 'bg-red-100/60 border-red-400 ring-2 ring-red-400/20' : 'bg-red-50/40 border-red-200 hover:bg-red-50/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-950 uppercase tracking-wider">Discount Anomalies</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-red-950 font-mono">{discountAnomalies.length}</span>
            <span className="text-xs text-red-800 font-medium">Spikes &ge;15%</span>
          </div>
          <p className="text-[11px] text-red-800/80 mt-1">
            Quotes with discounts significantly above rep historical average (10%).
          </p>
        </div>

        {/* Card 3: Delivery Promise Slippage */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'slippage' ? 'all' : 'slippage')}
          className={`card p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeFilter === 'slippage' ? 'bg-blue-100/60 border-blue-400 ring-2 ring-blue-400/20' : 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Delivery Slippage Risk</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-blue-950 font-mono">{deliverySlippages.length}</span>
            <span className="text-xs text-blue-800 font-medium">Backorder / Delay</span>
          </div>
          <p className="text-[11px] text-blue-800/80 mt-1">
            Orders facing depot capacity shortages or factory lead time delays.
          </p>
        </div>

      </div>

      {/* ================= ACTIVE ANOMALY ALERTS FEED (PDF B9) ================= */}
      <div className="card bg-white border border-warm rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Feed Header with Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm pb-3">
          <div>
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              <span>Active Deal Health & Governance Anomaly Feed</span>
            </h3>
            <p className="text-xs text-muted">
              Click any alert to jump directly into the quotation or trigger automated nudges.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted text-[11px] font-semibold mr-1">Filter:</span>
            {[
              { id: 'all', label: `All (${allAlerts.length})` },
              { id: 'stalled', label: `Stalled (${stalledDeals.length})` },
              { id: 'anomaly', label: `Anomalies (${discountAnomalies.length})` },
              { id: 'slippage', label: `Slippage (${deliverySlippages.length})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px] ${
                  activeFilter === f.id
                    ? 'bg-charcoal text-white shadow-2xs'
                    : 'bg-cream text-charcoal hover:bg-warm border border-warm/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-12 text-muted space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            <h4 className="font-bold text-sm text-charcoal">All Deals Healthy & Active</h4>
            <p className="text-xs">No deals currently flagged for stalled momentum or discount anomalies.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAlerts.map((item, idx) => {
              const isAnomaly = item.type === 'anomaly';
              const isStalled = item.type === 'stalled';
              const isSlippage = item.type === 'slippage';

              const badgeColor = 
                isAnomaly ? 'bg-red-100 text-red-800 border-red-200' :
                isStalled ? 'bg-amber-100 text-amber-900 border-amber-200' :
                'bg-blue-100 text-blue-900 border-blue-200';

              return (
                <div 
                  key={`${item.quote.id}-${idx}`}
                  className="p-4 border border-warm rounded-xl bg-cream/40 hover:bg-white hover:border-interactive transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeColor}`}>
                        {item.type.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-sm text-charcoal">
                        {item.title} • <span className="font-mono text-muted">{item.quote.code}</span>
                      </h4>
                      <span className="badge badge-neutral text-[10px]">
                        Customer: {item.customerName}
                      </span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed">
                      {item.desc}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
                      <span>Status: <strong className="text-charcoal">{item.quote.status}</strong></span>
                      <span>•</span>
                      <span>Handling Rep: <strong>{item.quote.repName || 'Rahul'}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-charcoal font-semibold">{item.metric}</span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS (PDF Section B9): Open Quote directly + Trigger Nudge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenQuote(item.quote.id)}
                      className="btn btn-sm btn-outline text-xs py-1.5 px-3 flex items-center gap-1 text-charcoal hover:bg-cream border-warm"
                      title="Open this quotation directly in the Quote Builder"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Quote</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerNudge(item)}
                      className="btn btn-sm btn-primary bg-charcoal hover:bg-black text-white text-xs py-1.5 px-3 flex items-center gap-1 shadow-2xs"
                      title="Send automated nudge email to rep and client"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Trigger Nudge</span>
                    </button>

                    {item.severity === 'critical' && (
                      <button
                        type="button"
                        onClick={() => handleEscalateToManager(item)}
                        className="btn btn-sm btn-danger text-xs py-1.5 px-2.5 flex items-center gap-1"
                        title="Escalate critical anomaly to Sales Leadership"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Escalate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
