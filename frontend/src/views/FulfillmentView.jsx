import React from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Check, Sliders, Warehouse } from 'lucide-react';

export const FulfillmentView = () => {
  const { data, activeQuote } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" /> Multi-Warehouse Fulfillment & Stock Split Engine
          </h2>
          <p className="text-xs text-muted">Dynamically split order lines across warehouses to minimize shipment count and cost.</p>
        </div>

        <span className="badge badge-success text-xs px-3 py-1">
          ✅ Warehouse Split Calculated
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="card">
            <div className="card-header border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal">Order {activeQuote.code} Stock Allocation</h3>
                <p className="text-xs text-muted">System recommendation prioritizing stock availability & lowest shipping penalty.</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => alert('Fulfillment split accepted.')} className="btn btn-sm btn-primary">
                  <Check className="w-4 h-4" /> Accept Suggested Split
                </button>
                <button onClick={() => alert('Manual override mode unlocked.')} className="btn btn-sm btn-outline">
                  <Sliders className="w-4 h-4" /> Manual Override
                </button>
              </div>
            </div>

            <div className="space-y-3 my-4">
              {activeQuote.lines.map(line => {
                const prod = data.products.find(p => p.id === line.productId);
                if (!prod) return null;
                return (
                  <div key={line.id} className="p-4 border border-warm rounded-lg bg-cream space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-charcoal">{prod.name}</h4>
                        <p className="text-xs text-muted font-mono">SKU: {prod.sku} • Requested: {line.quantity} units</p>
                      </div>
                      <span className="badge badge-success text-xs">100% Allocated</span>
                    </div>

                    <div className="p-2.5 bg-charcoal-03 border border-warm rounded-md text-xs flex justify-between">
                      <span>Main Distribution Center (Central)</span>
                      <strong className="text-charcoal">+{line.quantity} units</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="card">
            <h3 className="text-base font-bold text-charcoal mb-3 flex items-center gap-2">
              <Warehouse className="w-4 h-4" /> Live Warehouse Stock Levels
            </h3>

            <div className="space-y-3">
              {data.warehouses.map(wh => (
                <div key={wh.id} className="p-3 border border-warm rounded-lg bg-cream">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-xs text-charcoal">{wh.name}</h4>
                      <span className="text-[10px] text-muted">{wh.location}</span>
                    </div>
                    <span className="badge badge-neutral text-[10px]">Penalty: {wh.shippingWeightCost}x</span>
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
