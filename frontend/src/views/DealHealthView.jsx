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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-[#e2e2e2] p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-black" /> Deal Health & Anomaly Command Center
          </h2>
          <p className="text-sm text-[#5e5e5e] mt-1">
            Proactively identifies stalled deal momentum, discount spikes above sales rep benchmarks, and delivery promise slippage.
          </p>
        </div>

        {/* Stalled Threshold Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#e2e2e2] shadow-xs shrink-0">
          <Sliders className="w-3.5 h-3.5 text-[#5e5e5e] shrink-0" />
          <span className="text-xs font-semibold text-[#5e5e5e] whitespace-nowrap shrink-0">Stalled Inactive Threshold:</span>
          <select
            value={stalledDaysThreshold}
            onChange={(e) => setStalledDaysThreshold(parseInt(e.target.value, 10) || 5)}
            className="select text-xs font-bold border-none bg-transparent py-0 px-1 focus:ring-0 cursor-pointer text-black w-auto"
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
          className={`card p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeFilter === 'stalled' ? 'bg-black text-white border-black' : 'bg-white border-[#e2e2e2] hover:border-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'stalled' ? 'text-white/80' : 'text-[#5e5e5e]'}`}>Stalled Deals</span>
            <Clock className={`w-4 h-4 ${activeFilter === 'stalled' ? 'text-white' : 'text-black'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono ${activeFilter === 'stalled' ? 'text-white' : 'text-black'}`}>{stalledDeals.length}</span>
            <span className={`text-xs font-medium ${activeFilter === 'stalled' ? 'text-white/70' : 'text-[#5e5e5e]'}`}>&gt;{stalledDaysThreshold} Days Inactive</span>
          </div>
          <p className={`text-xs mt-1 ${activeFilter === 'stalled' ? 'text-white/70' : 'text-[#5e5e5e]'}`}>
            Quotes lacking sales activity or customer responses. Click to filter.
          </p>
        </div>

        {/* Card 2: Discount Anomalies */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'anomaly' ? 'all' : 'anomaly')}
          className={`card p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeFilter === 'anomaly' ? 'bg-black text-white border-black' : 'bg-white border-[#e2e2e2] hover:border-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'anomaly' ? 'text-white/80' : 'text-[#5e5e5e]'}`}>Discount Anomalies</span>
            <AlertOctagon className={`w-4 h-4 ${activeFilter === 'anomaly' ? 'text-white' : 'text-black'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono ${activeFilter === 'anomaly' ? 'text-white' : 'text-black'}`}>{discountAnomalies.length}</span>
            <span className={`text-xs font-medium ${activeFilter === 'anomaly' ? 'text-white/70' : 'text-[#5e5e5e]'}`}>Spikes &ge;15%</span>
          </div>
          <p className={`text-xs mt-1 ${activeFilter === 'anomaly' ? 'text-white/70' : 'text-[#5e5e5e]'}`}>
            Quotes with discounts significantly above rep historical average (10%).
          </p>
        </div>

        {/* Card 3: Delivery Promise Slippage */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'slippage' ? 'all' : 'slippage')}
          className={`card p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeFilter === 'slippage' ? 'bg-black text-white border-black' : 'bg-white border-[#e2e2e2] hover:border-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'slippage' ? 'text-white/80' : 'text-[#5e5e5e]'}`}>Delivery Slippage Risk</span>
            <Truck className={`w-4 h-4 ${activeFilter === 'slippage' ? 'text-white' : 'text-black'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black font-mono ${activeFilter === 'slippage' ? 'text-white' : 'text-black'}`}>{deliverySlippages.length}</span>
            <span className={`text-xs font-medium ${activeFilter === 'slippage' ? 'text-white/70' : 'text-[#5e5e5e]'}`}>Backorder / Delay</span>
          </div>
          <p className={`text-xs mt-1 ${activeFilter === 'slippage' ? 'text-white/70' : 'text-[#5e5e5e]'}`}>
            Orders facing depot capacity shortages or factory lead time delays.
          </p>
        </div>

      </div>

      {/* ================= ACTIVE ANOMALY ALERTS FEED ================= */}
      <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-6 shadow-xs space-y-4">
        
        {/* Feed Header with Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e2e2] pb-4">
          <div>
            <h3 className="text-lg font-bold text-black flex items-center gap-2">
              <Activity className="w-5 h-5 text-black" />
              <span>Active Deal Health & Governance Anomaly Feed</span>
            </h3>
            <p className="text-xs text-[#5e5e5e] mt-0.5">
              Click any alert to jump directly into the quotation or trigger automated nudges.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#5e5e5e] text-xs font-semibold mr-1">Filter:</span>
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
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer text-xs ${
                  activeFilter === f.id
                    ? 'bg-black text-white shadow-2xs'
                    : 'bg-[#efefef] text-black hover:bg-[#e2e2e2] border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-12 text-[#5e5e5e] space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-black" />
            <h4 className="font-bold text-sm text-black">All Deals Healthy & Active</h4>
            <p className="text-xs">No deals currently flagged for stalled momentum or discount anomalies.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAlerts.map((item, idx) => {
              return (
                <div 
                  key={`${item.quote.id}-${idx}`}
                  className="p-4 border border-[#e2e2e2] rounded-xl bg-white hover:border-black transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-black bg-black text-white uppercase tracking-wider">
                        {item.type.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-sm text-black">
                        {item.title} • <span className="font-mono text-[#5e5e5e]">{item.quote.code}</span>
                      </h4>
                      <span className="badge bg-[#efefef] text-black border border-[#e2e2e2] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Customer: {item.customerName}
                      </span>
                    </div>

                    <p className="text-xs text-[#5e5e5e] leading-relaxed">
                      {item.desc}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-[#5e5e5e] pt-1">
                      <span>Status: <strong className="text-black">{item.quote.status}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-black font-semibold">{item.metric}</span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: Open Quote directly + Trigger Nudge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenQuote(item.quote.id)}
                      className="btn btn-sm text-xs py-1.5 px-3.5 flex items-center gap-1.5 text-black hover:bg-[#efefef] border border-[#e2e2e2] rounded-full cursor-pointer transition-all"
                      title="Open this quotation directly in the Quote Builder"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Quote</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerNudge(item)}
                      className="btn btn-sm bg-black hover:bg-[#282828] text-white text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-2xs rounded-full cursor-pointer transition-all"
                      title="Send automated nudge email to rep and client"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Trigger Nudge</span>
                    </button>

                    {item.severity === 'critical' && (
                      <button
                        type="button"
                        onClick={() => handleEscalateToManager(item)}
                        className="btn btn-sm bg-white hover:bg-[#efefef] text-black border-2 border-black text-xs py-1.5 px-3 flex items-center gap-1 rounded-full cursor-pointer transition-all"
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
