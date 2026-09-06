import React from 'react';
import { useApp } from '../context/AppContext';
import { Kanban, FileText, ArrowRight, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const PipelineView = () => {
  const { data, setActiveQuoteId, setView } = useApp();

  const stages = [
    { id: 'Draft', title: 'Draft Quotations', border: 'border-[#e2e2e2]' },
    { id: 'Pending Approval', title: 'Pending Approval', border: 'border-black' },
    { id: 'Approved', title: 'Approved & Ready', border: 'border-[#e2e2e2]' },
    { id: 'Fulfilled', title: 'Fulfilled & Active', border: 'border-[#e2e2e2]' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#e2e2e2] p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2.5">
            <Kanban className="w-7 h-7 text-black" /> Quotation List & Pipeline Kanban View
          </h2>
          <p className="text-sm text-[#5e5e5e] mt-1">Selectable deal cards categorized by lifecycle stage. Click any card to launch the Quote Builder.</p>
        </div>

        <span className="badge bg-black text-white text-xs px-3.5 py-1.5 font-mono font-bold rounded-full shadow-xs">
          {data.quotations.length} Active Deals
        </span>
      </div>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map(stage => {
          const stageQuotes = data.quotations.filter(q => q.status === stage.id);
          return (
            <div key={stage.id} className={`p-4 border rounded-2xl space-y-3 bg-[#fafafa] ${stage.border} min-h-[500px] shadow-2xs`}>
              <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-2.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
                  {stage.id === 'Pending Approval' && <AlertTriangle className="w-3.5 h-3.5 text-black" />}
                  {stage.id === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  {stage.title}
                </h3>
                <span className="badge bg-white border border-[#e2e2e2] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">{stageQuotes.length}</span>
              </div>

              <div className="space-y-3">
                {stageQuotes.length === 0 ? (
                  <div className="text-xs text-[#5e5e5e] py-8 text-center border border-dashed border-[#e2e2e2] rounded-xl">
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
                      className="p-4 bg-white border border-[#e2e2e2] rounded-xl shadow-2xs hover:border-black hover:shadow-xs transition-all cursor-pointer space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-black">{q.code}</span>
                        <span className="badge bg-[#efefef] text-black border border-[#e2e2e2] text-[10px] px-2 py-0.5 rounded-full font-semibold">{customer?.tier || 'Bronze'}</span>
                      </div>

                      <h4 className="font-bold text-sm text-black group-hover:text-black transition-colors">
                        {customer?.name || q.customerId}
                      </h4>

                      <div className="flex items-center justify-between text-xs text-[#5e5e5e] pt-1.5 border-t border-[#e2e2e2]">
                        <span>{q.lines.length} Line Item{q.lines.length !== 1 ? 's' : ''}</span>
                        <span className="font-bold text-black font-mono">${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-black font-semibold pt-1">
                        <span className="text-[#5e5e5e]">Status: {q.status}</span>
                        <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                          Open Builder <ArrowRight className="w-3 h-3 text-black" />
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
