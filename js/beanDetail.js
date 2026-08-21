(function(SL){
'use strict';
const { state, persist, uid, ratioOf, todayISO, roastColor, escapeHtml, fmtDate, money } = SL;

let currentBeanId = null;
let showingForm = false;

function dialinsForBean(bean){
  return state.dialins.filter(x => x.beanId ? x.beanId===bean.id : x.bean===bean.bean);
}

function openBeanDetail(beanId){
  currentBeanId = beanId;
  showingForm = false;
  renderBeanDetail();
}

function renderBeanDetail(){
  const bean = state.beans.find(b=>b.id===currentBeanId);
  if(!bean) return;
  const body = showingForm ? dialinFormHtml() : beanDetailListHtml(bean);
  // stopBeanBag as the close hook: covers a real close, switching to
  // the add-shot form, and returning from it — mountBeanBag() below
  // handles re-mounting fresh whenever the list view itself redraws.
  SL.openSheet(bean.bean, body, SL.stopBeanBag);

  if(showingForm){
    wireDialinForm(bean);
  } else {
    wireBeanDetailList(bean);
    SL.mountBeanBag(document.getElementById('bag3d-wrap'), bean.bean);
  }
}

function beanDetailListHtml(bean){
  const entries = dialinsForBean(bean).sort((a,b)=> (b.date||'').localeCompare(a.date||''));

  return `
    <div class="bag3d-wrap" id="bag3d-wrap"></div>
    <div class="machine-meta-row" style="margin:0 0 12px;">
      <div class="machine-meta"><span class="v">${bean.roastLevel?`<span class="roast-dot" style="background:${roastColor(bean.roastLevel)}"></span>`:''}${bean.roastLevel||'—'}</span><span class="l">Roast</span></div>
      <div class="machine-meta"><span class="v">${bean.weightOz? bean.weightOz+' oz':'—'}</span><span class="l">Weight</span></div>
      <div class="machine-meta"><span class="v">${money(parseFloat(bean.price)||0)}</span><span class="l">Per bag</span></div>
    </div>
    ${qtyStepperHtml(bean)}
    <div class="sheet-actions-row">
      <button class="btn" id="bd-add-shot-btn">+ Log a shot</button>
    </div>
    ${entries.length===0
      ? `<div class="empty"><b>No shots logged yet</b>Pull one with this bean, then log it here.</div>`
      : `<div class="ticket-list" id="bd-ticket-list">${entries.map(ticketHtml).join('')}</div>`
    }
  `;
}

function qtyStepperHtml(bean){
  const qty = bean.qty ?? 1;
  return `
    <div class="bd-qty-row" id="bd-qty-row">
      <div class="bd-qty-stepper">
        <button class="bd-qty-btn" id="bd-qty-minus" aria-label="Decrease quantity" ${qty<=0?'disabled':''}>−</button>
        <span class="bd-qty-value" id="bd-qty-value">${qty}</span>
        <button class="bd-qty-btn" id="bd-qty-plus" aria-label="Increase quantity">+</button>
        <span class="bd-qty-label" id="bd-qty-label">bag${qty===1?'':'s'} in stock</span>
      </div>
      <div class="bd-qty-total" id="bd-qty-total">${money((parseFloat(bean.price)||0) * qty)} total</div>
    </div>
  `;
}

function adjustBeanQty(bean, delta){
  bean.qty = Math.max(0, (bean.qty ?? 1) + delta);
  persist('beans', state.beans);

  const qtyEl = document.getElementById('bd-qty-value');
  if(qtyEl) qtyEl.textContent = bean.qty;
  const labelEl = document.getElementById('bd-qty-label');
  if(labelEl) labelEl.textContent = `bag${bean.qty===1?'':'s'} in stock`;
  const totalEl = document.getElementById('bd-qty-total');
  if(totalEl) totalEl.textContent = `${money((parseFloat(bean.price)||0) * bean.qty)} total`;
  const minusBtn = document.getElementById('bd-qty-minus');
  if(minusBtn) minusBtn.disabled = bean.qty <= 0;

  SL.refreshBeanCard(bean.id);
}

function wireBeanDetailList(bean){
  document.getElementById('bd-qty-minus').addEventListener('click', ()=> adjustBeanQty(bean, -1));
  document.getElementById('bd-qty-plus').addEventListener('click', ()=> adjustBeanQty(bean, 1));

  document.getElementById('bd-add-shot-btn').addEventListener('click', ()=>{
    showingForm = true;
    renderBeanDetail();
  });
  const list = document.getElementById('bd-ticket-list');
  if(!list) return;
  list.addEventListener('click', e=>{
    const starBtn = e.target.closest('[data-star]');
    if(starBtn){ toggleStar(starBtn.dataset.star); return; }
    const delBtn = e.target.closest('[data-del-dialin]');
    if(delBtn){ deleteDialin(delBtn.dataset.delDialin); return; }
  });
}

function dialinFormHtml(){
  return `
    <div class="form-grid">
      <div class="field"><label>Date</label><input type="date" id="di-date" value="${todayISO()}"></div>
      <div class="field"><label>Roast level</label>
        <select id="di-roast"><option value="">—</option><option>Light</option><option>Medium</option><option>Medium-Dark</option><option>Dark</option></select>
      </div>
      <div class="field wide"><label>Flavor profile</label><input id="di-flavor" placeholder="e.g. caramel, nutty, round"></div>
      <div class="field"><label>Grind size</label><input id="di-grind" placeholder="e.g. 9"></div>
      <div class="field"><label>Burr setting</label><input id="di-burr" placeholder="e.g. 3"></div>
      <div class="field"><label>Dose in (g)</label><input type="number" step="0.1" id="di-dose" value="18"></div>
      <div class="field"><label>Yield out (g)</label><input type="number" step="0.1" id="di-yield"></div>
      <div class="field"><label>Extraction time (s)</label><input type="number" id="di-time"></div>
      <div class="field wide"><label>Taste notes</label><textarea id="di-notes" placeholder="What did it taste like? What would you change next time?"></textarea></div>
    </div>
    <div class="form-actions">
      <button class="btn ghost" id="di-cancel">Back</button>
      <button class="btn" id="di-save">Save shot</button>
    </div>
  `;
}

function wireDialinForm(bean){
  document.getElementById('di-cancel').addEventListener('click', ()=>{
    showingForm = false;
    renderBeanDetail();
  });
  document.getElementById('di-save').addEventListener('click', ()=>{
    const entry = {
      id: uid(),
      date: document.getElementById('di-date').value || todayISO(),
      beanId: bean.id,
      bean: bean.bean,
      roast: document.getElementById('di-roast').value,
      flavor: document.getElementById('di-flavor').value.trim(),
      grind: document.getElementById('di-grind').value.trim(),
      burr: document.getElementById('di-burr').value.trim(),
      dose: document.getElementById('di-dose').value,
      yield: document.getElementById('di-yield').value,
      time: document.getElementById('di-time').value,
      notes: document.getElementById('di-notes').value.trim(),
      best: false,
    };
    state.dialins.unshift(entry);
    persist('dialins', state.dialins);
    SL.updateHeaderStats();
    SL.refreshBeanCard(bean.id);
    showingForm = false;
    renderBeanDetail();
  });
}

function toggleStar(id){
  const item = state.dialins.find(x=>x.id===id);
  if(!item) return;
  item.best = !item.best;
  persist('dialins', state.dialins);

  const btn = document.querySelector(`[data-star="${id}"]`);
  const card = btn && btn.closest('.ticket');
  if(card) card.outerHTML = ticketHtml(item);
  SL.updateHeaderStats();
}

function deleteDialin(id){
  if(!state.dialins.some(x=>x.id===id)) return;
  state.dialins = state.dialins.filter(x=>x.id!==id);
  persist('dialins', state.dialins);

  const btn = document.querySelector(`[data-del-dialin="${id}"]`);
  const card = btn && btn.closest('.ticket');
  if(card) card.remove();

  SL.updateHeaderStats();
  SL.refreshBeanCard(currentBeanId);

  const bean = state.beans.find(b=>b.id===currentBeanId);
  if(bean && dialinsForBean(bean).length===0) renderBeanDetail();
}

function ticketHtml(x){
  return `
    <div class="ticket" data-date="${x.date||''}">
      <div class="ticket-head">
        <div>
          <div class="bean">${escapeHtml(x.bean||'Unnamed bean')}</div>
          ${x.flavor ? `<div class="flavor">${escapeHtml(x.flavor)}</div>` : ''}
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <div class="date">${fmtDate(x.date)}</div>
          <button class="ticket-star ${x.best?'on':''}" data-star="${x.id}" title="Mark as a keeper">${x.best?'★':'☆'}</button>
        </div>
      </div>
      <div class="ticket-readout">
        <div class="ro"><div class="v">${x.grind||'—'}</div><div class="l">Grind</div></div>
        <div class="ro"><div class="v">${x.dose||'—'}g</div><div class="l">Dose</div></div>
        <div class="ro"><div class="v">${x.yield||'—'}g</div><div class="l">Yield</div></div>
        <div class="ro"><div class="v">${x.time||'—'}s</div><div class="l">Time</div></div>
        <div class="ro ratio"><div class="v">${ratioOf(x.dose,x.yield)}</div><div class="l">Ratio</div></div>
      </div>
      <div class="ticket-notes">
        ${x.best ? `<span class="tag">Keeper settings</span><br>` : ''}
        ${escapeHtml(x.notes) || '<span style="color:var(--paper-muted)">No taste notes</span>'}
      </div>
      <div class="ticket-foot">
        <div class="meta">${x.roast ? `<span class="roast-dot" style="background:${roastColor(x.roast)}"></span>`+escapeHtml(x.roast)+' roast' : '&nbsp;'}</div>
        <div class="row-actions"><button class="icon-btn danger" data-del-dialin="${x.id}">delete</button></div>
      </div>
    </div>
  `;
}

SL.openBeanDetail = openBeanDetail;

})(window.ShotLog = window.ShotLog || {});
