(function(SL){
'use strict';
const { state, persist, escapeHtml, escapeAttr } = SL;
// SL.refreshDrinkCard (defined in panels/drinks.js) is only called
// inside closeRecipeModal(), well after every script has loaded, so
// it doesn't matter that drinks.js loads after this file.

let recipeDrinkId = null;
let editingRecipeId = null;

function onRecipeKeydown(e){ if(e.key==='Escape') closeRecipeModal(); }

function openRecipeModal(drinkId){
  recipeDrinkId = drinkId;
  editingRecipeId = null;
  document.addEventListener('keydown', onRecipeKeydown);
  renderRecipeModal();
}

function closeRecipeModal(){
  document.removeEventListener('keydown', onRecipeKeydown);
  const overlay = document.getElementById('sheet-overlay');
  if(overlay){
    overlay.classList.remove('open');
    setTimeout(()=>{ overlay.remove(); }, 280);
  }
  if(recipeDrinkId) SL.refreshDrinkCard(recipeDrinkId);
  recipeDrinkId = null;
  editingRecipeId = null;
}

function renderRecipeModal(){
  const existing = document.getElementById('sheet-overlay');
  if(existing) existing.remove();

  const drink = state.drinks.find(d=>d.id===recipeDrinkId);
  if(!drink) return;
  const editing = editingRecipeId === recipeDrinkId;
  const recipe = drink.recipe || {ingredients:[], steps:[]};

  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet-modal" role="dialog" aria-modal="true" aria-label="Recipe for ${escapeAttr(drink.drink)}">
      <div class="sheet-head">
        <h3>${escapeHtml(drink.drink)}</h3>
        <button class="sheet-close" id="sheet-close-btn" aria-label="Close">&times;</button>
      </div>
      ${editing ? recipeEditHtml(recipe) : recipeViewHtml(recipe)}
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e=>{ if(e.target===overlay) closeRecipeModal(); });
  document.getElementById('sheet-close-btn').addEventListener('click', closeRecipeModal);

  if(editing){
    wireRecipeEditHandlers(drink);
  } else {
    const editBtn = document.getElementById('recipe-edit-btn');
    if(editBtn) editBtn.addEventListener('click', ()=>{ editingRecipeId = recipeDrinkId; renderRecipeModal(); });
  }

  requestAnimationFrame(()=>{ requestAnimationFrame(()=> overlay.classList.add('open')); });
}

function recipeViewHtml(recipe){
  const hasIng = recipe.ingredients && recipe.ingredients.length;
  const hasSteps = recipe.steps && recipe.steps.length;
  if(!hasIng && !hasSteps){
    return `
      <div class="recipe-empty"><b style="display:block;font-family:'Fraunces',serif;font-size:15px;color:var(--text);margin-bottom:4px;">No recipe yet</b>Save how you make this drink so future-you can repeat it.</div>
      <div class="recipe-actions"><button class="btn" id="recipe-edit-btn">+ Add recipe</button></div>
    `;
  }
  let html = '';
  if(hasIng){
    html += `<div class="recipe-section"><h4>Ingredients</h4><ul class="recipe-ing-list">
      ${recipe.ingredients.map((ing,i)=>`<li style="animation-delay:${i*45}ms"><span>${escapeHtml(ing.name)}</span><span style="color:var(--paper-muted)">${escapeHtml(ing.amount||'')}</span></li>`).join('')}
    </ul></div>`;
  }
  if(hasSteps){
    const base = (recipe.ingredients&&recipe.ingredients.length||0)*45;
    html += `<div class="recipe-section"><h4>Steps</h4><ol class="recipe-step-list" style="padding:0;">
      ${recipe.steps.map((s,i)=>`<li style="animation-delay:${base + i*45}ms"><span class="stepnum">${i+1}</span><span>${escapeHtml(s)}</span></li>`).join('')}
    </ol></div>`;
  }
  html += `<div class="recipe-actions"><button class="btn ghost" id="recipe-edit-btn">Edit recipe</button></div>`;
  return html;
}

function recipeEditHtml(recipe){
  const ings = recipe.ingredients && recipe.ingredients.length ? recipe.ingredients : [{name:'',amount:''}];
  const steps = recipe.steps && recipe.steps.length ? recipe.steps : [''];
  return `
    <div class="recipe-section">
      <h4>Ingredients</h4>
      <div id="recipe-ing-rows">
        ${ings.map((ing,i)=>`
          <div class="recipe-edit-row" data-ing-row="${i}">
            <input type="text" class="ing-name" placeholder="e.g. Espresso" value="${escapeAttr(ing.name)}">
            <input type="text" class="ing-amount" placeholder="e.g. 2 oz" value="${escapeAttr(ing.amount)}" style="max-width:90px;">
            <button class="icon-btn danger" data-remove-ing="${i}">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="btn ghost small" id="recipe-add-ing">+ Ingredient</button>
    </div>
    <div class="recipe-section">
      <h4>Steps</h4>
      <div id="recipe-step-rows">
        ${steps.map((s,i)=>`
          <div class="recipe-edit-row" data-step-row="${i}">
            <textarea class="step-text" placeholder="Describe this step">${escapeHtml(s)}</textarea>
            <button class="icon-btn danger" data-remove-step="${i}">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="btn ghost small" id="recipe-add-step">+ Step</button>
    </div>
    <div class="recipe-actions">
      <button class="btn ghost" id="recipe-cancel-btn">Cancel</button>
      <button class="btn" id="recipe-save-btn">Save recipe</button>
    </div>
  `;
}

function collectRecipeDraft(drink){
  if(!drink.recipe) drink.recipe = {ingredients:[], steps:[]};
  const names = document.querySelectorAll('.ing-name');
  const amounts = document.querySelectorAll('.ing-amount');
  drink.recipe.ingredients = Array.from(names).map((el,i)=>({name:el.value, amount:amounts[i].value}));
  const steps = document.querySelectorAll('.step-text');
  drink.recipe.steps = Array.from(steps).map(el=>el.value);
}

function wireRecipeEditHandlers(drink){
  document.getElementById('recipe-add-ing').addEventListener('click', ()=>{
    collectRecipeDraft(drink);
    drink.recipe.ingredients.push({name:'',amount:''});
    renderRecipeModal();
  });
  document.getElementById('recipe-add-step').addEventListener('click', ()=>{
    collectRecipeDraft(drink);
    drink.recipe.steps.push('');
    renderRecipeModal();
  });
  document.querySelectorAll('[data-remove-ing]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      collectRecipeDraft(drink);
      drink.recipe.ingredients.splice(Number(btn.dataset.removeIng),1);
      renderRecipeModal();
    });
  });
  document.querySelectorAll('[data-remove-step]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      collectRecipeDraft(drink);
      drink.recipe.steps.splice(Number(btn.dataset.removeStep),1);
      renderRecipeModal();
    });
  });
  document.getElementById('recipe-cancel-btn').addEventListener('click', ()=>{
    editingRecipeId = null;
    renderRecipeModal();
  });
  document.getElementById('recipe-save-btn').addEventListener('click', ()=>{
    collectRecipeDraft(drink);
    drink.recipe.ingredients = drink.recipe.ingredients.filter(i=>i.name.trim());
    drink.recipe.steps = drink.recipe.steps.filter(s=>s.trim());
    editingRecipeId = null;
    persist('drinks', state.drinks);
    renderRecipeModal();
  });
}

SL.openRecipeModal = openRecipeModal;

})(window.ShotLog = window.ShotLog || {});
