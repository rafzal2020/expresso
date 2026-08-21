(function(SL){
'use strict';
const { state, persist, uid, money, fmtDate, todayISO, escapeHtml } = SL;

function renderDrinks(){
  const panel = document.getElementById('panel-drinks');
  panel.innerHTML = `
    <div class="section-top">
      <h2>Drink Log</h2>
      <div class="stat-strip">
        <div><b id="drink-total-stat">${money(computeDrinkTotal())}</b>spent at home</div>
      </div>
      <button class="btn" id="add-drink-btn">+ Log a drink</button>
    </div>

    <div id="drink-list-wrap"></div>
  `;

  document.getElementById('add-drink-btn').addEventListener('click', openDrinkSheet);

  renderDrinkCards();
}

function drinkFormHtml(){
  return `
    <div class="form-grid">
      <div class="field"><label>Date</label><input type="date" id="dr-date" value="${todayISO()}"></div>
      <div class="field wide"><label>Drink</label><input id="dr-name" placeholder="e.g. Vanilla Latte"></div>
      <div class="field"><label>Estimated cost</label><input type="number" step="0.01" id="dr-cost"></div>
    </div>
    <div class="form-actions">
      <button class="btn ghost" id="drink-cancel">Cancel</button>
      <button class="btn" id="drink-save">Save drink</button>
    </div>
  `;
}

function openDrinkSheet(){
  SL.openSheet('Log a drink', drinkFormHtml());
  document.getElementById('drink-cancel').addEventListener('click', SL.closeSheet);
  document.getElementById('drink-save').addEventListener('click', ()=>{
    const entry = {
      id: uid(),
      date: document.getElementById('dr-date').value || todayISO(),
      drink: document.getElementById('dr-name').value.trim(),
      cost: document.getElementById('dr-cost').value,
    };
    if(!entry.drink){ document.getElementById('dr-name').focus(); return; }
    addDrink(entry);
    SL.closeSheet();
  });
}

function computeDrinkTotal(){
  return state.drinks.reduce((s,d)=> s + (parseFloat(d.cost)||0), 0);
}

function updateDrinkTotalStat(){
  const el = document.getElementById('drink-total-stat');
  if(el) el.textContent = money(computeDrinkTotal());
}

function renderDrinkCards(){
  const wrap = document.getElementById('drink-list-wrap');
  if(state.drinks.length===0){
    wrap.innerHTML = `<div class="empty"><b>No drinks logged yet</b>Log what you made today and what it cost.</div>`;
    return;
  }
  const sorted = [...state.drinks].sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  wrap.innerHTML = `<div class="drink-card-list" id="drink-card-list">${sorted.map(drinkCardHtml).join('')}</div>`;

  const list = document.getElementById('drink-card-list');
  list.addEventListener('click', e=>{
    if(e.target.closest('[data-del-drink]')){
      deleteDrink(e.target.closest('[data-del-drink]').dataset.delDrink);
      return;
    }
    const card = e.target.closest('.drink-card');
    if(card) SL.openRecipeModal(card.dataset.drinkId);
  });
  list.addEventListener('keydown', e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    if(e.target.closest('[data-del-drink]')) return; // let the delete button handle its own activation
    const card = e.target.closest('.drink-card');
    if(card){ e.preventDefault(); SL.openRecipeModal(card.dataset.drinkId); }
  });
}

function addDrink(entry){
  state.drinks.unshift(entry);
  persist('drinks', state.drinks);

  const list = document.getElementById('drink-card-list');
  const topDate = list && list.firstElementChild && list.firstElementChild.dataset.date;
  if(!list || (topDate && entry.date < topDate)){
    renderDrinkCards();
  } else {
    list.insertAdjacentHTML('afterbegin', drinkCardHtml(entry));
  }
  updateDrinkTotalStat();
}

function deleteDrink(id){
  if(!state.drinks.some(d=>d.id===id)) return;
  state.drinks = state.drinks.filter(d=>d.id!==id);
  persist('drinks', state.drinks);

  const card = document.querySelector(`.drink-card[data-drink-id="${id}"]`);
  if(card) card.remove();

  if(state.drinks.length===0) renderDrinkCards();
  updateDrinkTotalStat();
}

// Called by the recipe modal when it closes, so saving/editing a
// recipe only has to refresh the one card whose badge changed.
function refreshDrinkCard(id){
  const card = document.querySelector(`.drink-card[data-drink-id="${id}"]`);
  const d = state.drinks.find(x=>x.id===id);
  if(card && d) card.outerHTML = drinkCardHtml(d);
}

function drinkCardHtml(d){
  const hasRecipe = !!(d.recipe && ((d.recipe.ingredients&&d.recipe.ingredients.length) || (d.recipe.steps&&d.recipe.steps.length)));
  return `
    <div class="drink-card" data-drink-id="${d.id}" data-date="${d.date||''}" role="button" tabindex="0">
      <div class="drink-card-top">
        <div class="drink-card-name">${escapeHtml(d.drink)}${hasRecipe?'<span class="recipe-badge" title="Has a recipe"></span>':''}</div>
        <div class="drink-card-date">${fmtDate(d.date)}</div>
      </div>
      <div class="drink-card-stats">
        <div><b>${money(d.cost)}</b>estimated cost</div>
      </div>
      <div class="drink-card-foot">
        <span style="font-size:11px;color:var(--paper-muted);">${hasRecipe?'Tap to view recipe':'Tap to add a recipe'}</span>
        <div class="row-actions"><button class="icon-btn danger" data-del-drink="${d.id}">delete</button></div>
      </div>
    </div>
  `;
}

SL.renderDrinks = renderDrinks;
SL.refreshDrinkCard = refreshDrinkCard;

})(window.ShotLog = window.ShotLog || {});
