(function(SL){
'use strict';
const { prefersReducedMotion } = SL;

// ---------------------------------------------------------------
// Tab indicator (liquid glass)
//
// left/width are only ever *written* once per call (a single layout
// pass), never transitioned — the animated part is a transform-only
// FLIP: snap the box to its final geometry instantly, invert it back
// to where it visually was with translateX/scaleX, then release that
// transform under a CSS transition so the browser only has to animate
// a compositor-thread property, not re-run layout every frame.
// ---------------------------------------------------------------
// #tab-indicator is a brand-new DOM node every render() (the whole
// nav is rebuilt via innerHTML), so the "previous" geometry can't
// live on the element itself — it has to survive here instead.
let lastIndicatorLeft = null;
let lastIndicatorWidth = null;

function positionTabIndicator(animate){
  const track = document.getElementById('tab-indicator');
  const activeBtn = document.querySelector('.tab.active');
  if(!track || !activeBtn) return;

  const parent = activeBtn.parentElement;
  const pRect = parent.getBoundingClientRect();
  const bRect = activeBtn.getBoundingClientRect();
  const newLeft = bRect.left - pRect.left;
  const newWidth = bRect.width;

  const prevLeft = lastIndicatorLeft !== null ? lastIndicatorLeft : newLeft;
  const prevWidth = lastIndicatorWidth !== null ? lastIndicatorWidth : newWidth;
  const shouldAnimate = animate && !prefersReducedMotion() && (prevLeft !== newLeft || prevWidth !== newWidth);

  track.style.transition = 'none';
  track.style.left = newLeft + 'px';
  track.style.width = newWidth + 'px';
  track.style.opacity = '1';

  if(shouldAnimate){
    track.style.transform = `translateX(${prevLeft - newLeft}px) scaleX(${prevWidth / newWidth})`;
    void track.offsetWidth;
    track.style.transition = '';
    track.style.transform = 'translateX(0) scaleX(1)';
  } else {
    track.style.transform = 'none';
    void track.offsetWidth;
    track.style.transition = '';
  }

  lastIndicatorLeft = newLeft;
  lastIndicatorWidth = newWidth;
}

// ---------------------------------------------------------------
// Icon gestures (steam / wiggle / shake) — pure CSS keyframes,
// only toggled via class add/remove, no per-frame JS work.
// ---------------------------------------------------------------
function triggerTabIconAnim(tab){
  if(prefersReducedMotion()) return;
  const btn = document.querySelector(`.tab[data-tab="${tab}"]`);
  const svg = btn && btn.querySelector('svg');
  if(!svg) return;
  const cls = tab==='beans' ? 'icon-wiggle' : tab==='drinks' ? 'icon-shake' : tab==='stats' ? 'icon-grow' : null;
  if(!cls) return;
  svg.classList.remove(cls);
  void svg.offsetWidth;
  svg.classList.add(cls);
  svg.addEventListener('animationend', ()=> svg.classList.remove(cls), {once:true});
}

window.addEventListener('resize', ()=> positionTabIndicator(false));

// ---------------------------------------------------------------
// Stats tab: YouTube-style shrinking hero card on scroll.
// CSS `position:sticky` handles the pin; this only drives the
// scroll-linked shrink, purely via transform/opacity, so a scroll
// frame never touches layout.
// ---------------------------------------------------------------
const HERO_SHRINK_DISTANCE = 150;
let heroNaturalTop = null;
let heroScrollRafId = null;

// Call once, right after the stats panel mounts (and its DOM exists).
// Re-establishes the scroll offset the shrink is measured from, and
// applies the correct state immediately in case the tab is re-entered
// mid-scroll.
function primeStatsHero(){
  const wrap = document.getElementById('machine-hero');
  if(!wrap){ heroNaturalTop = null; return; }
  heroNaturalTop = wrap.getBoundingClientRect().top + window.scrollY;
  applyHeroShrink();
}

function applyHeroShrink(){
  heroScrollRafId = null;
  const wrap = document.getElementById('machine-hero');
  const card = document.getElementById('machine-card');
  const details = document.getElementById('machine-details');
  if(!wrap || !card || heroNaturalTop === null) return;

  if(prefersReducedMotion()){
    card.style.transform = 'none';
    if(details) details.style.opacity = '1';
    wrap.classList.remove('is-docked');
    return;
  }

  const progress = Math.max(0, Math.min(1, (window.scrollY - heroNaturalTop) / HERO_SHRINK_DISTANCE));
  card.style.transform = `scale(${1 - progress * 0.22})`;
  if(details) details.style.opacity = String(Math.max(0, 1 - progress * 1.6));
  wrap.classList.toggle('is-docked', progress > 0.05);
}

function onStatsScroll(){
  if(heroNaturalTop === null) return;
  if(!heroScrollRafId) heroScrollRafId = requestAnimationFrame(applyHeroShrink);
}

window.addEventListener('scroll', onStatsScroll, {passive:true});
window.addEventListener('resize', ()=>{ if(document.getElementById('machine-hero')) primeStatsHero(); });

SL.positionTabIndicator = positionTabIndicator;
SL.triggerTabIconAnim = triggerTabIconAnim;
SL.primeStatsHero = primeStatsHero;

})(window.ShotLog = window.ShotLog || {});
