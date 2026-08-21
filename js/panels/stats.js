(function(SL){
'use strict';
const { state, persist, money, fmtDate, escapeHtml, escapeAttr, ICONS } = SL;
// SL.primeStatsHero (defined in motion.js) — motion.js loads before
// this file, so it's already available.

function renderStats(){
  const panel = document.getElementById('panel-stats');
  const m = state.machine;

  panel.innerHTML = `
    <div class="stats-hero" id="machine-hero">
      <div class="machine-card" id="machine-card">
        <div class="machine-photo-wrap">
          ${photoHtml(m)}
          <label class="machine-photo-edit" for="machine-photo-input" title="Add a photo">🖼️</label>
          <input type="file" id="machine-photo-input" accept="image/*" hidden>
        </div>
        <div class="machine-body">
          <div class="machine-top">
            <h2 class="machine-name" id="machine-name-display">${escapeHtml(m.name || 'My espresso machine')}</h2>
            <button class="btn ghost small" id="machine-edit-btn">Edit</button>
          </div>
          <div class="machine-meta-row" id="machine-details">${machineMetaHtml(m)}</div>
        </div>
      </div>
    </div>

    <div class="notes-card">
      <div class="lbl">Setup notes</div>
      <textarea id="notes-field" placeholder="Machine, grinder, anything worth remembering...">${escapeHtml(state.notes)}</textarea>
    </div>

    <div class="stats-content">
      <div class="section-top"><h2>Spend vs. Savings</h2></div>
      <div class="chart-card" id="chart-card"></div>

      <div class="section-top" style="margin-top:24px;">
        <h2>Drinks Made</h2>
        <select class="range-select" id="freq-range-select">
          <option value="weekly" ${freqRange==='weekly'?'selected':''}>Weekly</option>
          <option value="monthly" ${freqRange==='monthly'?'selected':''}>Monthly</option>
          <option value="annually" ${freqRange==='annually'?'selected':''}>Annually</option>
        </select>
      </div>
      <div class="chart-card" id="freq-chart-card"></div>
    </div>
  `;

  document.getElementById('machine-edit-btn').addEventListener('click', openMachineSheet);

  document.getElementById('notes-field').addEventListener('blur', e=>{
    state.notes = e.target.value;
    persist('notes', state.notes);
  });

  document.getElementById('machine-photo-input').addEventListener('change', async e=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    try{
      m.photo = await resizeImageToDataUrl(file);
      persist('machine', m);
      refreshMachinePhoto();
    }catch(err){
      console.error('photo read failed', err);
    }
  });

  document.getElementById('freq-range-select').addEventListener('change', e=>{
    freqRange = e.target.value;
    renderFreqChart();
  });

  renderChart();
  renderFreqChart();
  SL.primeStatsHero();
}

function refreshMachineDetails(){
  const nameEl = document.getElementById('machine-name-display');
  if(nameEl) nameEl.textContent = state.machine.name || 'My espresso machine';
  const details = document.getElementById('machine-details');
  if(details) details.innerHTML = machineMetaHtml(state.machine);
}

function machineFormHtml(m){
  return `
    <div class="form-grid">
      <div class="field wide"><label>Machine name</label><input id="mc-name" value="${escapeAttr(m.name)}" placeholder="e.g. Breville Barista Express"></div>
      <div class="field"><label>Price paid</label><input type="number" step="0.01" id="mc-price" value="${escapeAttr(m.price)}"></div>
      <div class="field"><label>Purchase date</label><input type="date" id="mc-purchase" value="${escapeAttr(m.purchaseDate)}"></div>
      <div class="field"><label>Water filter last changed</label><input type="date" id="mc-filter" value="${escapeAttr(m.filterChangedDate)}"></div>
    </div>
    <div class="form-actions">
      <button class="btn ghost" id="machine-cancel">Cancel</button>
      <button class="btn" id="machine-save">Save details</button>
    </div>
  `;
}

function openMachineSheet(){
  const m = state.machine;
  SL.openSheet('Edit machine details', machineFormHtml(m));
  document.getElementById('machine-cancel').addEventListener('click', SL.closeSheet);
  document.getElementById('machine-save').addEventListener('click', ()=>{
    m.name = document.getElementById('mc-name').value.trim();
    m.price = document.getElementById('mc-price').value;
    m.purchaseDate = document.getElementById('mc-purchase').value;
    m.filterChangedDate = document.getElementById('mc-filter').value;
    persist('machine', m);
    refreshMachineDetails();
    renderChart();
    SL.closeSheet();
  });
}

function machineMetaHtml(m){
  return `
    <div class="machine-meta"><span class="v">${m.price? money(m.price) : '—'}</span><span class="l">Paid</span></div>
    <div class="machine-meta"><span class="v">${m.purchaseDate? fmtDate(m.purchaseDate) : '—'}</span><span class="l">Owned since</span></div>
    <div class="machine-meta"><span class="v">${m.filterChangedDate? fmtDate(m.filterChangedDate) : '—'}</span><span class="l">Filter changed</span></div>
  `;
}

function refreshMachinePhoto(){
  const existing = document.getElementById('machine-photo');
  if(existing) existing.outerHTML = photoHtml(state.machine);
}

function photoHtml(m){
  if(m.photo) return `<img class="machine-photo" id="machine-photo" src="${m.photo}" alt="${escapeAttr(m.name||'Espresso machine')}">`;
  return `<div class="machine-photo machine-photo-placeholder" id="machine-photo">${ICONS.dialins}</div>`;
}

// ---------------------------------------------------------------
// Spend vs. Savings chart — see the dataviz skill pass for the
// palette choice: pure red/green failed CVD separation outright
// (ΔE 0.1 under deuteranopia), so "saved" uses a teal validated
// against the app's terracotta at ΔE 13.4 / contrast 3.4:1+.
// ---------------------------------------------------------------
function computeSpendSaved(){
  // Spend is the investment (machine + beans). Saved is the sum of
  // every drink's estimated cost — that's the whole model: log a
  // drink with a cost, it adds straight to the Saved bar.
  const machineSpend = parseFloat(state.machine.price) || 0;
  const beanSpend = state.beans.reduce((s,b)=> s + (parseFloat(b.price)||0), 0);
  const saved = state.drinks.reduce((s,d)=> s + (parseFloat(d.cost)||0), 0);
  return { spend: machineSpend + beanSpend, saved };
}

function renderChart(){
  const card = document.getElementById('chart-card');
  if(!card) return;
  const { spend, saved } = computeSpendSaved();
  const pct = spend>0 ? Math.min(100, Math.round((saved/spend)*100)) : 0;
  card.innerHTML = `
    ${barChartSvg(spend, saved)}
    <div class="stats-meter">
      <div class="stats-meter-track"><div class="stats-meter-fill" style="width:${pct}%"></div></div>
      <div class="stats-meter-label">${pct}% paid back</div>
    </div>
    <p class="stats-interpretation">${interpretationText(spend, saved)}</p>
  `;
}

function barChartSvg(spend, saved){
  const W = 260, H = 170, baseline = 126, maxBarH = 88, barW = 24, radius = 4;
  const cx1 = 80, cx2 = 180;
  const maxVal = Math.max(spend, saved, 1);
  const scale = maxBarH / maxVal;
  const spendH = spend > 0 ? Math.max(3, spend * scale) : 0;
  const savedH = saved > 0 ? Math.max(3, saved * scale) : 0;

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Spent ${money(spend)}, saved ${money(saved)}">
      <line x1="16" y1="${baseline}" x2="${W-16}" y2="${baseline}" stroke="var(--border)" stroke-width="1"/>
      <path d="${barPath(cx1, baseline, barW, spendH, radius)}" fill="var(--accent)"/>
      <path d="${barPath(cx2, baseline, barW, savedH, radius)}" fill="var(--good)"/>
      <text x="${cx1}" y="${baseline - spendH - 10}" text-anchor="middle" class="chart-value">${money(spend)}</text>
      <text x="${cx2}" y="${baseline - savedH - 10}" text-anchor="middle" class="chart-value">${money(saved)}</text>
      <text x="${cx1}" y="${baseline + 20}" text-anchor="middle" class="chart-cat">Spent</text>
      <text x="${cx2}" y="${baseline + 20}" text-anchor="middle" class="chart-cat">Saved</text>
    </svg>
  `;
}

function barPath(cx, baseline, width, height, radius){
  const half = width/2;
  const x0 = cx-half, x1 = cx+half;
  const yTop = baseline - height;
  if(height <= radius || height <= 0){
    return `M${x0},${baseline} L${x0},${yTop} L${x1},${yTop} L${x1},${baseline} Z`;
  }
  return `M${x0},${baseline} L${x0},${yTop+radius} Q${x0},${yTop} ${x0+radius},${yTop} L${x1-radius},${yTop} Q${x1},${yTop} ${x1},${yTop+radius} L${x1},${baseline} Z`;
}

function interpretationText(spend, saved){
  if(spend<=0){
    return "Log your machine's price (and any bean purchases) to see how it stacks up against what you're saving.";
  }
  if(saved<=0){
    return "No drinks logged yet — log one with a cost to start tracking savings.";
  }
  if(saved>=spend){
    return `Your setup has paid for itself — you've saved ${money(saved-spend)} more than you've put in.`;
  }
  const pct = Math.round((saved/spend)*100);
  return `You've saved ${money(saved)} of the ${money(spend)} you've put in — ${pct}% paid back so far.`;
}

// ---------------------------------------------------------------
// Drinks Made — count of drinks per day/week/month, selectable via
// the range dropdown. Single series (just a count), so it reuses
// --accent directly rather than needing a fresh CVD pass: no second
// hue means no adjacent-pair separation to check.
// ---------------------------------------------------------------
let freqRange = 'weekly';

function startOfDay(d){ const c = new Date(d); c.setHours(0,0,0,0); return c; }

function drinksByWeek(){
  const today = startOfDay(new Date());
  const weekStart = startOfDay(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const counts = new Array(7).fill(0);
  state.drinks.forEach(d=>{
    if(!d.date) return;
    const dt = new Date(d.date+'T00:00:00');
    const diffDays = Math.round((dt - weekStart) / 86400000);
    if(diffDays>=0 && diffDays<7) counts[diffDays]++;
  });

  const optsStart = {month:'short', day:'numeric'};
  const optsEnd = weekStart.getFullYear()===weekEnd.getFullYear() ? optsStart : {...optsStart, year:'numeric'};
  const title = `${weekStart.toLocaleDateString('en-US',optsStart)} – ${weekEnd.toLocaleDateString('en-US',optsEnd)}, ${weekEnd.getFullYear()}`;
  return { labels, counts, title };
}

function drinksByMonth(){
  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const labels = Array.from({length:daysInMonth}, (_,i)=> String(i+1));
  const counts = new Array(daysInMonth).fill(0);
  state.drinks.forEach(d=>{
    if(!d.date) return;
    const dt = new Date(d.date+'T00:00:00');
    if(dt.getFullYear()===year && dt.getMonth()===month) counts[dt.getDate()-1]++;
  });

  const title = today.toLocaleDateString('en-US',{month:'long', year:'numeric'});
  return { labels, counts, title };
}

function drinksByYear(){
  const year = new Date().getFullYear();
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const counts = new Array(12).fill(0);
  state.drinks.forEach(d=>{
    if(!d.date) return;
    const dt = new Date(d.date+'T00:00:00');
    if(dt.getFullYear()===year) counts[dt.getMonth()]++;
  });
  return { labels, counts, title: String(year) };
}

function computeFreqData(range){
  if(range==='monthly') return drinksByMonth();
  if(range==='annually') return drinksByYear();
  return drinksByWeek();
}

function renderFreqChart(){
  const card = document.getElementById('freq-chart-card');
  if(!card) return;
  const { labels, counts, title } = computeFreqData(freqRange);
  const total = counts.reduce((a,b)=>a+b, 0);
  const directLabels = freqRange !== 'monthly';
  const tickEvery = freqRange==='monthly' ? Math.max(1, Math.ceil(labels.length/6)) : 1;

  card.innerHTML = `
    <div class="freq-period-label">${escapeHtml(title)} · ${total} drink${total===1?'':'s'}</div>
    ${countBarChartSvg(labels, counts, {directLabels, tickEvery, unit: freqRange})}
  `;
}

function countBarChartSvg(labels, counts, opts){
  const n = labels.length;
  const directLabels = !!opts.directLabels;
  const tickEvery = opts.tickEvery || 1;

  const W = 300, H = directLabels ? 186 : 170;
  const padLeft = 24, padRight = 8, padTop = directLabels ? 26 : 14, padBottom = 26;
  const plotW = W - padLeft - padRight;
  const baseline = H - padBottom;
  const plotH = baseline - padTop;

  const gap = n <= 12 ? 6 : 2;
  let barW = (plotW - gap*(n-1)) / n;
  barW = Math.max(2, Math.min(24, barW));
  const usedW = n*barW + (n-1)*gap;
  const startX = padLeft + Math.max(0, (plotW - usedW) / 2);

  const maxCount = Math.max(...counts, 1);
  const scale = plotH / maxCount;

  let bars = '', xLabels = '', valueLabels = '';
  for(let i=0;i<n;i++){
    const cx = startX + i*(barW+gap) + barW/2;
    const h = counts[i]>0 ? Math.max(3, counts[i]*scale) : 0;
    bars += `<path d="${barPath(cx, baseline, barW, h, Math.min(3, barW/2))}" fill="var(--accent)"/>`;
    if(directLabels && counts[i]>0){
      valueLabels += `<text x="${cx}" y="${baseline-h-6}" text-anchor="middle" class="chart-value freq-value">${counts[i]}</text>`;
    }
    if(i % tickEvery === 0 || i===n-1){
      xLabels += `<text x="${cx}" y="${baseline+16}" text-anchor="middle" class="chart-cat freq-tick">${labels[i]}</text>`;
    }
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Drinks made, ${counts.reduce((a,b)=>a+b,0)} total">
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${baseline}" stroke="var(--border)" stroke-width="1"/>
      <line x1="${padLeft}" y1="${baseline}" x2="${W-padRight}" y2="${baseline}" stroke="var(--border)" stroke-width="1"/>
      <text x="${padLeft-5}" y="${padTop+4}" text-anchor="end" class="chart-cat freq-axis">${maxCount}</text>
      <text x="${padLeft-5}" y="${baseline+3}" text-anchor="end" class="chart-cat freq-axis">0</text>
      ${bars}
      ${valueLabels}
      ${xLabels}
    </svg>
  `;
}

// ---------------------------------------------------------------
// Photo upload — downscale before storing so a full-resolution
// phone photo doesn't blow through localStorage's quota.
// ---------------------------------------------------------------
function resizeImageToDataUrl(file, maxDim=640, quality=0.82){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if(width > maxDim || height > maxDim){
          const s = maxDim / Math.max(width, height);
          width = Math.round(width*s);
          height = Math.round(height*s);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

SL.renderStats = renderStats;

})(window.ShotLog = window.ShotLog || {});
