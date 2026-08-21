(function(SL){
'use strict';

// Generic bottom-sheet, extracted from the recipe modal — used by
// every "log a…" / "edit…" form so they all share the same
// seamless-on-mobile slide-up-from-the-bottom feel.
let onCloseCallback = null;

function onSheetKeydown(e){ if(e.key==='Escape') closeSheet(); }

// Tears down whatever sheet content currently exists (if any),
// firing its registered cleanup — used both for a true close and for
// swapping content within the same open/close flow (e.g. a modal
// that toggles between a list view and a form view).
function teardownCurrentSheet(){
  const overlay = document.getElementById('sheet-overlay');
  if(overlay) overlay.remove();
  const cb = onCloseCallback;
  onCloseCallback = null;
  if(cb) cb();
}

// `onClose` (optional) runs whenever this content is torn down —
// either by a real close, or by another openSheet() call replacing
// it. Used by content that owns a resource needing cleanup (e.g. a
// WebGL render loop) — safe to omit for plain static forms.
function openSheet(title, bodyHtml, onClose){
  teardownCurrentSheet();
  document.removeEventListener('keydown', onSheetKeydown);

  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet-modal" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="sheet-head">
        <h3>${title}</h3>
        <button class="sheet-close" id="sheet-close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="sheet-body">${bodyHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e=>{ if(e.target===overlay) closeSheet(); });
  document.getElementById('sheet-close-btn').addEventListener('click', closeSheet);
  document.addEventListener('keydown', onSheetKeydown);
  onCloseCallback = onClose || null;

  requestAnimationFrame(()=>{ requestAnimationFrame(()=> overlay.classList.add('open')); });

  return overlay.querySelector('.sheet-body');
}

function closeSheet(){
  document.removeEventListener('keydown', onSheetKeydown);
  const overlay = document.getElementById('sheet-overlay');
  if(overlay){
    overlay.classList.remove('open');
    setTimeout(()=>{ overlay.remove(); }, 280);
  }
  const cb = onCloseCallback;
  onCloseCallback = null;
  if(cb) cb();
}

SL.openSheet = openSheet;
SL.closeSheet = closeSheet;

})(window.ShotLog = window.ShotLog || {});
