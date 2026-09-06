import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  FileCheck, 
  Calculator, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  RotateCcw, 
  Receipt, 
  ShieldCheck, 
  Check, 
  Layers, 
  Percent,
  XCircle,
  TrendingDown,
  TrendingUp,
  Package
} from 'lucide-react';

export const BillingView = () => {
  const { 
    data, 
    activeQuote, 
    setActiveQuoteId, 
    updateActiveQuote, 
    showToast, 
    addApprovalLog,
    currentUser 
  } = useApp();

  const [selectedQuoteId, setSelectedQuoteId] = useState(activeQuote?.id || data.quotations[0]?.id || 'q-abc');
  const quote = (data.quotations || []).find(q => q.id === selectedQuoteId) || activeQuote || data.quotations[0] || null;

  // Mid-cycle proration simulator state
  const [prorationOldQty, setProrationOldQty] = useState(20);
  const [prorationNewQty, setProrationNewQty] = useState(25);
  const [daysElapsed, setDaysElapsed] = useState(10);
  const [activePlanPrice, setActivePlanPrice] = useState(30); // $30/month per seat ($360/yr)

  // Invoices payment state per quotation
  const [paymentStatusMap, setPaymentStatusMap] = useState({
    'inv-1': { status: 'Paid', paidAt: 'Paid via ACH Transfer', txnId: 'TXN-904128' }
  });

  // Credit Notes Issued state
  const [creditNotes, setCreditNotes] = useState([]);

  // Filter line items into One-Time (Hardware & Setup Services) vs. Recurring Subscriptions
  const { oneTimeLines, recurringLines, oneTimeTotal, recurringMonthlyTotal } = useMemo(() => {
    if (!quote || !quote.lines) {
      return { oneTimeLines: [], recurringLines: [], oneTimeTotal: 0, recurringMonthlyTotal: 0 };
    }

    const oneTime = [];
    const recurring = [];
    let oneTimeSum = 0;
    let recurringSum = 0;

    quote.lines.forEach(line => {
      const product = (data.products || []).find(p => p.id === line.productId) || {
        id: line.productId || line.id,
        name: line.name || 'Product / Service Item',
        category: 'Hardware',
        listPrice: line.unitPrice || 0
      };

      const unitPrice = line.unitPrice || product.listPrice || 0;
      const discountPct = line.discountPct || 0;
      const qty = line.quantity || 1;
      const netLineTotal = unitPrice * (1 - discountPct / 100) * qty;

      if (product.category === 'Subscription' || product.isRecurring) {
        // Recurring subscription (annual license converted to monthly rate: / 12)
        const monthlyRate = netLineTotal / 12;
        recurringSum += monthlyRate;
        recurring.push({
          ...line,
          product,
          unitPrice,
          discountPct,
          quantity: qty,
          annualNetTotal: netLineTotal,
          monthlyNetTotal: monthlyRate
        });
      } else {
        // One-time physical hardware or professional service
        oneTimeSum += netLineTotal;
        oneTime.push({
          ...line,
          product,
          unitPrice,
          discountPct,
          quantity: qty,
          netTotal: netLineTotal
        });
      }
    });

    return {
      oneTimeLines: oneTime,
      recurringLines: recurring,
      oneTimeTotal: oneTimeSum,
      recurringMonthlyTotal: recurringSum
    };
  }, [quote, data.products]);

  // Generated 12-Month Billing Schedule
  const billingSchedule = useMemo(() => {
    const schedule = [];
    const startDate = new Date();

    for (let month = 1; month <= 12; month++) {
      const billDate = new Date(startDate);
      billDate.setMonth(startDate.getMonth() + (month - 1));
      const periodLabel = billDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const isFirstMonth = month === 1;
      const oneTimeAmt = isFirstMonth ? oneTimeTotal : 0;
      const recurringAmt = recurringMonthlyTotal > 0 ? recurringMonthlyTotal : (isFirstMonth ? 0 : 300);
      const totalInvoiceAmt = oneTimeAmt + recurringAmt;
      const invId = `inv-${month}`;

      const paymentInfo = paymentStatusMap[invId] || {
        status: isFirstMonth ? 'Pending Payment' : 'Scheduled',
        paidAt: null,
        txnId: null
      };

      schedule.push({
        id: invId,
        invoiceCode: `INV-2026-${String(month).padStart(3, '0')}`,
        monthNumber: month,
        periodLabel: isFirstMonth ? `${periodLabel} (Immediate Initial)` : periodLabel,
        oneTimeAmount: oneTimeAmt,
        recurringAmount: recurringAmt,
        totalAmount: totalInvoiceAmt,
        status: paymentInfo.status,
        paidAt: paymentInfo.paidAt,
        txnId: paymentInfo.txnId
      });
    }

    return schedule;
  }, [oneTimeTotal, recurringMonthlyTotal, paymentStatusMap]);

  // Mid-cycle proration mathematical calculation
  const prorationCalculations = useMemo(() => {
    const cycleDays = 30;
    const daysRemaining = Math.max(0, cycleDays - daysElapsed);

    const oldTotalMonth = prorationOldQty * activePlanPrice;
    const newTotalMonth = prorationNewQty * activePlanPrice;

    // Used cost up to change date + new cost for remaining days
    const usedCost = (oldTotalMonth / cycleDays) * daysElapsed;
    const remainingCost = (newTotalMonth / cycleDays) * daysRemaining;
    const adjustedMonthCost = usedCost + remainingCost;
    const adjustmentDelta = adjustedMonthCost - oldTotalMonth;

    const isExpansion = adjustmentDelta >= 0;

    return {
      oldTotalMonth,
      newTotalMonth,
      usedCost,
      remainingCost,
      adjustedMonthCost,
      adjustmentDelta,
      isExpansion,
      daysRemaining
    };
  }, [prorationOldQty, prorationNewQty, daysElapsed, activePlanPrice]);

  // ACTION: Record Payment for Invoice (Passes Step 8 of Quick Test Flow)
  const handleRecordPayment = (invoice) => {
    const newTxnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPaymentStatusMap(prev => ({
      ...prev,
      [invoice.id]: {
        status: 'Paid',
        paidAt: `Paid today at ${timestamp}`,
        txnId: newTxnId
      }
    }));

    addApprovalLog({
      quoteId: quote.id,
      user: currentUser?.name || 'Finance Officer',
      role: 'finance',
      action: `Invoice Payment Recorded (${invoice.invoiceCode})`,
      blendedRiskScore: 0,
      reason: `Recorded payment of $${invoice.totalAmount.toFixed(2)} via Corporate ACH (Ref: ${newTxnId}). Invoice status updated to Paid.`
    });

    showToast(`✅ Payment of $${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} recorded for ${invoice.invoiceCode}! Status updated to PAID.`, 'success');
  };

  // ACTION: Issue Prorated Surcharge Invoice (Expansion)
  const handleIssueProratedInvoice = () => {
    const newInvId = `prorated-inv-${Date.now()}`;
    const amount = prorationCalculations.adjustmentDelta;

    addApprovalLog({
      quoteId: quote.id,
      user: currentUser?.name || 'Finance Officer',
      role: 'finance',
      action: 'Issued Mid-Cycle Prorated Surcharge Invoice',
      blendedRiskScore: 0,
      reason: `Seat expansion from ${prorationOldQty} to ${prorationNewQty} seats (${daysElapsed} days into cycle). Surcharge: $${amount.toFixed(2)}.`
    });

    showToast(`📄 Issued supplemental prorated invoice of +$${amount.toFixed(2)} for ${prorationCalculations.daysRemaining} remaining cycle days!`, 'success');
  };

  // ACTION: Issue Automatic Credit Note & Partial Refund (Contraction or Cancellation)
  const handleIssueCreditNote = () => {
    const refundAmt = Math.abs(prorationCalculations.adjustmentDelta);
    const noteId = `CN-2026-${String(creditNotes.length + 1).padStart(3, '0')}`;
    const newNote = {
      id: noteId,
      code: noteId,
      quoteCode: quote.code,
      customerName: customerName,
      amount: refundAmt,
      seatsReduced: Math.max(1, prorationOldQty - prorationNewQty),
      reason: `Mid-cycle subscription seat reduction from ${prorationOldQty} to ${prorationNewQty} seats (${daysElapsed} days elapsed). Automatic refund credit.`,
      issuedAt: new Date().toLocaleDateString()
    };

    setCreditNotes(prev => [newNote, ...prev]);

    addApprovalLog({
      quoteId: quote.id,
      user: currentUser?.name || 'Finance Officer',
      role: 'finance',
      action: `Credit Note Issued (${noteId})`,
      blendedRiskScore: 0,
      reason: `Issued automatic partial refund / credit note of $${refundAmt.toFixed(2)} for ${customerName}.`
    });

    showToast(`💰 Credit Note ${noteId} for $${refundAmt.toFixed(2)} generated and reconciled automatically!`, 'success');
  };

  const customerName = data.customers.find(c => c.id === quote.customerId)?.name || quote.customerName || 'ABC Company';

  return (
    <div className="space-y-6">
      
      {/* ================= TOP HEADER BANNER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#e2e2e2] p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-black" /> Hybrid Billing & Subscription Reconciliation
          </h2>
          <p className="text-xs text-[#5e5e5e] mt-1">
            Reconciles one-time hardware and professional service lines alongside recurring cloud subscription schedules on a unified contract.
          </p>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#e2e2e2] shadow-xs shrink-0">
          <span className="text-xs font-semibold text-[#5e5e5e] whitespace-nowrap shrink-0">Order Contract:</span>
          <select
            value={selectedQuoteId}
            onChange={(e) => {
              setSelectedQuoteId(e.target.value);
              setActiveQuoteId(e.target.value);
            }}
            className="select text-xs font-bold border-none bg-transparent py-0 px-1 focus:ring-0 cursor-pointer text-black w-auto"
          >
            {data.quotations.map(q => (
              <option key={q.id} value={q.id}>
                {q.code} • {data.customers.find(c => c.id === q.customerId)?.name || q.customerName || 'Client'} ({q.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= 3 FINANCIAL RECONCILIATION SUMMARY TILES ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Tile 1: One-Time Upfront Total */}
        <div className="card p-4 bg-white border border-[#e2e2e2] rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-[#5e5e5e]">
            <span className="text-xs font-bold uppercase tracking-wider">One-Time Hardware & Services</span>
            <Package className="w-4 h-4 text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-black font-mono">
              ${oneTimeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#5e5e5e] font-medium">Due Upfront</span>
          </div>
          <p className="text-xs text-[#5e5e5e]">
            Billed on Month 1 initial delivery invoice ({oneTimeLines.length} line items).
          </p>
        </div>

        {/* Tile 2: Recurring Subscription ARR / MRR */}
        <div className="card p-4 bg-white border border-[#e2e2e2] rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-[#5e5e5e]">
            <span className="text-xs font-bold uppercase tracking-wider">Recurring Cloud MRR</span>
            <RefreshCw className="w-4 h-4 text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-black font-mono">
              ${recurringMonthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#5e5e5e] font-medium">/ Month</span>
          </div>
          <p className="text-xs text-[#5e5e5e]">
            Contract ARR: ${(recurringMonthlyTotal * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / year.
          </p>
        </div>

        {/* Tile 3: Total First-Year Contract Value (TCV) */}
        <div className="card p-4 bg-black border border-black rounded-2xl shadow-xs space-y-1.5 text-white">
          <div className="flex items-center justify-between text-[#afafaf]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Contract Value (TCV)</span>
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              ${annualContractValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#afafaf] font-medium">Total Contract</span>
          </div>
          <p className="text-xs text-[#afafaf]">
            Unified billing schedule active across 12 scheduled invoices.
          </p>
        </div>

      </div>

      {/* ================= SECTION 1: SEPARATION OF ONE-TIME VS RECURRING ================= */}
      <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="border-b border-[#e2e2e2] pb-4">
          <h3 className="text-lg font-bold text-black flex items-center gap-2">
            <Layers className="w-5 h-5 text-black" />
            <span>Hybrid Order Breakdown: One-Time vs. Recurring Subscriptions</span>
          </h3>
          <p className="text-xs text-[#5e5e5e] mt-0.5">
            Separates non-recurring capital expenditures from recurring SaaS licenses on a single master order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Table A: One-Time Lines */}
          <div className="border border-[#e2e2e2] rounded-xl p-5 bg-[#fafafa] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-black" />
                <span>1. One-Time Product & Service Lines</span>
              </h4>
              <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-xs font-semibold">{oneTimeLines.length} Items</span>
            </div>

            {oneTimeLines.length === 0 ? (
              <p className="text-sm text-[#5e5e5e] py-6 text-center">No one-time products in this order.</p>
            ) : (
              <div className="space-y-2.5">
                {oneTimeLines.map(line => (
                  <div key={line.id} className="p-3 bg-white border border-[#e2e2e2] rounded-xl flex items-center justify-between text-sm shadow-2xs">
                    <div>
                      <div className="font-bold text-black">{line.product.name}</div>
                      <div className="text-xs text-[#5e5e5e] font-mono">
                        {line.product.sku} • Qty: {line.quantity} • Disc: {line.discountPct}%
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-black">
                      ${line.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-[#e2e2e2] flex items-center justify-between text-sm font-bold text-black">
                  <span>One-Time Subtotal:</span>
                  <span className="font-mono text-base font-bold text-black">${oneTimeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Table B: Recurring Subscription Lines (Strictly Monochromatic) */}
          <div className="border border-[#e2e2e2] rounded-xl p-5 bg-[#fafafa] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-black" />
                <span>2. Recurring Cloud Subscription Lines</span>
              </h4>
              <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-xs font-semibold">{recurringLines.length} Items</span>
            </div>

            {recurringLines.length === 0 ? (
              <p className="text-sm text-[#5e5e5e] py-6 text-center">No recurring subscriptions in this order.</p>
            ) : (
              <div className="space-y-2.5">
                {recurringLines.map(line => (
                  <div key={line.id} className="p-3 bg-white border border-[#e2e2e2] rounded-xl flex items-center justify-between text-sm shadow-2xs">
                    <div>
                      <div className="font-bold text-black">{line.product.name}</div>
                      <div className="text-xs text-[#5e5e5e] font-mono">
                        Billing: Monthly / Annual • Seats: {line.quantity} • Disc: {line.discountPct}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-black text-sm">
                        ${line.monthlyNetTotal.toFixed(2)} / mo
                      </div>
                      <div className="text-xs text-[#5e5e5e] font-mono">
                        (${line.annualNetTotal.toFixed(2)}/yr)
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-[#e2e2e2] flex items-center justify-between text-sm font-bold text-black">
                  <span>Recurring Monthly Subtotal:</span>
                  <span className="font-mono text-base font-bold text-black">${recurringMonthlyTotal.toFixed(2)} / month</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= SECTION 2: 12-MONTH BILLING SCHEDULE & PAYMENT RECORDING ================= */}
      <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="border-b border-[#e2e2e2] pb-4">
          <h3 className="text-lg font-bold text-black flex items-center gap-2">
            <Calendar className="w-5 h-5 text-black" />
            <span>Generated 12-Month Billing Schedule & Ledger</span>
          </h3>
          <p className="text-xs text-[#5e5e5e] mt-0.5">
            Live schedule of one-time and recurring payments with interactive payment confirmation.
          </p>
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto border border-[#e2e2e2] rounded-xl bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#e2e2e2] bg-[#efefef] text-black font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Invoice Code</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4 text-right">One-Time Upfront</th>
                <th className="py-3 px-4 text-right">Recurring SaaS</th>
                <th className="py-3 px-4 text-right">Total Invoice</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Action / Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e2e2]">
              {billingSchedule.map((inv) => {
                const isPaid = inv.status === 'Paid';

                return (
                  <tr key={inv.id} className={inv.monthNumber === 1 ? 'bg-[#fafafa] font-medium' : 'hover:bg-[#fafafa]'}>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {inv.invoiceCode}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-black">{inv.periodLabel}</div>
                      <div className="text-xs text-[#5e5e5e] font-mono">Cycle Month {inv.monthNumber} of 12</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-black">
                      {inv.oneTimeAmount > 0 
                        ? `$${inv.oneTimeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                        : <span className="text-[#5e5e5e] font-normal">$0.00</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-black">
                      ${inv.recurringAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-black text-base">
                      ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isPaid ? (
                        <span className="badge bg-black text-white text-xs font-bold py-1 px-3 flex items-center justify-center gap-1.5 mx-auto w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                        </span>
                      ) : (
                        <span className="badge bg-[#efefef] border border-black text-black text-xs font-semibold py-1 px-3 flex items-center justify-center gap-1.5 mx-auto w-fit">
                          <Clock className="w-3.5 h-3.5" /> {inv.status}
                        </span>
                      )}
                      {inv.paidAt && (
                        <span className="text-xs text-[#5e5e5e] block font-mono mt-1">{inv.paidAt}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isPaid ? (
                        <div className="text-xs font-mono text-[#5e5e5e]">
                          Ref: <span className="text-black font-bold">{inv.txnId || 'TXN-PAID'}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRecordPayment(inv)}
                          className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black text-white text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto shadow-xs cursor-pointer"
                          title="Record customer payment and mark invoice as Paid"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-white" />
                          <span>Record Payment</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SECTION 3: MID-CYCLE PRORATION & AUTOMATIC CREDIT NOTE ENGINE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Proration Calculator (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#e2e2e2] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-black" />
                  <span>Mid-Cycle Subscription Proration & Credit Note Engine</span>
                </h3>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  Simulate mid-billing-cycle seat modifications or cancellations with exact pro-rata mathematics and automatic credit note generation.
                </p>
              </div>
              <span className="badge bg-[#efefef] border border-black text-black text-xs font-mono font-bold">30-Day Cycle</span>
            </div>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#fafafa] p-5 rounded-xl border border-[#e2e2e2]">
              <div>
                <label className="label text-xs font-bold text-black">Original Seats / Qty</label>
                <input
                  type="number"
                  min="1"
                  value={prorationOldQty}
                  onChange={(e) => setProrationOldQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="input text-sm font-bold text-center w-full bg-white border-[#e2e2e2]"
                />
                <span className="text-xs text-[#5e5e5e] block mt-1">Starting active licenses</span>
              </div>

              <div>
                <label className="label text-xs font-bold text-black">New Modified Seats / Qty</label>
                <input
                  type="number"
                  min="0"
                  value={prorationNewQty}
                  onChange={(e) => setProrationNewQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="input text-sm font-bold text-center w-full bg-white border-[#e2e2e2]"
                />
                <span className="text-xs text-[#5e5e5e] block mt-1">Expanded or downsized licenses</span>
              </div>

              <div>
                <label className="label text-xs font-bold text-black">Days Elapsed (into Cycle)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={daysElapsed}
                  onChange={(e) => setDaysElapsed(Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="input text-sm font-bold text-center w-full bg-white border-[#e2e2e2]"
                />
                <span className="text-xs text-[#5e5e5e] block mt-1">
                  Remaining in cycle: <strong className="text-black">{prorationCalculations.daysRemaining} days</strong>
                </span>
              </div>
            </div>

            {/* Proration Calculation Ledger */}
            <div className="p-5 bg-[#fafafa] border border-[#e2e2e2] rounded-xl text-sm space-y-2.5">
              <div className="flex justify-between items-center text-[#5e5e5e]">
                <span>Original Monthly Invoice:</span>
                <strong className="font-mono text-black">${prorationCalculations.oldTotalMonth.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between items-center text-[#5e5e5e]">
                <span>Used Consumption ({daysElapsed} Days at {prorationOldQty} seats):</span>
                <strong className="font-mono text-black">${prorationCalculations.usedCost.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between items-center text-[#5e5e5e]">
                <span>New Consumption ({prorationCalculations.daysRemaining} Days at {prorationNewQty} seats):</span>
                <strong className="font-mono text-black">${prorationCalculations.remainingCost.toFixed(2)}</strong>
              </div>
              
              <div className="pt-3 border-t border-[#e2e2e2] flex justify-between items-center text-base font-bold">
                <span className="text-black">Adjusted Month Final Cost:</span>
                <span className="font-mono text-black">${prorationCalculations.adjustedMonthCost.toFixed(2)}</span>
              </div>

              {/* Action Banner: Expansion Surcharge vs Contraction Refund (Monochromatic) */}
              <div className="mt-4 p-4 rounded-xl border-2 border-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="font-bold text-black flex items-center gap-2">
                    {prorationCalculations.isExpansion ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-black" />
                        <span>Mid-Cycle Expansion Surcharge: +${prorationCalculations.adjustmentDelta.toFixed(2)}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-black" />
                        <span>Mid-Cycle Contraction Refund Credit: -${Math.abs(prorationCalculations.adjustmentDelta).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[#5e5e5e] mt-0.5">
                    {prorationCalculations.isExpansion 
                      ? 'Issue supplemental invoice for additional license capacity.'
                      : 'Trigger automatic credit note to refund unused subscription days.'}
                  </p>
                </div>

                {prorationCalculations.isExpansion ? (
                  <button
                    type="button"
                    onClick={handleIssueProratedInvoice}
                    className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black text-white text-xs py-2 px-4 flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-white" />
                    <span>Issue Surcharge Invoice</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleIssueCreditNote}
                    className="btn btn-sm btn-primary bg-black hover:bg-[#282828] border-black text-white text-xs py-2 px-4 flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-white" />
                    <span>Trigger Credit Note</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Credit Notes Ledger & Subscription Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Credit Notes Generated */}
          <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-3">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-black" />
                <span>Issued Credit Notes ({creditNotes.length})</span>
              </h4>
              <span className="badge bg-[#efefef] border border-[#e2e2e2] text-black text-xs">Reconciled</span>
            </div>

            {creditNotes.length === 0 ? (
              <p className="text-sm text-[#5e5e5e] py-6 text-center">
                No credit notes or refunds issued yet. Reduce seats in the proration tool to generate a refund credit.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {creditNotes.map(cn => (
                  <div key={cn.id} className="p-3 bg-white border border-[#e2e2e2] rounded-xl space-y-1.5 text-sm shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black font-mono">{cn.code}</span>
                      <span className="font-bold text-black font-mono">
                        -${cn.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-[#5e5e5e] leading-tight">{cn.reason}</p>
                    <div className="text-xs text-[#5e5e5e] flex items-center justify-between pt-1.5 border-t border-[#e2e2e2]">
                      <span>Customer: {cn.customerName}</span>
                      <span>{cn.issuedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscription Management Card */}
          <div className="card bg-white border border-[#e2e2e2] rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2 border-b border-[#e2e2e2] pb-3">
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>Subscription Lifecycle Policy</span>
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#5e5e5e]">Subscription Status:</span>
                <span className="badge bg-black text-white text-xs font-bold">Active (Auto-Renewing)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e5e5e]">Proration Policy:</span>
                <strong className="text-black">Daily Exact Proration</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e5e5e]">Billing Cycle:</span>
                <strong className="text-black">1st of Each Month</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e2e2e2] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setProrationNewQty(0);
                  showToast('Canceled subscription simulation loaded into proration engine.', 'info');
                }}
                className="btn btn-sm btn-outline text-black border-black hover:bg-[#efefef] text-xs py-2 w-full flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-black" />
                <span>Cancel Subscription (Full Refund)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
