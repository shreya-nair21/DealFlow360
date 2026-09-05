import React from 'react';
import { useApp } from '../context/AppContext';
import { Activity, Clock, AlertOctagon, Truck, Send } from 'lucide-react';

export const DealHealthView = () => {
  const { data, setActiveQuoteId, setView } = useApp();

  const stalled = data.quotations.filter(q => q.daysInactive >= 5);

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 class="text-xl font-bold text-charcoal flex items-center gap-2">
            <Activity class="w-6 h-6 text-red-600" /> Deal Health & Anomaly Command Center
          </h2>
          <p class="text-xs text-muted">Proactively detect stalled pipeline deals, discount anomalies, and fulfillment risks.</p>
        </div>

        <span class="badge badge-danger text-xs px-3 py-1">
          {stalled.length} Critical Alerts Active
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card bg-amber-50/40 border-amber-200">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-amber-900">Stalled Deals (&gt;5 Days)</span>
            <Clock class="w-5 h-5 text-amber-600" />
          </div>
          <div class="text-3xl font-bold text-amber-900 mt-2">{stalled.length}</div>
        </div>

        <div class="card bg-red-50/40 border-red-200">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-red-900">Discount Anomalies</span>
            <AlertOctagon class="w-5 h-5 text-red-600" />
          </div>
          <div class="text-3xl font-bold text-red-900 mt-2">1</div>
        </div>

        <div class="card bg-blue-50/40 border-blue-200">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-blue-900">Delivery Slippage Risk</span>
            <Truck class="w-5 h-5 text-blue-600" />
          </div>
          <div class="text-3xl font-bold text-blue-900 mt-2">1</div>
        </div>
      </div>

      <div class="card space-y-3">
        <h3 class="text-base font-bold text-charcoal flex items-center gap-2 border-b border-warm pb-2">
          <Clock class="w-4 h-4 text-amber-600" /> Active Anomaly Alerts
        </h3>

        {data.quotations.map(q => {
          const cust = data.customers.find(c => c.id === q.customerId);
          return (
            <div key={q.id} class="p-3 border border-amber-200 bg-amber-50/20 rounded-lg flex items-center justify-between">
              <div>
                <h4 class="font-bold text-sm text-charcoal">{q.code} • {cust?.name}</h4>
                <p class="text-xs text-muted">Status: <span class="badge badge-warning text-[10px]">{q.status}</span></p>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setActiveQuoteId(q.id);
                    setView('builder');
                  }}
                  class="text-xs font-semibold text-charcoal underline"
                >
                  Open Quote
                </button>

                <button onClick={() => alert('Automated email nudge sent to rep & customer.')} class="btn btn-sm btn-primary text-xs py-0.5 px-2">
                  <Send class="w-3.5 h-3.5" /> Trigger Nudge
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
