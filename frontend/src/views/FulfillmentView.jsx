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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#e2e2e2] p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-black" /> Multi-Warehouse Fulfillment & Stock Split Engine
          </h2>
          <p className="text-sm text-[#5e5e5e] mt-1">
            Dynamically splits orders across regional depots based on live inventory to minimize shipment count, freight expense, and lead times.
          </p>
        </div>

        {/* Order Selector & Mode Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#e2e2e2] shrink-0">
            <span className="text-xs font-semibold text-[#5e5e5e] whitespace-nowrap shrink-0">Fulfilling Order:</span>
            <select
              value={selectedQuoteId}
              onChange={(e) => {
                setSelectedQuoteId(e.target.value);
                setActiveQuoteId(e.target.value);
                setIsOverrideMode(false);
                setDispatchedDetails(null);
              }}
              className="select text-sm font-bold border-none bg-transparent py-0 px-1 focus:ring-0 cursor-pointer text-black w-auto"
            >
              {data.quotations.map(q => (
                <option key={q.id} value={q.id}>
                  {q.code} • {data.customers.find(c => c.id === q.customerId)?.name || q.customerName || 'Client'} ({q.status})
                </option>
              ))}
            </select>
          </div>

          <span className={`badge ${isOverrideMode ? 'bg-[#efefef] text-black border border-black' : 'bg-black text-white'} text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-xs`}>
            {isOverrideMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isOverrideMode ? 'Manual Override Active' : 'Automated AI Split Active'}</span>
          </span>
        </div>
      </div>

      {/* ================= ORDER DISPATCH CONFIRMATION BANNER ================= */}
      {dispatchedDetails && (
        <div className="p-4 bg-[#fafafa] border border-black rounded-xl space-y-2 text-black shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-black" />
              <h4 className="font-bold text-base">
                Fulfillment Split Successfully Dispatched for Order {dispatchedDetails.quoteCode}!
              </h4>
            </div>
            <span className="text-xs font-mono text-[#5e5e5e]">
              Dispatched at {dispatchedDetails.timestamp}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm pt-1">
            <div className="bg-white p-3 rounded-lg border border-[#e2e2e2]">
              <span className="text-[#5e5e5e] block text-xs">Dispatch Mode</span>
              <strong className="font-semibold text-black">{dispatchedDetails.type}</strong>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#e2e2e2]">
              <span className="text-[#5e5e5e] block text-xs">Active Depots</span>
              <strong className="font-semibold text-black">{dispatchedDetails.shipments.length} Depot Shipments Generated</strong>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#e2e2e2]">
              <span className="text-[#5e5e5e] block text-xs">Total Freight Incurred</span>
              <strong className="font-semibold font-mono text-black">${dispatchedDetails.totalFreight.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ================= BACKORDER NOTIFICATION & INBOUND ARRIVAL PROMPT ================= */}
      {shipmentMetrics.totalUnitsBackordered > 0 && (
        <div className="p-4 bg-[#fafafa] border border-[#e2e2e2] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-black text-sm">
                {stockArrivedPrompt ? 'Inbound Supplier Replenishment Stock Arrived at Depot!' : `${shipmentMetrics.totalUnitsBackordered} Units Currently Reserved on Backorder`}
              </h4>
              <p className="text-xs text-[#5e5e5e] mt-0.5">
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
                className="btn btn-sm btn-outline border-black text-black hover:bg-[#efefef] py-1.5 px-3 flex items-center gap-1.5 font-semibold cursor-pointer text-xs"
                title="Simulate supplier stock arrival mid-fulfillment"
              >
                <span>🚚 Simulate Stock Arrival</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConsolidateBackorder}
                className="btn btn-sm btn-primary bg-black hover:bg-[#282828] text-white py-2 px-4 flex items-center gap-2 shadow-xs font-bold cursor-pointer text-xs"
                title="Consolidate all remaining backorder units into Chicago Depot"
              >
                <Package className="w-4 h-4 text-white" />
                <span>Consolidate Remaining Backorder</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= 4 KEY LOGISTICS METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Estimated Shipment Count */}
        <div className="card p-5 bg-white border border-[#e2e2e2] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#5e5e5e]">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Shipment Count</span>
            <Boxes className="w-5 h-5 text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black font-mono">
              {shipmentMetrics.shipmentCount}
            </span>
            <span className="text-sm text-[#5e5e5e] font-medium">
              Regional Shipment{shipmentMetrics.shipmentCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-[#5e5e5e]">
            {shipmentMetrics.shipmentCount === 1 
              ? 'Single-depot direct shipment achieved!' 
              : `Optimized multi-depot split across ${shipmentMetrics.shipmentCount} facilities.`}
          </p>
        </div>

        {/* Metric 2: Estimated Shipment Cost */}
        <div className="card p-5 bg-white border border-[#e2e2e2] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#5e5e5e]">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Shipment Cost</span>
            <DollarSign className="w-5 h-5 text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black font-mono">
              ${shipmentMetrics.totalFreightCost.toFixed(2)}
            </span>
            <span className="text-sm text-[#5e5e5e] font-medium">Total Freight</span>
          </div>
          <p className="text-xs text-[#5e5e5e]">
            Includes base dispatch fees + distance-weight handling.
          </p>
        </div>

        {/* Metric 3: Total Physical Units Fulfilled */}
        <div className="card p-5 bg-white border border-[#e2e2e2] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#5e5e5e]">
            <span className="text-xs font-bold uppercase tracking-wider">Physical Units to Ship</span>
            <Package className="w-5 h-5 text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black font-mono">
              {shipmentMetrics.totalUnitsShipped}
            </span>
            <span className="text-sm text-[#5e5e5e] font-medium">
              Units In-Stock
            </span>
          </div>
          <p className="text-xs text-[#5e5e5e]">
            {shipmentMetrics.totalUnitsBackordered > 0 
              ? `${shipmentMetrics.totalUnitsBackordered} units assigned to Backorder` 
              : '100% of physical units covered by live inventory.'}
          </p>
        </div>

        {/* Metric 4: Allocation Balance & Status */}
        <div className="card p-5 bg-white border border-[#e2e2e2] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#5e5e5e]">
            <span className="text-xs font-bold uppercase tracking-wider">Split Compliance</span>
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-black">
              {shipmentMetrics.isBalanced ? 'Balanced' : 'Mismatched'}
            </span>
          </div>
          <p className="text-xs text-[#5e5e5e]">
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
          <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-6 shadow-xs space-y-5">
            
            {/* Split Screen Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e2e2] pb-4">
              <div>
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <span>Order {quote.code} Warehouse Stock Split</span>
                  <span className="text-sm font-medium text-[#5e5e5e]">({customerName})</span>
                </h3>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
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
                      className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black flex items-center gap-2 shadow-xs cursor-pointer text-sm text-white"
                      title="Confirm and dispatch the recommended split across warehouses"
                    >
                      <Check className="w-4 h-4 text-white" />
                      <span>Accept Suggested Split</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleEnableOverride}
                      className="btn btn-sm btn-outline text-black border-black hover:bg-[#efefef] flex items-center gap-2 cursor-pointer text-sm"
                      title="Manually adjust quantity fulfilled from each warehouse"
                    >
                      <Sliders className="w-4 h-4 text-black" />
                      <span>Manual Override</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleResetToSuggested}
                      className="btn btn-sm btn-ghost text-black hover:bg-[#e2e2e2] flex items-center gap-1.5 text-sm"
                      title="Discard manual changes and restore system suggested split"
                    >
                      <RotateCcw className="w-4 h-4 text-black" />
                      <span>Reset to Suggested</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveManualSplit}
                      disabled={!shipmentMetrics.isBalanced}
                      className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black flex items-center gap-2 shadow-xs cursor-pointer text-sm text-white disabled:opacity-50"
                      title="Save and lock custom manual warehouse split"
                    >
                      <Save className="w-4 h-4 text-white" />
                      <span>Save Manual Split</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Line Items Split Breakdown */}
            {hardwareLines.length === 0 ? (
              <div className="text-center py-12 text-[#5e5e5e] space-y-2">
                <Package className="w-12 h-12 mx-auto text-[#afafaf]" />
                <p className="text-base font-semibold text-black">No Physical Hardware Products in this Order</p>
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
                    <div key={line.id} className="border border-[#e2e2e2] rounded-xl p-5 bg-[#fafafa] space-y-4 shadow-xs">
                      
                      {/* Product Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e2e2] pb-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h4 className="font-bold text-base text-black">{line.product.name}</h4>
                            <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-xs font-mono">{line.product.sku}</span>
                          </div>
                          <span className="text-sm text-[#5e5e5e] mt-0.5 block">
                            Total Order Quantity: <strong className="text-black font-mono">{line.quantity} Units</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-mono font-bold px-3.5 py-1.5 rounded-full border ${
                            isLineBalanced 
                              ? 'bg-black text-white border-black' 
                              : 'bg-[#efefef] text-black border-black'
                          }`}>
                            {totalLineAllocated} / {line.quantity} Units Allocated
                          </span>
                        </div>
                      </div>

                      {/* Warehouses Split Breakdown Cards */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-black block">
                          Warehouse Fulfillment Distribution:
                        </span>

                        <div className="grid grid-cols-1 gap-3">
                          {warehouses.map(wh => {
                            const fulfilledQty = parseInt(alloc[wh.id], 10) || 0;
                            const liveStock = wh.stock?.[line.productId] !== undefined ? wh.stock[line.productId] : 0;
                            const postStock = Math.max(0, liveStock - fulfilledQty);
                            const percentStockUsed = liveStock > 0 ? Math.min(100, Math.round((fulfilledQty / liveStock) * 100)) : 0;
                            const whLineFreight = (wh.baseCost || 15) + (fulfilledQty * (wh.perUnitCost || 4));

                            return (
                              <div 
                                key={wh.id} 
                                className={`p-4 rounded-xl border transition-all ${
                                  fulfilledQty > 0 
                                    ? 'bg-white border-black shadow-xs' 
                                    : 'bg-white border-[#e2e2e2] opacity-70'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  
                                  {/* 1. Warehouse Name & Details */}
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Warehouse className="w-4 h-4 text-black" />
                                      <h5 className="font-bold text-sm text-black">{wh.name}</h5>
                                      {wh.isPrimary && (
                                        <span className="badge bg-black text-white text-xs py-0.5">Primary Depot</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-[#5e5e5e] flex items-center gap-2">
                                      <span>{wh.location}</span>
                                      <span>•</span>
                                      <span className="text-black font-semibold">{wh.carrier} ({wh.eta})</span>
                                    </div>
                                  </div>

                                  {/* 2. Quantity Fulfilled from that warehouse */}
                                  <div className="flex items-center gap-5">
                                    <div className="text-right">
                                      <div className="text-sm">
                                        <span className="text-[#5e5e5e]">Quantity Fulfilled: </span>
                                        <strong className="text-black text-base font-bold font-mono">
                                          {fulfilledQty} Units
                                        </strong>
                                      </div>
                                      <div className="text-xs text-[#5e5e5e] font-mono">
                                        Live Stock: {liveStock} • After: {postStock}
                                      </div>
                                    </div>

                                    {/* 3. Estimated Shipment Cost for this warehouse */}
                                    <div className="text-right min-w-[100px] pl-4 border-l border-[#e2e2e2]">
                                      <span className="text-xs text-[#5e5e5e] block">Estimated Freight</span>
                                      <span className="text-sm font-mono font-bold text-black">
                                        {fulfilledQty > 0 ? `$${whLineFreight.toFixed(2)}` : '$0.00'}
                                      </span>
                                    </div>
                                  </div>

                                </div>

                                {/* Progress Bar of Depot Inventory Consumption */}
                                {liveStock > 0 && (
                                  <div className="mt-3 pt-2.5 border-t border-[#e2e2e2] flex items-center gap-3 text-xs">
                                    <span className="text-[#5e5e5e] shrink-0 font-medium">Depot Capacity:</span>
                                    <div className="flex-1 bg-[#efefef] h-2 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500 bg-black"
                                        style={{ width: `${percentStockUsed}%` }}
                                      />
                                    </div>
                                    <span className="font-mono font-semibold text-black">{percentStockUsed}% used</span>
                                  </div>
                                )}

                                {/* Manual Override Stepper (Visible in Override Mode) */}
                                {isOverrideMode && (
                                  <div className="mt-3 pt-3 border-t border-[#e2e2e2] bg-[#efefef] p-2.5 rounded-lg flex items-center justify-between text-sm">
                                    <span className="font-bold text-black text-xs flex items-center gap-1.5">
                                      <Sliders className="w-4 h-4 text-black" />
                                      Adjust Allocation for {wh.name}:
                                    </span>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateAllocation(line.id, wh.id, Math.max(0, fulfilledQty - 1), line.quantity)}
                                        className="w-8 h-8 rounded-lg bg-white border border-black hover:bg-[#efefef] flex items-center justify-center font-bold text-black shadow-xs cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        max={line.quantity}
                                        value={fulfilledQty}
                                        onChange={(e) => handleUpdateAllocation(line.id, wh.id, e.target.value, line.quantity)}
                                        className="input text-sm py-1 px-2 text-center font-mono font-bold w-16 bg-white border-black"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateAllocation(line.id, wh.id, fulfilledQty + 1, line.quantity)}
                                        className="w-8 h-8 rounded-lg bg-black text-white hover:bg-[#282828] flex items-center justify-center font-bold shadow-xs cursor-pointer"
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
                          <div className={`p-4 rounded-xl border ${
                            (alloc.backorder || 0) > 0 ? 'bg-white border-2 border-black' : 'bg-white border-[#e2e2e2] opacity-70'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <AlertCircle className="w-5 h-5 text-black" />
                                <div>
                                  <h5 className="font-bold text-sm text-black">Factory Direct Replenishment (Backorder)</h5>
                                  <span className="text-xs text-[#5e5e5e]">Lead time: 7–10 Business Days</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <span className="text-sm text-black font-bold font-mono">
                                    {(alloc.backorder || 0)} Units Reserved
                                  </span>
                                </div>

                                {isOverrideMode && (
                                  <div className="flex items-center gap-2 pl-3 border-l border-[#e2e2e2]">
                                    <input
                                      type="number"
                                      min="0"
                                      value={alloc.backorder || 0}
                                      onChange={(e) => handleUpdateAllocation(line.id, 'backorder', e.target.value, line.quantity)}
                                      className="input text-sm py-1 px-2 text-center font-mono font-bold w-16 bg-white border-black"
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
              <div className="p-4 bg-[#fafafa] border border-[#e2e2e2] rounded-xl text-sm space-y-1">
                <span className="font-bold text-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black" />
                  Additional Non-Physical Line Items in this Quotation:
                </span>
                <p className="text-[#5e5e5e] text-xs">
                  {digitalLines.map(l => `${l.product.name} (Qty: ${l.quantity})`).join(' • ')} are provisioned via digital license activation or onsite service engineer assignment without physical freight.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Live Stock & Shipment Manifest Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Active Shipments Breakdown Manifest */}
          <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-black flex items-center gap-2 border-b border-[#e2e2e2] pb-3">
              <Boxes className="w-5 h-5 text-black" />
              <span>Generated Shipment Manifest ({shipmentMetrics.shipmentCount})</span>
            </h3>

            {shipmentMetrics.activeShipments.length === 0 ? (
              <p className="text-sm text-[#5e5e5e] py-4 text-center">No warehouse shipments allocated yet.</p>
            ) : (
              <div className="space-y-3">
                {shipmentMetrics.activeShipments.map((ship, idx) => (
                  <div key={ship.warehouseId} className="p-4 bg-[#fafafa] border border-[#e2e2e2] rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-black flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span>{ship.warehouseName}</span>
                      </span>
                      <span className="badge bg-[#efefef] border border-black text-black text-xs font-mono font-bold">
                        ${ship.shipmentCost.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-xs text-[#5e5e5e] space-y-1 pt-1 border-t border-[#e2e2e2]">
                      <div className="flex justify-between">
                        <span>Carrier & Transit:</span>
                        <strong className="text-black">{ship.carrier}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery ETA:</span>
                        <strong className="text-black">{ship.eta}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Units Contributed:</span>
                        <strong className="font-mono text-black">{ship.unitsShipped} Units</strong>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Freight Box */}
                <div className="p-4 bg-black text-white rounded-xl flex items-center justify-between text-sm shadow-xs">
                  <div>
                    <span className="text-white/70 block text-xs uppercase tracking-wider">Total Estimated Freight</span>
                    <span className="font-bold text-xl text-white font-mono">
                      ${shipmentMetrics.totalFreightCost.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs bg-white/20 px-2.5 py-1 rounded text-white font-mono">
                    {shipmentMetrics.shipmentCount} Waybill{shipmentMetrics.shipmentCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Live Regional Warehouse Stock Monitor */}
          <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-black flex items-center gap-2 border-b border-[#e2e2e2] pb-3">
              <Warehouse className="w-5 h-5 text-black" />
              <span>Live Regional Warehouse Inventory</span>
            </h3>

            <div className="space-y-3 text-sm">
              {warehouses.map(wh => (
                <div key={wh.id} className="p-4 border border-[#e2e2e2] rounded-xl bg-[#fafafa] space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-black">{wh.name}</h4>
                      <span className="text-xs text-[#5e5e5e]">{wh.location}</span>
                    </div>
                    <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-[#e2e2e2] text-black font-semibold">
                      Base: ${wh.baseCost}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-[#e2e2e2] text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-[#5e5e5e]">Laptop X20 Stock:</span>
                      <strong className="text-black font-bold">{wh.stock?.['p-laptop'] || 0} Units</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#5e5e5e]">Thunderbolt Dock Stock:</span>
                      <strong className="text-black font-bold">{wh.stock?.['p-dock'] || 0} Units</strong>
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
