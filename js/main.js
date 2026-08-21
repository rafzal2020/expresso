(function(SL){
'use strict';
const { state, loadState, ICONS, positionTabIndicator, triggerTabIconAnim,
  renderBeans, renderDrinks, renderStats } = SL;

let activeTab = 'beans';
let animateIndicatorNext = false;

function render(){
  const app = document.getElementById('app');
  const bestCount = state.dialins.filter(x=>x.best).length;

  app.innerHTML = `
    <div class="header">
      <div>
        <h1>ex<em>presso</em></h1>
        <div class="sub">justify your expensive hobby</div>
      </div>
      <div class="gauge">
        <div><b id="stat-shots">${state.dialins.length}</b> shots pulled</div>
        <div><b id="stat-keepers">${bestCount}</b> keepers marked ★</div>
      </div>
    </div>

    <div class="panel ${activeTab==='beans'?'active':''}" id="panel-beans"></div>
    <div class="panel ${activeTab==='drinks'?'active':''}" id="panel-drinks"></div>
    <div class="panel ${activeTab==='stats'?'active':''}" id="panel-stats"></div>

    <nav class="bottom-nav" role="tablist" aria-label="Sections">
      <div class="bottom-nav-inner">
        <div class="tab-indicator" id="tab-indicator"></div>
        <button class="tab ${activeTab==='beans'?'active':''}" data-tab="beans">
          ${ICONS.beans}
          <span>Beans</span>
        </button>
        <button class="tab ${activeTab==='drinks'?'active':''}" data-tab="drinks">
          ${ICONS.drinks}
          <span>Drinks</span>
        </button>
        <button class="tab ${activeTab==='stats'?'active':''}" data-tab="stats">
          ${ICONS.stats}
          <span>My Stats</span>
        </button>
      </div>
    </nav>
  `;

  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      const changed = activeTab !== t.dataset.tab;
      if(changed) animateIndicatorNext = true;
      activeTab = t.dataset.tab;
      render();
      if(changed) triggerTabIconAnim(activeTab);
    });
  });

  positionTabIndicator(animateIndicatorNext);
  animateIndicatorNext = false;

  if(activeTab==='beans') renderBeans();
  if(activeTab==='drinks') renderDrinks();
  if(activeTab==='stats') renderStats();
}

// Cheap header patch for panels to call after a targeted DOM mutation,
// so a star toggle / add / delete doesn't need a full render().
function updateHeaderStats(){
  const shotsEl = document.getElementById('stat-shots');
  const keepersEl = document.getElementById('stat-keepers');
  if(shotsEl) shotsEl.textContent = state.dialins.length;
  if(keepersEl) keepersEl.textContent = state.dialins.filter(x=>x.best).length;
}

SL.render = render;
SL.updateHeaderStats = updateHeaderStats;

loadState().then(render);

})(window.ShotLog = window.ShotLog || {});
