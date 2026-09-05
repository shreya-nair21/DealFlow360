import React from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Check, Sliders, Warehouse } from 'lucide-react';

export const FulfillmentView = () => {
  const { data, activeQuote } = useApp();

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 class="text-xl font-bold text-charcoal flex items-center gap-2">
            <Truck class="w-6 h-6 text-blue-600" /> Multi-Warehouse Fulfillment & Stock Split Engine
          </h2>
          <p class="text-xs text-muted">Dynamically split order lines across warehouses to minimize shipment count and cost.</p>
        </div>

        <span class="badge badge-success text-xs px-3 py-1">
          ✅ Warehouse Split Calculated
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 space-y-4">
          <div class="card">
            <div class="card-header border-b border-warm pb-3">
              <div>
                <h3 class="text-base font-bold text-charcoal">Order {activeQuote.code} Stock Allocation</h3>
                <p class="text-xs text-muted">System recommendation prioritizing stock availability & lowest shipping penalty.</p>
              </div>

              <div class="flex items-center gap-2">
                <button onClick={() => alert('Fulfillment split accepted.')} class="btn btn-sm btn-primary">
                  <Check class="w-4 h-4" /> Accept Suggested Split
                </button>
                <button onClick={() => alert('Manual override mode unlocked.')} class="btn btn-sm btn-outline">
                  <Sliders class="w-4 h-4" /> Manual Override
                </button>
              </div>
            </div>

            <div class="space-y-3 my-4">
              {activeQuote.lines.map(line => {
                const prod = data.products.find(p => p.id === line.productId);
                if (!prod) return null;
                return (
                  <div key={line.id} class="p-4 border border-warm rounded-lg bg-cream space-y-2">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="font-bold text-sm text-charcoal">{prod.name}</h4>
                        <p class="text-xs text-muted font-mono">SKU: {prod.sku} • Requested: {line.quantity} units</p>
                      </div>
                      <span class="badge badge-success text-xs">100% Allocated</span>
                    </div>

                    <div class="p-2.5 bg-charcoal-03 border border-warm rounded-md text-xs flex justify-between">
                      <span>Main Distribution Center (Central)</span>
                      <strong class="text-charcoal">+{line.quantity} units</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div class="lg:col-span-4 space-y-4">
          <div class="card">
            <h3 class="text-base font-bold text-charcoal mb-3 flex items-center gap-2">
              <Warehouse class="w-4 h-4" /> Live Warehouse Stock Levels
            </h3>

            <div class="space-y-3">
              {data.warehouses.map(wh => (
                <div key={wh.id} class="p-3 border border-warm rounded-lg bg-cream">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h4 class="font-bold text-xs text-charcoal">{wh.name}</h4>
                      <span class="text-[10px] text-muted">{wh.location}</span>
                    </div>
                    <span class="badge badge-neutral text-[10px]">Penalty: {wh.shippingWeightCost}x</span>
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
