
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setCheckoutStep, updateCustomer, updatePaymentStatus, setOrderId, resetCheckout, addLedgerEntry } from '../store';
import ChaosControl from './ChaosControl';
import { ChaosConfig, LedgerSeverity, LedgerEventType } from '../types';

const CheckoutSimulation: React.FC = () => {
  const dispatch = useDispatch();
  const checkout = useSelector((state: RootState) => state.checkout);
  const { isExecuting } = useSelector((state: RootState) => state.ui);

  const [chaos, setChaos] = useState<ChaosConfig>({
    latencyFactor: 1,
    failureRate: 0.1,
    integrityBreach: false
  });
  
  const [localProcessing, setLocalProcessing] = useState(false);
  const ledgerEndRef = useRef<HTMLDivElement>(null);

  const commitLedger = (description: string, severity: LedgerSeverity = 'INFO') => {
    let eventType: LedgerEventType = 'CONTEXT_SHIFT';
    if (severity === 'SUCCESS') eventType = 'PHASE_COMMIT';
    else if (severity === 'CRITICAL') eventType = 'PHASE_BREACH';
    else if (severity === 'WARN') eventType = 'AI_RETRY';

    dispatch(addLedgerEntry({
      id: crypto.randomUUID(),
      timestampISO: new Date().toISOString(),
      description,
      severity,
      eventType,
      correlationId: 'sim-checkout-session'
    }));
  };

  const subtotal = checkout.cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.20;
  const discount = subtotal > 100 ? 10 : 0;
  const total = subtotal + tax - discount;

  const handleNext = async () => {
    if (checkout.step === 2) {
      if (!checkout.customer.name || !checkout.customer.email) {
        commitLedger("VAL_FAIL: Customer data incomplete", "CRITICAL");
        return;
      }
      await validateInventory();
    } else if (checkout.step === 3) {
      processPayment();
    } else {
      dispatch(setCheckoutStep(checkout.step + 1));
      commitLedger(`USER_NAV: Transitioned to Step ${checkout.step + 1}`, 'SUCCESS');
    }
  };

  const validateInventory = async () => {
    setLocalProcessing(true);
    commitLedger("RPC_CALL: GET /api/v1/inventory/batch", 'INFO');
    
    await new Promise(r => setTimeout(r, 1200 * chaos.latencyFactor));
    
    const inventoryAvailable = Math.random() > chaos.failureRate;
    
    if (inventoryAvailable) {
      commitLedger("RPC_RES: Inventory verified [200 OK]", 'SUCCESS');
      dispatch(setCheckoutStep(3));
    } else {
      commitLedger("RPC_ERR: Inventory unavailable [503]", 'CRITICAL');
    }
    setLocalProcessing(false);
  };

  const processPayment = async () => {
    setLocalProcessing(true);
    dispatch(updatePaymentStatus('processing'));
    commitLedger("RPC_CALL: POST /api/v1/payments", 'INFO');
    
    await new Promise(r => setTimeout(r, 1800 * chaos.latencyFactor));
    
    const success = !chaos.integrityBreach && (Math.random() > chaos.failureRate);
    
    if (success) {
      const orderId = crypto.randomUUID();
      dispatch(updatePaymentStatus('success'));
      dispatch(setOrderId(orderId));
      dispatch(setCheckoutStep(4));
      commitLedger(`PAYMENT_SUCCESS: Order ${orderId.slice(0, 8)} created`, 'SUCCESS');
    } else {
      dispatch(updatePaymentStatus('failed'));
      commitLedger(`PAYMENT_FAILURE: Transaction rejected`, 'CRITICAL');
    }
    setLocalProcessing(false);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row gap-8 architect-void">
      <div className="w-full lg:w-72 space-y-6">
        <ChaosControl config={chaos} onChange={setChaos} />
        
        <div className="p-6 bg-black border border-[#111] rounded-sm">
          <h4 className="text-[9px] font-black text-[#444] uppercase tracking-[0.2em] mb-4">Instance Snapshot</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#444]">Step:</span>
              <span className="text-[#00ff41]">0{checkout.step}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#444]">Payment:</span>
              <span className={checkout.payment.status === 'success' ? 'text-[#00ff41]' : 'text-[#444]'}>
                {checkout.payment.status.toUpperCase()}
              </span>
            </div>
          </div>
          <button 
            onClick={() => dispatch(resetCheckout())}
            className="w-full mt-6 py-2 bg-transparent border border-[#111] text-[9px] font-black uppercase tracking-widest text-[#333] hover:text-white transition-all"
          >
            Reset State
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between px-4 bg-[#050505] py-4 border border-[#111]">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border ${
                checkout.step === s ? 'bg-[#00ff41] text-black border-[#00ff41]' : 
                checkout.step > s ? 'text-[#00ff41] border-[#00ff41]' : 'text-[#222] border-[#111]'
              }`}>
                0{s}
              </div>
              {s < 4 && <div className={`w-12 h-px ${checkout.step > s ? 'bg-[#00ff41]' : 'bg-[#111]'}`} />}
            </div>
          ))}
        </div>

        <div className="flex-1 bg-black border border-[#111] p-10 relative overflow-y-auto min-h-[400px]">
          {checkout.step === 1 && (
            <div className="space-y-8 animate-entry">
              <div className="flex justify-between items-end border-b border-[#111] pb-4">
                <h4 className="text-lg font-black text-white uppercase tracking-tighter">Artifact Review</h4>
                <span className="text-[10px] font-mono text-[#444]">Buffer: {checkout.cart.length} entries</span>
              </div>
              <div className="space-y-4">
                {checkout.cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-5 bg-[#050505] border border-[#111]">
                    <div>
                      <p className="font-bold text-white text-sm">{item.name}</p>
                      <p className="text-[9px] font-mono text-[#333]">ID: {item.id}</p>
                    </div>
                    <span className="font-mono text-[#00ff41] text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-[#111] space-y-3 font-mono">
                <div className="flex justify-between text-[11px] text-[#444]"><span>SUBTOTAL</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-[11px] text-[#444]"><span>TAX_LEVY (20%)</span><span>${tax.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-[11px] text-[#00ff41]"><span>ARCHITECT_DISCOUNT</span><span>-${discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xl font-black pt-4 text-white border-t border-[#111]"><span>TOTAL</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
          )}

          {checkout.step === 2 && (
            <div className="space-y-10 animate-entry">
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">Entity Identification</h4>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#444] uppercase tracking-widest ml-1">Canonical Name</label>
                    <input className="w-full bg-[#050505] border border-[#111] p-4 text-sm focus:border-[#00ff41] outline-none text-white font-mono" placeholder="JOHN_DOE" value={checkout.customer.name} onChange={(e) => dispatch(updateCustomer({name: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#444] uppercase tracking-widest ml-1">Communication Link</label>
                    <input className="w-full bg-[#050505] border border-[#111] p-4 text-sm focus:border-[#00ff41] outline-none text-white font-mono" placeholder="ops@slavko.int" value={checkout.customer.email} onChange={(e) => dispatch(updateCustomer({email: e.target.value}))} />
                  </div>
                </div>
              </div>
              {localProcessing && (
                <div className="p-4 bg-[#00ff41]/5 border border-[#00ff41]/20 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-[#00ff41] font-black uppercase tracking-widest">Topology_Verify_Cycle...</span>
                </div>
              )}
            </div>
          )}

          {checkout.step === 3 && (
            <div className="space-y-10 text-center py-12 animate-entry">
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">Commit Handshake</h4>
              <div className="relative mx-auto w-32 h-32 bg-[#050505] border border-[#111] flex items-center justify-center text-[#00ff41]">
                <div className="absolute inset-0 bg-[#00ff41]/5 animate-pulse" />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              {checkout.payment.status === 'failed' && (
                <div className="p-4 bg-red-900/10 border border-red-900/30 text-red-500 text-[10px] font-black uppercase tracking-widest">
                  AUTHORIZATION_BREACH: TRANSACTION_TERMINATED
                </div>
              )}
              {checkout.payment.status === 'processing' && (
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-[#00ff41] font-black uppercase tracking-widest">Syncing_Financial_Ledger...</span>
                 </div>
              )}
            </div>
          )}

          {checkout.step === 4 && (
            <div className="space-y-10 text-center py-12 animate-entry">
              <div className="mx-auto w-32 h-32 bg-[#00ff41]/5 border border-[#00ff41]/20 flex items-center justify-center text-[#00ff41] shadow-[0_0_30px_rgba(0,255,65,0.1)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Simulation Success</h4>
                <p className="text-[#444] text-xs mt-2 uppercase tracking-widest">Architecture integrity confirmed by SlavkoKernel.</p>
              </div>
              <div className="bg-[#050505] border border-[#111] p-6 max-w-md mx-auto text-left font-mono">
                <div className="text-[9px] text-[#333] uppercase mb-4 tracking-widest font-black">ORDER_IDENTIFIER</div>
                <div className="text-sm text-[#00ff41] break-all select-all">{checkout.orderId}</div>
              </div>
              <button 
                onClick={() => dispatch(resetCheckout())}
                className="px-10 py-4 bg-transparent border border-[#111] text-[#333] hover:text-white text-[10px] font-black uppercase tracking-[0.4em] transition-all"
              >
                Start New Cycle
              </button>
            </div>
          )}

          {checkout.step < 4 && (
            <button 
              disabled={localProcessing}
              onClick={handleNext}
              className="absolute bottom-10 right-10 px-12 py-5 bg-[#00ff41] text-black font-black uppercase tracking-[0.3em] text-[11px] hover:brightness-110 transition-all disabled:opacity-20"
            >
              Commit Phase 0{checkout.step}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSimulation;
