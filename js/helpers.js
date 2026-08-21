(function(SL){
'use strict';

const uid = () => Math.random().toString(36).slice(2,9);

const money = n => (n===''||n===null||n===undefined||isNaN(n)) ? '—' : '$'+Number(n).toFixed(2);

const fmtDate = s => {
  if(!s) return '—';
  const d = new Date(s+'T00:00:00');
  if(isNaN(d)) return s;
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
};

const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

function ratioOf(dose, yld){
  const d = num(dose), y = num(yld);
  if(!d || !y) return '—';
  return '1 : ' + (y/d).toFixed(2).replace(/\.?0+$/,'');
}

function todayISO(){ return new Date().toISOString().slice(0,10); }

function roastColor(roast){
  const r = (roast||'').toLowerCase();
  if(r.startsWith('light')) return 'var(--yellow)';
  if(r.startsWith('medium-dark')) return 'var(--blue)';
  if(r.startsWith('medium')) return 'var(--accent)';
  if(r.startsWith('dark')) return 'var(--ink)';
  return 'var(--paper-muted)';
}

function escapeHtml(s){
  if(s===undefined||s===null) return '';
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function escapeAttr(s){ return escapeHtml(s); }

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

SL.uid = uid;
SL.money = money;
SL.fmtDate = fmtDate;
SL.num = num;
SL.ratioOf = ratioOf;
SL.todayISO = todayISO;
SL.roastColor = roastColor;
SL.escapeHtml = escapeHtml;
SL.escapeAttr = escapeAttr;
SL.prefersReducedMotion = prefersReducedMotion;

})(window.ShotLog = window.ShotLog || {});
