import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Check, Sliders, Warehouse, Lock, Unlock, AlertCircle, Save } from 'lucide-react';

export const FulfillmentView = () => {
  const { data, activeQuote, showToast, addApprovalLog, currentRole } = useApp();
  const [isOverrideMode, setIsOverrideMode] = useState(false);

  // Custom allocation override state
  const [allocations, setAllocations] = useState({
    nyc: 12,
    sfo: 5,
    backorder: 3
  });

  const totalAllocated = allocations.nyc + allocations.sfo + allocations.backorder;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" /> Multi-Warehouse Fulfillment & Stock Split Engine
          </h2>
          <p className="text-xs text-muted">Dynamically split order lines across warehouses to minimize shipment count and cost.</p>
        </div>

        <span className={`badge ${isOverrideMode ? 'badge-warning' : 'badge-success'} text-xs px-3 py-1 flex items-center gap-1 font-bold`}>
          {isOverrideMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {isOverrideMode ? 'Manual Override Unlocked' : 'Automated Split Active'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stock Allocation Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="card space-y-4">
            <div className="card-header border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal">Order {activeQuote.code} Stock Allocation</h3>
                <p className="text-xs text-muted">
                  {isOverrideMode 
                    ? 'Manual Override Mode Active: Custom quantity inputs unlocked per regional warehouse.'
                    : 'System recommendation prioritizing stock availability & lowest shipping penalty.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isOverrideMode ? (
                  <>
                    <button 
                      onClick={() => showToast('Automated fulfillment split accepted.', 'success')} 
                      className="btn btn-sm btn-primary flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Accept Suggested Split
                    </button>
                    <button 
                      onClick={() => {
                        setIsOverrideMode(true);
                        showToast('Manual override mode unlocked. Edit quantities per warehouse.', 'warning');
                      }} 
                      className="btn btn-sm btn-outline text-amber-800 border-amber-300 hover:bg-amber-50 flex items-center gap-1"
                    >
                      <Sliders className="w-4 h-4" /> Manual Override
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsOverrideMode(false);
                      addApprovalLog({
                        quoteId: activeQuote.id,
                        user: 'Operations Officer',
                        role: currentRole,
                        action: 'Manual Fulfillment Override Saved',
                        blendedRiskScore: 0,
                        reason: `Custom warehouse allocation saved: NYC (${allocations.nyc}), SFO (${allocations.sfo}), Backorder (${allocations.backorder}).`
                      });
                      showToast('Custom fulfillment allocation saved & locked.', 'success');
                    }}
                    className="btn btn-sm btn-primary bg-amber-800 hover:bg-amber-900 border-amber-900 flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" /> Save Manual Split
                  </button>
                )}
              </div>
            </div>

            {/* Line Item Allocations */}
            <div className="space-y-4 my-2">
              {activeQuote.lines.map(line => {
                const prod = data.products.find(p => p.id === line.productId);
                if (!prod) return null;

                return (
                  <div key={line.id} className="p-4 border border-warm rounded-lg bg-cream space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-charcoal">{prod.name}</h4>
                        <p className="text-xs text-muted font-mono">SKU: {prod.sku} • Total Requested: <strong>{line.quantity} units</strong></p>
                      </div>
                      <span className={`badge ${totalAllocated === line.quantity ? 'badge-success' : 'badge-warning'} text-xs font-mono`}>
                        {totalAllocated} / {line.quantity} Units Allocated
                      </span>
                    </div>

                    {!isOverrideMode ? (
                      /* Read-Only System Recommended Breakdown */
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-charcoal-03 border border-warm rounded-md flex justify-between items-center">
                          <span className="font-medium">Main Distribution Center (NYC - Primary Depot)</span>
                          <span className="badge badge-success text-xs font-bold">+12 Units Shipped</span>
                        </div>
                        <div className="p-2.5 bg-charcoal-03 border border-warm rounded-md flex justify-between items-center">
                          <span className="font-medium">East Coast Fast-Fulfillment Depot (SFO - Secondary)</span>
                          <span className="badge badge-info text-xs font-bold">+5 Units Shipped</span>
                        </div>
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md flex justify-between items-center text-amber-900">
                          <span className="font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Pending Replenishment (Backorder)
                          </span>
                          <span className="badge badge-warning text-xs font-bold">3 Units Reserved</span>
                        </div>
                      </div>
                    ) : (
                      /* Editable Manual Override Inputs */
                      <div className="p-3 border border-amber-300 bg-amber-50/40 rounded-lg space-y-3 text-xs">
                        <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-700" /> Custom Quantity Allocation Inputs
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="label text-[11px] font-bold">Main NYC Depot</label>
                            <input 
                              type="number" 
                              min="0"
                              max={line.quantity}
                              value={allocations.nyc}
                              onChange={(e) => setAllocations(prev => ({ ...prev, nyc: parseInt(e.target.value) || 0 }))}
                              className="input text-xs font-bold text-center"
                            />
                            <span className="text-[10px] text-muted block mt-0.5">Stock Available: 12</span>
                          </div>

                          <div>
                            <label className="label text-[11px] font-bold">Secondary SFO Depot</label>
                            <input 
                              type="number" 
                              min="0"
                              max={line.quantity}
                              value={allocations.sfo}
                              onChange={(e) => setAllocations(prev => ({ ...prev, sfo: parseInt(e.target.value) || 0 }))}
                              className="input text-xs font-bold text-center"
                            />
                            <span className="text-[10px] text-muted block mt-0.5">Stock Available: 5</span>
                          </div>

                          <div>
                            <label className="label text-[11px] font-bold">Backorder Reserved</label>
                            <input 
                              type="number" 
                              min="0"
                              max={line.quantity}
                              value={allocations.backorder}
                              onChange={(e) => setAllocations(prev => ({ ...prev, backorder: parseInt(e.target.value) || 0 }))}
                              className="input text-xs font-bold text-center text-amber-900 bg-amber-50 border-amber-300"
                            />
                            <span className="text-[10px] text-amber-700 block mt-0.5">Auto-Consolidated</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Warehouse Stock Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card space-y-3">
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2 border-b border-warm pb-2">
              <Warehouse className="w-4 h-4" /> Live Warehouse Stock Levels
            </h3>

            <div className="space-y-3 text-xs">
              {data.warehouses.map(wh => (
                <div key={wh.id} className="p-3 border border-warm rounded-lg bg-cream space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-charcoal">{wh.name}</h4>
                      <span className="text-[10px] text-muted">{wh.location}</span>
                    </div>
                    <span className="badge badge-neutral text-[10px]">Penalty: {wh.shippingWeightCost}x</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-warm/40 font-mono text-[11px]">
                    <span className="text-muted">Laptop Stock:</span>
                    <strong className="text-charcoal">{wh.id === 'wh-main' ? '12 Units' : '5 Units'}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
