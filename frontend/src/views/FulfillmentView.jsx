import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Truck, 
  Check, 
  Sliders, 
  Warehouse, 
  Lock, 
  Unlock, 
  AlertCircle, 
  Save, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Package,
  DollarSign,
  Clock,
  Sparkles,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';

export const FulfillmentView = () => {
  const { 
    data, 
    activeQuote, 
    setActiveQuoteId, 
    showToast, 
    addApprovalLog, 
    currentRole,
    currentUser,
    dispatchFulfillmentSplit 
  } = useApp();

  const [selectedQuoteId, setSelectedQuoteId] = useState(activeQuote?.id || data.quotations[0]?.id || 'q-abc');
  const quote = (data.quotations || []).find(q => q.id === selectedQuoteId) || activeQuote || data.quotations[0] || null;

  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [manualAllocations, setManualAllocations] = useState({});
  const [dispatchedDetails, setDispatchedDetails] = useState(null);
  const [stockArrivedPrompt, setStockArrivedPrompt] = useState(false);

  // Available Warehouses from AppContext with fallback defaults
  const warehouses = useMemo(() => {
    return (data.warehouses && data.warehouses.length > 0) ? data.warehouses : [
      { 
        id: 'wh-main', 
        name: 'Main Distribution Center (Central Hub)', 
        location: 'Chicago, IL', 
        shippingWeightCost: 1.0, 
        baseCost: 15, 
        perUnitCost: 4, 
        eta: '2 Business Days',
        carrier: 'FedEx Freight Direct',
        isPrimary: true,
        stock: { 'p-laptop': 12, 'p-dock': 60 } 
      },
      { 
        id: 'wh-east', 
        name: 'East Coast Fast-Fulfillment Depot', 
        location: 'Newark, NJ', 
        shippingWeightCost: 1.4, 
        baseCost: 20, 
        perUnitCost: 6, 
        eta: '1-2 Business Days',
        carrier: 'UPS Ground Regional',
        isPrimary: false,
        stock: { 'p-laptop': 6, 'p-dock': 30 } 
      },
      { 
        id: 'wh-west', 
        name: 'West Coast Logistics Hub', 
        location: 'San Francisco, CA', 
        shippingWeightCost: 1.6, 
        baseCost: 25, 
        perUnitCost: 7, 
        eta: '3 Business Days',
        carrier: 'OnTrac Express Freight',
        isPrimary: false,
        stock: { 'p-laptop': 8, 'p-dock': 25 } 
      }
    ];
  }, [data.warehouses]);

  // Physical Hardware lines requiring shipping
  const hardwareLines = useMemo(() => {
    if (!quote || !quote.lines) return [];
    return quote.lines.map(line => {
      const product = (data.products || []).find(p => p.id === line.productId) || {
        id: line.productId || line.id,
        name: line.name || 'Hardware Equipment',
        sku: 'HW-GEN-01',
        category: 'Hardware',
        listPrice: line.unitPrice || 1000
      };
      return { ...line, product };
    }).filter(line => line.product.category === 'Hardware');
  }, [quote, data.products]);

  // Non-hardware lines (Services & Cloud Subscriptions)
  const digitalLines = useMemo(() => {
    if (!quote || !quote.lines) return [];
    return quote.lines.map(line => {
      const product = (data.products || []).find(p => p.id === line.productId) || {
        id: line.productId || line.id,
        name: line.name || 'Service Item',
        category: 'Service'
      };
      return { ...line, product };
    }).filter(line => line.product.category !== 'Hardware');
  }, [quote, data.products]);

  // AUTOMATED STOCK SPLIT RECOMMENDATION ENGINE
  // Prioritizes warehouses by lowest shipping rate / weight penalty until stock is exhausted
  const suggestedSplits = useMemo(() => {
    const splits = {};
    const sortedDepots = [...warehouses].sort((a, b) => (a.shippingWeightCost || 1) - (b.shippingWeightCost || 1));

    hardwareLines.forEach(line => {
      let needed = line.quantity || 1;
      const lineSplit = {};

      sortedDepots.forEach(wh => {
        const availableStock = (wh.stock && wh.stock[line.productId] !== undefined) 
          ? wh.stock[line.productId] 
          : 0;
        const take = Math.min(needed, availableStock);
        lineSplit[wh.id] = take;
        needed -= take;
      });

      // Remainder goes to backorder
      lineSplit.backorder = Math.max(0, needed);
      splits[line.id] = lineSplit;
    });

    return splits;
  }, [hardwareLines, warehouses]);

  // Active allocations: manual override if set, otherwise automated suggested split
  const currentAllocations = useMemo(() => {
    if (isOverrideMode && Object.keys(manualAllocations).length > 0) {
      return manualAllocations;
    }
    return suggestedSplits;
  }, [isOverrideMode, manualAllocations, suggestedSplits]);

  // Initialize or reset manual allocations
  const handleEnableOverride = () => {
    setIsOverrideMode(true);
    setManualAllocations(JSON.parse(JSON.stringify(suggestedSplits)));
    showToast('✏️ Manual Override Mode Unlocked. You can now customize quantities per warehouse.', 'info');
  };

  const handleResetToSuggested = () => {
    setManualAllocations(JSON.parse(JSON.stringify(suggestedSplits)));
    showToast('↺ Reset allocations to system-recommended split.', 'info');
  };

  const handleUpdateAllocation = (lineId, warehouseKey, value, maxTotal) => {
    const qty = Math.max(0, parseInt(value, 10) || 0);
    setManualAllocations(prev => {
      const linePrev = { ...(prev[lineId] || suggestedSplits[lineId] || {}) };
      linePrev[warehouseKey] = qty;
      return {
        ...prev,
        [lineId]: linePrev
      };
    });
  };

  // ESTIMATED SHIPMENT COUNT AND FREIGHT COST CALCULATION
  const shipmentMetrics = useMemo(() => {
    const activeShipments = [];
    let totalFreight = 0;
    let totalUnitsShipped = 0;
    let totalUnitsBackordered = 0;

    warehouses.forEach(wh => {
      let unitsFromWh = 0;
      const lineItemsShipped = [];

      hardwareLines.forEach(line => {
        const alloc = currentAllocations[line.id];
        const count = alloc ? (alloc[wh.id] || 0) : 0;
        if (count > 0) {
          unitsFromWh += count;
          lineItemsShipped.push({
            productId: line.productId,
            name: line.product.name,
            sku: line.product.sku,
            quantity: count
          });
        }
      });

      if (unitsFromWh > 0) {
        const cost = (wh.baseCost || 15) + (unitsFromWh * (wh.perUnitCost || 4));
        totalFreight += cost;
        totalUnitsShipped += unitsFromWh;

        activeShipments.push({
          warehouseId: wh.id,
          warehouseName: wh.name,
          location: wh.location,
          carrier: wh.carrier || 'Standard Freight',
          eta: wh.eta || '2-3 Business Days',
          unitsShipped: unitsFromWh,
          shipmentCost: cost,
          baseCost: wh.baseCost || 15,
          perUnitCost: wh.perUnitCost || 4,
          lineItems: lineItemsShipped
        });
      }
    });

    // Check Backorders
    hardwareLines.forEach(line => {
      const alloc = currentAllocations[line.id];
      const bo = alloc ? (alloc.backorder || 0) : 0;
      totalUnitsBackordered += bo;
    });

    const isBalanced = hardwareLines.every(line => {
      const alloc = currentAllocations[line.id] || {};
      const sum = Object.values(alloc).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
      return sum === line.quantity;
    });

    return {
      shipmentCount: activeShipments.length,
      activeShipments,
      totalFreightCost: totalFreight,
      totalUnitsShipped,
      totalUnitsBackordered,
      isBalanced
    };
  }, [warehouses, hardwareLines, currentAllocations]);

  // ACTION: Accept Suggested Split
  const handleAcceptSuggestedSplit = () => {
    const splitPlan = hardwareLines.map(line => ({
      lineId: line.id,
      productId: line.productId,
      productName: line.product.name,
      totalQuantity: line.quantity,
      allocations: suggestedSplits[line.id]
    }));

    if (dispatchFulfillmentSplit) {
      dispatchFulfillmentSplit({
        quoteId: quote.id,
        splitPlan,
        shipmentCount: shipmentMetrics.shipmentCount,
        totalFreightCost: shipmentMetrics.totalFreightCost,
        isManualOverride: false
      });
    }

    setDispatchedDetails({
      quoteCode: quote.code,
      type: 'Automated Suggested Split',
      shipments: shipmentMetrics.activeShipments,
      backordered: shipmentMetrics.totalUnitsBackordered,
      totalFreight: shipmentMetrics.totalFreightCost,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  // ACTION: Save Manual Split
  const handleSaveManualSplit = () => {
    if (!shipmentMetrics.isBalanced) {
      showToast('⚠️ Cannot save: Total warehouse allocations do not match the required order quantity.', 'warning');
      return;
    }

    const splitPlan = hardwareLines.map(line => ({
      lineId: line.id,
      productId: line.productId,
      productName: line.product.name,
      totalQuantity: line.quantity,
      allocations: currentAllocations[line.id]
    }));

    if (dispatchFulfillmentSplit) {
      dispatchFulfillmentSplit({
        quoteId: quote.id,
        splitPlan,
        shipmentCount: shipmentMetrics.shipmentCount,
        totalFreightCost: shipmentMetrics.totalFreightCost,
        isManualOverride: true
      });
    }

    setIsOverrideMode(false);

    setDispatchedDetails({
      quoteCode: quote.code,
      type: 'Manual Custom Split',
      shipments: shipmentMetrics.activeShipments,
      backordered: shipmentMetrics.totalUnitsBackordered,
      totalFreight: shipmentMetrics.totalFreightCost,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  if (!quote) {
    return (
      <div className="card text-center py-12 space-y-3">
        <Truck className="w-12 h-12 text-muted mx-auto" />
        <h3 className="text-base font-bold text-charcoal">No Active Order Selected</h3>
        <p className="text-xs text-muted">Create a quotation first to view warehouse fulfillment splits.</p>
      </div>
    );
  }

  // ACTION: Inbound Stock Arrival Simulation & Backorder Consolidation (PDF Section B6)
  const handleSimulateInboundStock = () => {
    setStockArrivedPrompt(true);
    showToast('🚚 Inbound factory replenishment stock arrived at Chicago Central Depot!', 'info');
  };

  const handleConsolidateBackorder = () => {
    setManualAllocations(prev => {
      const updated = { ...prev };
      hardwareLines.forEach(line => {
        const lineAlloc = { ...(updated[line.id] || suggestedSplits[line.id] || {}) };
        const bo = lineAlloc.backorder || 0;
        if (bo > 0) {
          lineAlloc.backorder = 0;
          lineAlloc['wh-main'] = (lineAlloc['wh-main'] || 0) + bo;
          updated[line.id] = lineAlloc;
        }
      });
      return updated;
    });
    setIsOverrideMode(true);
    setStockArrivedPrompt(false);
    showToast('📦 Remaining backorder consolidated into Main Distribution Center (Chicago Hub)!', 'success');
  };

  const customerName = data.customers.find(c => c.id === quote.customerId)?.name || quote.customerName || 'Corporate Client';

  return (
    <div className="space-y-6">
      
      {/* ================= TOP HEADER BANNER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" /> Multi-Warehouse Fulfillment & Stock Split Engine
            </h2>
            <span className="badge badge-info text-[10px] font-bold">Logistics v2.4</span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Dynamically splits orders across regional depots based on live inventory to minimize shipment count, freight expense, and lead times.
          </p>
        </div>

        {/* Order Selector & Mode Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-warm">
            <span className="text-[11px] font-semibold text-muted">Fulfilling Order:</span>
            <select
              value={selectedQuoteId}
              onChange={(e) => {
                setSelectedQuoteId(e.target.value);
                setActiveQuoteId(e.target.value);
                setIsOverrideMode(false);
                setDispatchedDetails(null);
              }}
              className="select text-xs font-bold border-none bg-transparent py-0.5 px-1 focus:ring-0 cursor-pointer text-charcoal"
            >
              {data.quotations.map(q => (
                <option key={q.id} value={q.id}>
                  {q.code} • {data.customers.find(c => c.id === q.customerId)?.name || q.customerName || 'Client'} ({q.status})
                </option>
              ))}
            </select>
          </div>

          <span className={`badge ${isOverrideMode ? 'badge-warning' : 'badge-success'} text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-2xs`}>
            {isOverrideMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isOverrideMode ? 'Manual Override Active' : 'Automated AI Split Active'}</span>
          </span>
        </div>
      </div>

      {/* ================= ORDER DISPATCH CONFIRMATION BANNER ================= */}
      {dispatchedDetails && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-900 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-sm">
                Fulfillment Split Successfully Dispatched for Order {dispatchedDetails.quoteCode}!
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-700">
              Dispatched at {dispatchedDetails.timestamp}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
              <span className="text-muted block text-[10px]">Dispatch Mode</span>
              <strong className="font-semibold text-emerald-950">{dispatchedDetails.type}</strong>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
              <span className="text-muted block text-[10px]">Active Depots</span>
              <strong className="font-semibold text-emerald-950">{dispatchedDetails.shipments.length} Depot Shipments Generated</strong>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
              <span className="text-muted block text-[10px]">Total Freight Incurred</span>
              <strong className="font-semibold font-mono text-emerald-950">${dispatchedDetails.totalFreight.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ================= BACKORDER NOTIFICATION & INBOUND ARRIVAL PROMPT (PDF Section B6) ================= */}
      {shipmentMetrics.totalUnitsBackordered > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-blue-950 text-xs">
                {stockArrivedPrompt ? '📦 Inbound Supplier Replenishment Stock Arrived at Depot!' : `${shipmentMetrics.totalUnitsBackordered} Units Currently Reserved on Backorder`}
              </h4>
              <p className="text-[11px] text-blue-800">
                {stockArrivedPrompt 
                  ? 'Replenishment shipment received at Chicago Depot. Consolidate backorder into a single depot shipment now.' 
                  : 'Pending factory replenishment. You can simulate inbound arrival to consolidate into a single shipment.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!stockArrivedPrompt ? (
              <button
                type="button"
                onClick={handleSimulateInboundStock}
                className="btn btn-xs btn-outline border-blue-300 text-blue-900 hover:bg-blue-100 py-1 px-2.5 flex items-center gap-1 font-semibold cursor-pointer"
                title="Simulate supplier stock arrival mid-fulfillment"
              >
                <span>🚚 Simulate Stock Arrival</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConsolidateBackorder}
                className="btn btn-sm btn-primary bg-blue-800 hover:bg-blue-900 border-blue-800 text-white py-1.5 px-3 flex items-center gap-1.5 shadow-2xs font-bold cursor-pointer"
                title="Consolidate all remaining backorder units into Chicago Depot"
              >
                <Package className="w-4 h-4" />
                <span>Consolidate Remaining Backorder</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= 4 KEY LOGISTICS METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Estimated Shipment Count */}
        <div className="card p-4 bg-white border border-warm rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Shipment Count</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal font-mono">
              {shipmentMetrics.shipmentCount}
            </span>
            <span className="text-xs text-muted font-medium">
              Regional Shipment{shipmentMetrics.shipmentCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[11px] text-muted">
            {shipmentMetrics.shipmentCount === 1 
              ? '✨ Single-depot direct shipment achieved!' 
              : `Optimized multi-depot split across ${shipmentMetrics.shipmentCount} facilities.`}
          </p>
        </div>

        {/* Metric 2: Estimated Shipment Cost */}
        <div className="card p-4 bg-white border border-warm rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Shipment Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              ${shipmentMetrics.totalFreightCost.toFixed(2)}
            </span>
            <span className="text-xs text-muted font-medium">Total Freight</span>
          </div>
          <p className="text-[11px] text-muted">
            Includes base dispatch fees + distance-weight handling.
          </p>
        </div>

        {/* Metric 3: Total Physical Units Fulfilled */}
        <div className="card p-4 bg-white border border-warm rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Physical Units to Ship</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal font-mono">
              {shipmentMetrics.totalUnitsShipped}
            </span>
            <span className="text-xs text-muted font-medium">
              Units In-Stock
            </span>
          </div>
          <p className="text-[11px] text-muted">
            {shipmentMetrics.totalUnitsBackordered > 0 
              ? `⚠️ ${shipmentMetrics.totalUnitsBackordered} units assigned to Backorder` 
              : '✅ 100% of physical units covered by live inventory.'}
          </p>
        </div>

        {/* Metric 4: Allocation Balance & Status */}
        <div className="card p-4 bg-white border border-warm rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Split Compliance</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black ${shipmentMetrics.isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
              {shipmentMetrics.isBalanced ? 'Balanced' : 'Mismatched'}
            </span>
          </div>
          <p className="text-[11px] text-muted">
            {shipmentMetrics.isBalanced 
              ? 'Allocated units perfectly match customer purchase order.' 
              : 'Allocated sum does not match requested line items!'}
          </p>
        </div>

      </div>

      {/* ================= MAIN CONTENT: WAREHOUSE SPLIT & OVERRIDE SCREEN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Recommended Warehouse Split per Line (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="card bg-white border border-warm rounded-2xl p-5 shadow-xs space-y-4">
            
            {/* Split Screen Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                  <span>Order {quote.code} Warehouse Stock Split</span>
                  <span className="text-xs font-medium text-muted">({customerName})</span>
                </h3>
                <p className="text-xs text-muted">
                  {isOverrideMode 
                    ? 'Manual Override Mode Active: Adjust quantity fulfilled from each warehouse below.'
                    : 'Recommended warehouse split calculated automatically using live depot stock & lowest shipping penalty.'}
                </p>
              </div>

              {/* ACTION BUTTONS: Accept Suggested Split vs Manual Override */}
              <div className="flex items-center gap-2">
                {!isOverrideMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAcceptSuggestedSplit}
                      className="btn btn-sm btn-primary bg-emerald-800 hover:bg-emerald-900 border-emerald-800 flex items-center gap-1.5 shadow-2xs cursor-pointer text-xs"
                      title="Confirm and dispatch the recommended split across warehouses"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Suggested Split</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleEnableOverride}
                      className="btn btn-sm btn-outline text-amber-800 border-amber-300 hover:bg-amber-50 flex items-center gap-1.5 cursor-pointer text-xs"
                      title="Manually adjust quantity fulfilled from each warehouse"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Manual Override</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleResetToSuggested}
                      className="btn btn-sm btn-ghost text-muted hover:text-charcoal flex items-center gap-1 text-xs"
                      title="Discard manual changes and restore system suggested split"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Suggested</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveManualSplit}
                      disabled={!shipmentMetrics.isBalanced}
                      className="btn btn-sm btn-primary bg-amber-800 hover:bg-amber-900 border-amber-900 flex items-center gap-1.5 shadow-2xs cursor-pointer text-xs disabled:opacity-50"
                      title="Save and lock custom manual warehouse split"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Manual Split</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Line Items Split Breakdown */}
            {hardwareLines.length === 0 ? (
              <div className="text-center py-10 text-muted space-y-2">
                <Package className="w-10 h-10 mx-auto text-warm" />
                <p className="text-sm font-semibold text-charcoal">No Physical Hardware Products in this Order</p>
                <p className="text-xs">
                  This quotation contains only Services or Cloud Subscriptions which are fulfilled digitally without warehouse freight.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {hardwareLines.map(line => {
                  const alloc = currentAllocations[line.id] || suggestedSplits[line.id] || {};
                  const totalLineAllocated = warehouses.reduce((sum, wh) => sum + (parseInt(alloc[wh.id], 10) || 0), 0) + (parseInt(alloc.backorder, 10) || 0);
                  const isLineBalanced = totalLineAllocated === line.quantity;

                  return (
                    <div key={line.id} className="border border-warm rounded-xl p-4 bg-cream/50 space-y-3 shadow-2xs">
                      
                      {/* Product Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm/60 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-charcoal">{line.product.name}</h4>
                            <span className="badge badge-neutral text-[10px] font-mono">{line.product.sku}</span>
                          </div>
                          <span className="text-xs text-muted">
                            Total Order Quantity: <strong className="text-charcoal font-mono">{line.quantity} Units</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                            isLineBalanced 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {totalLineAllocated} / {line.quantity} Units Allocated
                          </span>
                        </div>
                      </div>

                      {/* Warehouses Split Breakdown Cards */}
                      <div className="space-y-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                          Warehouse Fulfillment Distribution:
                        </span>

                        <div className="grid grid-cols-1 gap-2.5">
                          {warehouses.map(wh => {
                            const fulfilledQty = parseInt(alloc[wh.id], 10) || 0;
                            const liveStock = wh.stock?.[line.productId] !== undefined ? wh.stock[line.productId] : 0;
                            const postStock = Math.max(0, liveStock - fulfilledQty);
                            const percentStockUsed = liveStock > 0 ? Math.min(100, Math.round((fulfilledQty / liveStock) * 100)) : 0;
                            const whLineFreight = (wh.baseCost || 15) + (fulfilledQty * (wh.perUnitCost || 4));

                            return (
                              <div 
                                key={wh.id} 
                                className={`p-3.5 rounded-xl border transition-all ${
                                  fulfilledQty > 0 
                                    ? 'bg-white border-warm shadow-2xs' 
                                    : 'bg-white/50 border-warm/40 opacity-70'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  
                                  {/* 1. Warehouse Name & Details */}
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <Warehouse className={`w-4 h-4 ${fulfilledQty > 0 ? 'text-blue-600' : 'text-muted'}`} />
                                      <h5 className="font-bold text-xs text-charcoal">{wh.name}</h5>
                                      {wh.isPrimary && (
                                        <span className="badge badge-info text-[9px] py-0.2">Primary Depot</span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted flex items-center gap-2">
                                      <span>{wh.location}</span>
                                      <span>•</span>
                                      <span className="text-emerald-700 font-semibold">{wh.carrier} ({wh.eta})</span>
                                    </div>
                                  </div>

                                  {/* 2. Quantity Fulfilled from that warehouse */}
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-xs">
                                        <span className="text-muted">Quantity Fulfilled: </span>
                                        <strong className="text-charcoal text-sm font-bold font-mono">
                                          {fulfilledQty} Units
                                        </strong>
                                      </div>
                                      <div className="text-[10px] text-muted font-mono">
                                        Live Stock: {liveStock} • After: {postStock}
                                      </div>
                                    </div>

                                    {/* 3. Estimated Shipment Cost for this warehouse */}
                                    <div className="text-right min-w-[90px] pl-3 border-l border-warm">
                                      <span className="text-[10px] text-muted block">Estimated Freight</span>
                                      <span className="text-xs font-mono font-bold text-charcoal">
                                        {fulfilledQty > 0 ? `$${whLineFreight.toFixed(2)}` : '$0.00'}
                                      </span>
                                    </div>
                                  </div>

                                </div>

                                {/* Progress Bar of Depot Inventory Consumption */}
                                {liveStock > 0 && (
                                  <div className="mt-2.5 pt-2 border-t border-warm/40 flex items-center gap-3 text-[10px]">
                                    <span className="text-muted shrink-0">Depot Capacity:</span>
                                    <div className="flex-1 bg-charcoal-03 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          percentStockUsed > 80 ? 'bg-amber-500' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${percentStockUsed}%` }}
                                      />
                                    </div>
                                    <span className="font-mono text-muted">{percentStockUsed}% used</span>
                                  </div>
                                )}

                                {/* Manual Override Stepper (Visible in Override Mode) */}
                                {isOverrideMode && (
                                  <div className="mt-3 pt-2.5 border-t border-amber-200 bg-amber-50/50 p-2 rounded-lg flex items-center justify-between text-xs">
                                    <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                                      <Sliders className="w-3.5 h-3.5 text-amber-700" />
                                      Adjust Allocation for {wh.name}:
                                    </span>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateAllocation(line.id, wh.id, Math.max(0, fulfilledQty - 1), line.quantity)}
                                        className="w-7 h-7 rounded-lg bg-white border border-warm hover:bg-cream flex items-center justify-center font-bold text-charcoal shadow-2xs cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        max={line.quantity}
                                        value={fulfilledQty}
                                        onChange={(e) => handleUpdateAllocation(line.id, wh.id, e.target.value, line.quantity)}
                                        className="input text-xs py-1 px-2 text-center font-mono font-bold w-16 bg-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateAllocation(line.id, wh.id, fulfilledQty + 1, line.quantity)}
                                        className="w-7 h-7 rounded-lg bg-charcoal text-white hover:bg-black flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}

                              </div>
                            );
                          })}

                          {/* Backorder Option */}
                          <div className={`p-3 rounded-xl border ${
                            (alloc.backorder || 0) > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-warm/40 opacity-70'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <div>
                                  <h5 className="font-bold text-xs text-amber-950">Factory Direct Replenishment (Backorder)</h5>
                                  <span className="text-[10px] text-amber-800">Lead time: 7–10 Business Days</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-xs text-amber-900 font-bold font-mono">
                                    {(alloc.backorder || 0)} Units Reserved
                                  </span>
                                </div>

                                {isOverrideMode && (
                                  <div className="flex items-center gap-1.5 pl-2 border-l border-amber-200">
                                    <input
                                      type="number"
                                      min="0"
                                      value={alloc.backorder || 0}
                                      onChange={(e) => handleUpdateAllocation(line.id, 'backorder', e.target.value, line.quantity)}
                                      className="input text-xs py-0.5 px-2 text-center font-mono font-bold w-16 bg-white border-amber-300"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Non-Physical Services & Subscriptions Notice */}
            {digitalLines.length > 0 && (
              <div className="p-3.5 bg-charcoal-03 border border-warm rounded-xl text-xs space-y-1">
                <span className="font-bold text-charcoal flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Additional Non-Physical Line Items in this Quotation:
                </span>
                <p className="text-muted text-[11px]">
                  {digitalLines.map(l => `${l.product.name} (Qty: ${l.quantity})`).join(' • ')} are provisioned via digital license activation or onsite service engineer assignment without physical freight.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Live Stock & Shipment Manifest Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Active Shipments Breakdown Manifest */}
          <div className="card bg-white border border-warm rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-charcoal flex items-center gap-2 border-b border-warm pb-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>Generated Shipment Manifest ({shipmentMetrics.shipmentCount})</span>
            </h3>

            {shipmentMetrics.activeShipments.length === 0 ? (
              <p className="text-xs text-muted py-3 text-center">No warehouse shipments allocated yet.</p>
            ) : (
              <div className="space-y-3">
                {shipmentMetrics.activeShipments.map((ship, idx) => (
                  <div key={ship.warehouseId} className="p-3 bg-cream border border-warm rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-charcoal flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{ship.warehouseName}</span>
                      </span>
                      <span className="badge badge-success text-[10px] font-bold">
                        ${ship.shipmentCost.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted space-y-0.5">
                      <div className="flex justify-between">
                        <span>Carrier & Transit:</span>
                        <strong className="text-charcoal">{ship.carrier}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery ETA:</span>
                        <strong className="text-emerald-700">{ship.eta}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Units Contributed:</span>
                        <strong className="font-mono text-charcoal">{ship.unitsShipped} Units</strong>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Freight Box */}
                <div className="p-3 bg-charcoal text-white rounded-xl flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <span className="text-white/70 block text-[10px] uppercase tracking-wider">Total Estimated Freight</span>
                    <span className="font-bold text-sm text-emerald-400 font-mono">
                      ${shipmentMetrics.totalFreightCost.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/80 font-mono">
                    {shipmentMetrics.shipmentCount} Waybill{shipmentMetrics.shipmentCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Live Regional Warehouse Stock Monitor */}
          <div className="card bg-white border border-warm rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-charcoal flex items-center gap-2 border-b border-warm pb-2">
              <Warehouse className="w-4 h-4 text-charcoal" />
              <span>Live Regional Warehouse Inventory</span>
            </h3>

            <div className="space-y-3 text-xs">
              {warehouses.map(wh => (
                <div key={wh.id} className="p-3 border border-warm rounded-xl bg-cream/60 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-charcoal">{wh.name}</h4>
                      <span className="text-[10px] text-muted">{wh.location}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-warm text-muted">
                      Base: ${wh.baseCost}
                    </span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-warm/50 text-[11px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Laptop X20 Stock:</span>
                      <strong className="text-charcoal font-bold">{wh.stock?.['p-laptop'] || 0} Units</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Thunderbolt Dock Stock:</span>
                      <strong className="text-charcoal font-bold">{wh.stock?.['p-dock'] || 0} Units</strong>
                    </div>
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
