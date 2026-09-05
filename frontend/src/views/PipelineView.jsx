import React from 'react';
import { useApp } from '../context/AppContext';
import { Kanban, FileText, ArrowRight, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const PipelineView = () => {
  const { data, setActiveQuoteId, setView } = useApp();

  const stages = [
    { id: 'Draft', title: 'Draft Quotations', color: 'border-slate-300 bg-slate-50' },
    { id: 'Pending Approval', title: 'Pending Approval', color: 'border-amber-300 bg-amber-50/50' },
    { id: 'Approved', title: 'Approved & Ready', color: 'border-emerald-300 bg-emerald-50/50' },
    { id: 'Fulfilled', title: 'Fulfilled & Active', color: 'border-blue-300 bg-blue-50/50' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream border border-warm p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Kanban className="w-6 h-6 text-charcoal" /> B2) Quotation List & Pipeline Kanban View
          </h2>
          <p className="text-xs text-muted">Selectable deal cards categorized by lifecycle stage. Click any card to launch the Quote Builder.</p>
        </div>

        <span className="badge badge-neutral text-xs px-3 py-1 font-mono font-bold">
          {data.quotations.length} Active Deals
        </span>
      </div>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map(stage => {
          const stageQuotes = data.quotations.filter(q => q.status === stage.id);
          return (
            <div key={stage.id} className={`p-4 border rounded-xl space-y-3 ${stage.color} min-h-[500px]`}>
              <div className="flex items-center justify-between border-b border-warm/60 pb-2">
                <h3 className="font-bold text-sm text-charcoal flex items-center gap-1.5">
                  {stage.id === 'Pending Approval' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {stage.id === 'Approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {stage.title}
                </h3>
                <span className="badge badge-neutral text-[10px] font-mono">{stageQuotes.length}</span>
              </div>

              <div className="space-y-3">
                {stageQuotes.length === 0 ? (
                  <div className="text-xs text-muted py-8 text-center border border-dashed border-warm/80 rounded-lg">
                    No deals in {stage.id} stage
                  </div>
                ) : stageQuotes.map(q => {
                  const customer = data.customers.find(c => c.id === q.customerId);
                  const totalNet = q.lines.reduce((acc, l) => acc + (l.unitPrice * (1 - (l.discountPct || 0)/100) * l.quantity), 0);

                  return (
                    <div 
                      key={q.id}
                      onClick={() => {
                        setActiveQuoteId(q.id);
                        setView('builder');
                      }}
                      className="p-3.5 bg-cream border border-warm rounded-lg shadow-xs hover:border-interactive hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-charcoal">{q.code}</span>
                        <span className="badge badge-neutral text-[10px]">{customer?.tier || 'Bronze'}</span>
                      </div>

                      <h4 className="font-bold text-sm text-charcoal group-hover:text-amber-900 transition-colors">
                        {customer?.name || q.customerId}
                      </h4>

                      <div className="flex items-center justify-between text-xs text-muted pt-1 border-t border-warm/40">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-600" /> Rep: {q.repName || 'Rahul'}
                        </span>
                        <span className="font-bold text-charcoal font-mono">${totalNet.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-interactive font-medium pt-1">
                        <span>{q.lines.length} Line Items</span>
                        <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                          Open Builder <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
