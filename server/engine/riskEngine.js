/**
 * DealFlow360 - Server-Side Blended Discount Risk Score Engine
 */

export function calculateQuotationMetricsServer(quotation, customers, products, rules) {
  const customer = customers.find(c => c.id === quotation.customerId) || customers[0];
  const tier = customer ? customer.tier : 'Bronze';

  let totalListAmount = 0;
  let totalNetRevenue = 0;
  let totalCost = 0;
  let lineRiskSum = 0;
  let maxSingleLineOverage = 0;
  const lineDetails = [];

  quotation.lines.forEach(line => {
    const product = products.find(p => p.id === line.productId);
    if (!product) return;

    const listUnitPrice = line.unitPrice || product.listPrice;
    const qty = line.quantity || 1;
    const discountPct = line.discountPct || 0;
    const costPrice = product.costPrice || (listUnitPrice * 0.6);

    const lineListTotal = listUnitPrice * qty;
    const lineNetUnitPrice = listUnitPrice * (1 - discountPct / 100);
    const lineNetTotal = lineNetUnitPrice * qty;
    const lineTotalCost = costPrice * qty;
    const lineMarginAmount = lineNetTotal - lineTotalCost;
    const lineMarginPct = lineNetTotal > 0 ? (lineMarginAmount / lineNetTotal) * 100 : 0;

    // Allowed Discount Ceiling Logic
    const categoryCeilings = rules.categoryCeilings[product.category] || rules.categoryCeilings['Hardware'];
    const allowedDiscountPct = categoryCeilings[tier] !== undefined 
      ? categoryCeilings[tier] 
      : (rules.globalTierCeilings[tier] || 5);

    const overagePct = Math.max(0, discountPct - allowedDiscountPct);
    if (overagePct > maxSingleLineOverage) {
      maxSingleLineOverage = overagePct;
    }

    const lineRiskPoints = overagePct * lineNetTotal;
    lineRiskSum += lineRiskPoints;

    totalListAmount += lineListTotal;
    totalNetRevenue += lineNetTotal;
    totalCost += lineTotalCost;

    lineDetails.push({
      lineId: line.id,
      product,
      quantity: qty,
      unitPrice: listUnitPrice,
      discountPct,
      allowedDiscountPct,
      overagePct,
      lineListTotal,
      lineNetTotal,
      lineTotalCost,
      lineMarginAmount,
      lineMarginPct,
      hasViolation: overagePct > 0
    });
  });

  const totalDiscountAmount = totalListAmount - totalNetRevenue;
  const overallDiscountPct = totalListAmount > 0 ? (totalDiscountAmount / totalListAmount) * 100 : 0;
  const overallGrossMarginAmount = totalNetRevenue - totalCost;
  const overallGrossMarginPct = totalNetRevenue > 0 ? (overallGrossMarginAmount / totalNetRevenue) * 100 : 0;

  const blendedRiskScore = totalNetRevenue > 0 
    ? parseFloat(((lineRiskSum / totalNetRevenue) * 10 + (maxSingleLineOverage * 0.5)).toFixed(1))
    : 0;

  let requiresApproval = false;
  let requiredApprovalLevel = 'None';
  let approvalReason = 'Discount within tier & category limits.';

  if (blendedRiskScore > 0 || maxSingleLineOverage > 0) {
    requiresApproval = true;
    if (blendedRiskScore >= rules.thresholds.financeApprovalRiskScore || overallGrossMarginPct < 10) {
      requiredApprovalLevel = 'Sales Manager + Finance';
      approvalReason = `High-Risk Overage (Risk Score: ${blendedRiskScore}, Margin: ${overallGrossMarginPct.toFixed(1)}%). Dual approval required.`;
    } else {
      requiredApprovalLevel = 'Sales Manager';
      approvalReason = `Discount Overage (Risk Score: ${blendedRiskScore}). Sales Manager approval required.`;
    }
  }

  return {
    customer,
    tier,
    totalListAmount,
    totalNetRevenue,
    totalCost,
    totalDiscountAmount,
    overallDiscountPct,
    overallGrossMarginAmount,
    overallGrossMarginPct,
    blendedRiskScore,
    maxSingleLineOverage,
    requiresApproval,
    requiredApprovalLevel,
    approvalReason,
    lineDetails
  };
}
