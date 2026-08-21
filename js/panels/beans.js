(function(SL){
'use strict';
const { state, persist, uid, money, fmtDate, todayISO, roastColor, escapeHtml } = SL;

function renderBeans(){
  const panel = document.getElementById('panel-beans');
  panel.innerHTML = `
    <div class="section-top">
      <h2>Beans</h2>
      <div class="stat-strip"><div><b id="bean-total-stat">${money(computeBeanTotal())}</b>total spent</div></div>
      <button class="btn" id="add-bean-btn">+ Log a purchase</button>
    </div>

    <div id="bean-list-wrap"></div>
  `;

  document.getElementById('add-bean-btn').addEventListener('click', openBeanSheet);

  renderBeanCards();
}

function beanFormHtml(){
  return `
    <div class="form-grid">
      <div class="field"><label>Purchase date</label><input type="date" id="bn-date" value="${todayISO()}"></div>
      <div class="field wide"><label>Coffee bean</label><input id="bn-name" placeholder="Roaster & bean name"></div>
      <div class="field"><label>Roast level</label>
        <select id="bn-roast"><option value="">—</option><option>Light</option><option>Medium</option><option>Medium-Dark</option><option>Dark</option></select>
      </div>
      <div class="field"><label>Roast date</label><input type="date" id="bn-roastdate"></div>
      <div class="field"><label>Weight (oz)</label><input type="number" step="0.1" id="bn-weight"></div>
      <div class="field"><label>Quantity</label><input type="number" step="1" min="1" id="bn-qty" value="1"></div>
      <div class="field"><label>Price per bag</label><input type="number" step="0.01" id="bn-price"></div>
    </div>
    <p style="font-size:11.5px;color:var(--text-muted);margin:-4px 0 14px;">Already have this bean? Log it again with the same name and the quantity just adds on — no duplicate row.</p>
    <div class="form-actions">
      <button class="btn ghost" id="bean-cancel">Cancel</button>
      <button class="btn" id="bean-save">Save purchase</button>
    </div>
  `;
}

function openBeanSheet(){
  SL.openSheet('Log a purchase', beanFormHtml());
  document.getElementById('bean-cancel').addEventListener('click', SL.closeSheet);
  document.getElementById('bean-save').addEventListener('click', ()=>{
    const name = document.getElementById('bn-name').value.trim();
    if(!name){ document.getElementById('bn-name').focus(); return; }
    const draft = {
      purchaseDate: document.getElementById('bn-date').value || todayISO(),
      bean: name,
      roastLevel: document.getElementById('bn-roast').value,
      roastDate: document.getElementById('bn-roastdate').value,
      weightOz: document.getElementById('bn-weight').value,
      price: document.getElementById('bn-price').value,
      qty: Math.max(1, parseInt(document.getElementById('bn-qty').value, 10) || 1),
    };
    addOrRestockBean(draft);
    SL.closeSheet();
  });
}

function computeBeanTotal(){
  return state.beans.reduce((s,b)=> s + (parseFloat(b.price)||0) * (b.qty ?? 1), 0);
}

function updateBeanTotalStat(){
  const el = document.getElementById('bean-total-stat');
  if(el) el.textContent = money(computeBeanTotal());
}

function findBeanByName(name){
  const norm = name.trim().toLowerCase();
  return state.beans.find(b => (b.bean||'').trim().toLowerCase() === norm);
}

function dialinCountForBean(bean){
  return state.dialins.filter(x => x.beanId ? x.beanId===bean.id : x.bean===bean.bean).length;
}

function renderBeanCards(){
  const wrap = document.getElementById('bean-list-wrap');
  if(state.beans.length===0){
    wrap.innerHTML = `<div class="empty"><b>No bags logged yet</b>Add your next bag of beans to start tracking spend.</div>`;
    return;
  }
  const sorted = [...state.beans].sort((a,b)=> (b.purchaseDate||'').localeCompare(a.purchaseDate||''));
  wrap.innerHTML = `<div class="bean-card-list" id="bean-card-list">${sorted.map(beanCardHtml).join('')}</div>`;

  const list = document.getElementById('bean-card-list');
  list.addEventListener('click', e=>{
    if(e.target.closest('[data-del-bean]')){
      deleteBean(e.target.closest('[data-del-bean]').dataset.delBean);
      return;
    }
    const card = e.target.closest('.bean-card');
    if(card) SL.openBeanDetail(card.dataset.beanId);
  });
  list.addEventListener('keydown', e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    if(e.target.closest('[data-del-bean]')) return;
    const card = e.target.closest('.bean-card');
    if(card){ e.preventDefault(); SL.openBeanDetail(card.dataset.beanId); }
  });
}

// Adding a bean you already have just restocks it (qty += n) instead of
// creating a duplicate row — matched by exact name (case/whitespace
// insensitive). A genuinely new name gets its own new card.
function addOrRestockBean(draft){
  const existing = findBeanByName(draft.bean);
  if(existing){
    existing.qty = (existing.qty ?? 1) + draft.qty;
    existing.roastLevel = draft.roastLevel;
    existing.roastDate = draft.roastDate;
    existing.weightOz = draft.weightOz;
    existing.price = draft.price;
    if(draft.purchaseDate > existing.purchaseDate) existing.purchaseDate = draft.purchaseDate;
    persist('beans', state.beans);

    const card = document.querySelector(`.bean-card[data-bean-id="${existing.id}"]`);
    if(card) card.outerHTML = beanCardHtml(existing);
  } else {
    const entry = { id: uid(), ...draft };
    state.beans.unshift(entry);
    persist('beans', state.beans);

    const list = document.getElementById('bean-card-list');
    const topDate = list && list.firstElementChild && list.firstElementChild.dataset.purchaseDate;
    if(!list || (topDate && entry.purchaseDate < topDate)){
      renderBeanCards();
    } else {
      list.insertAdjacentHTML('afterbegin', beanCardHtml(entry));
    }
  }
  updateBeanTotalStat();
}

function deleteBean(id){
  if(!state.beans.some(b=>b.id===id)) return;
  state.beans = state.beans.filter(b=>b.id!==id);
  persist('beans', state.beans);

  const card = document.querySelector(`.bean-card[data-bean-id="${id}"]`);
  if(card) card.remove();

  if(state.beans.length===0) renderBeanCards();
  updateBeanTotalStat();
}

// Called by beanDetail.js after logging/deleting a dial-in, so the
// card's shot count stays current without a full panel re-render.
function refreshBeanCard(id){
  const bean = state.beans.find(b=>b.id===id);
  const card = document.querySelector(`.bean-card[data-bean-id="${id}"]`);
  if(bean && card) card.outerHTML = beanCardHtml(bean);
  updateBeanTotalStat();
}

function beanCardHtml(b){
  const qty = b.qty ?? 1;
  const unitPrice = parseFloat(b.price) || 0;
  const total = unitPrice * qty;
  const priceLine = qty===0 ? 'Out of stock' : qty > 1 ? `${qty} × ${money(unitPrice)} = ${money(total)}` : money(unitPrice);
  const priceLabel = qty===0 ? 'stock' : qty>1 ? 'total' : 'price';
  const shots = dialinCountForBean(b);

  return `
    <div class="bean-card" data-bean-id="${b.id}" data-purchase-date="${b.purchaseDate||''}" role="button" tabindex="0">
      <div class="bean-card-top">
        <div class="bean-card-name">${escapeHtml(b.bean)}</div>
        <div class="bean-card-date">${fmtDate(b.purchaseDate)}</div>
      </div>
      <div class="bean-card-stats">
        <div><b>${b.roastLevel?`<span class="roast-dot" style="background:${roastColor(b.roastLevel)}"></span>`:''}${b.roastLevel||'—'}</b>roast</div>
        <div><b>${b.weightOz? b.weightOz+' oz':'—'}</b>weight</div>
        <div><b>${priceLine}</b>${priceLabel}</div>
      </div>
      <div class="bean-card-foot">
        <span style="font-size:11px;color:var(--paper-muted);">${shots>0? `${shots} shot${shots===1?'':'s'} logged — tap to view` : 'No dial-ins yet — tap to log one'}</span>
        <div class="row-actions"><button class="icon-btn danger" data-del-bean="${b.id}">delete</button></div>
      </div>
    </div>
  `;
}

SL.renderBeans = renderBeans;
SL.refreshBeanCard = refreshBeanCard;
SL.computeBeanTotal = computeBeanTotal;

})(window.ShotLog = window.ShotLog || {});
