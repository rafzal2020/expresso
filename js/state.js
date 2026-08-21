(function(SL){
'use strict';

// ---------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------
const SEED_DRINKS = [
  {id:'d1', date:'2026-08-20', drink:'Vanilla Latte', cost:6},
  {id:'d2', date:'2026-08-20', drink:'Iced Vanilla Americano', cost:5},
  {id:'d3', date:'2026-08-20', drink:'Brown Sugar Shaken Espresso', cost:7},
];

const SEED_BEANS = [
  {id:'b1', purchaseDate:'2026-05-26', bean:'Costco Kirkland Whole Bean', roastLevel:'Medium', roastDate:'', weightOz:'', price:'', qty:1},
  {id:'b2', purchaseDate:'2026-05-27', bean:"Trader Joe's Buunni Azmari", roastLevel:'Medium', roastDate:'', weightOz:12, price:10, qty:1},
  {id:'b3', purchaseDate:'2026-06-20', bean:'Counter Culture "big trouble"', roastLevel:'Medium', roastDate:'', weightOz:24, price:26.99, qty:2},
  {id:'b4', purchaseDate:'2026-06-04', bean:'Speckled Ax Bird Dog', roastLevel:'Medium', roastDate:'', weightOz:12, price:18, qty:1},
  {id:'b6', purchaseDate:'2026-08-08', bean:'Small World - Grumpy Monkey', roastLevel:'Medium', roastDate:'', weightOz:12, price:17.99, qty:1},
  {id:'b7', purchaseDate:'2026-08-17', bean:'Small World - Joker Poker', roastLevel:'Medium', roastDate:'2026-08-10', weightOz:12, price:17.99, qty:1},
];

const SEED_DIALINS = [
  {id:'x1', date:'2026-05-26', beanId:'b1', bean:'Costco Kirkland Whole Bean', flavor:'', roast:'Medium', grind:'9', burr:'3', dose:18, yield:45, time:32, notes:'Balance of sour and bitter, not great', best:false},
  {id:'x2', date:'2026-05-27', beanId:'b2', bean:"Trader Joe's Buunni Azmari", flavor:'', roast:'Medium', grind:'8', burr:'3', dose:18, yield:36, time:30, notes:'Sweet, fruity, not much chocolate', best:false},
  {id:'x3', date:'2026-05-27', beanId:'b2', bean:"Trader Joe's Buunni Azmari", flavor:'', roast:'Medium', grind:'7', burr:'3', dose:18, yield:40, time:35, notes:'Sweeter, not as great as 1:2 ratio', best:false},
  {id:'x4', date:'2026-06-02', beanId:'b3', bean:'Counter Culture "big trouble"', flavor:'caramel, nutty, round', roast:'Medium', grind:'12', burr:'3', dose:18, yield:36, time:27, notes:'Chocolatey and sweet', best:true},
  {id:'x5', date:'2026-06-04', beanId:'b4', bean:'Speckled Ax Bird Dog', flavor:'', roast:'Medium', grind:'12', burr:'3', dose:18, yield:36, time:15, notes:'Sour and sweet, not great', best:false},
  {id:'x6', date:'2026-06-04', beanId:'b4', bean:'Speckled Ax Bird Dog', flavor:'', roast:'', grind:'9', burr:'3', dose:18, yield:36, time:18, notes:'Still pretty sweet, like tooo sweet', best:false},
  {id:'x7', date:'2026-06-04', beanId:'b4', bean:'Speckled Ax Bird Dog', flavor:'', roast:'', grind:'7', burr:'3', dose:18, yield:36, time:30, notes:'Much better than last 2, could be better', best:false},
  {id:'x8', date:'2026-06-04', beanId:'b4', bean:'Speckled Ax Bird Dog', flavor:'', roast:'', grind:'8', burr:'3', dose:18, yield:36, time:25, notes:'Holy moly guacamole', best:true},
  {id:'x9', date:'2026-06-20', beanId:'b3', bean:'Counter Culture "big trouble"', flavor:'caramel, nutty, round', roast:'Medium', grind:'12', burr:'3', dose:18, yield:39, time:14, notes:'I taste the nuttiness but room for improvement', best:false},
  {id:'x10', date:'2026-06-20', beanId:'b3', bean:'Counter Culture "big trouble"', flavor:'caramel, nutty, round', roast:'', grind:'11', burr:'3', dose:18, yield:38, time:19, notes:"Better flow, flavor around the same just less bitter so not bad. The output after grinding was 17.5 so that needs to improve.", best:false},
  {id:'x11', date:'2026-06-20', beanId:'b3', bean:'Counter Culture "big trouble"', flavor:'caramel, nutty, round', roast:'', grind:'11', burr:'3', dose:18.5, yield:36.5, time:21, notes:"Great taste. Loses about .4g of grounds by the time it's extracted from puck prep. Gushes a bit at the end, needs more pressure or more grounds.", best:true},
  {id:'x12', date:'2026-08-08', beanId:'b6', bean:'Small World - Grumpy Monkey', flavor:'rich, comforting, chocolatey', roast:'Medium', grind:'8', burr:'3', dose:18, yield:36, time:55, notes:'Sour but chocolatey. Grinded too fine', best:false},
  {id:'x13', date:'2026-08-08', beanId:'b6', bean:'Small World - Grumpy Monkey', flavor:'rich, comforting, chocolatey', roast:'', grind:'10', burr:'3', dose:18, yield:38, time:50, notes:'Still too fine, not really tasting anything', best:false},
  {id:'x14', date:'2026-08-08', beanId:'b6', bean:'Small World - Grumpy Monkey', flavor:'rich, comforting, chocolatey', roast:'', grind:'11', burr:'3', dose:18, yield:36.9, time:20, notes:'Personally not the best taste, but flowing nicely.', best:false},
  {id:'x15', date:'2026-08-08', beanId:'b6', bean:'Small World - Grumpy Monkey', flavor:'rich, comforting, chocolatey', roast:'', grind:'11', burr:'2', dose:18, yield:37, time:30, notes:'Beautiful flow. Probably the best.', best:true},
  {id:'x16', date:'2026-08-17', beanId:'b7', bean:'Small World - Joker Poker', flavor:'rich, comforting, chocolatey', roast:'', grind:'11', burr:'3', dose:18, yield:36, time:25, notes:'Tasting the cocoa notes. Flow was a bit concerning but the timing was good', best:false},
  {id:'x17', date:'2026-08-17', beanId:'b7', bean:'Small World - Joker Poker', flavor:'rich, comforting, chocolatey', roast:'', grind:'10', burr:'3', dose:18, yield:36, time:38, notes:"Wasn't tasting much, felt kind of flat", best:false},
];

const SEED_NOTES = "Machine: Breville Barista Express\nUsually run a +10s pre-infusion on top of the pre-programmed settings — almost never use the stock program as-is.";

const SEED_MACHINE = {
  name: 'Breville Barista Express',
  photo: '',
  price: '',
  purchaseDate: '',
  filterChangedDate: '',
};

// ---------------------------------------------------------------
// State + storage
// ---------------------------------------------------------------
const STORAGE_PREFIX = 'shotlog.';

const state = { drinks: [], beans: [], dialins: [], notes: '', machine: {...SEED_MACHINE} };

async function loadState(){
  try{
    const d = safeGet('drinks');
    const b = safeGet('beans');
    const x = safeGet('dialins');
    const n = safeGet('notes');
    const m = safeGet('machine');
    state.drinks = d ? JSON.parse(d) : SEED_DRINKS;
    state.beans = b ? JSON.parse(b) : SEED_BEANS;
    state.dialins = x ? JSON.parse(x) : SEED_DIALINS;
    state.notes = n !== null ? n : SEED_NOTES;
    state.machine = m ? {...SEED_MACHINE, ...JSON.parse(m)} : {...SEED_MACHINE};

    // One-time cleanup: quantity-based restocking only de-dupes beans
    // going forward (when you log a purchase that matches an existing
    // name) — this catches any duplicate rows already sitting in
    // storage from before that existed, folding their qty together
    // and re-pointing any dial-ins that pointed at the row being removed.
    const beansChanged = mergeDuplicateBeans();

    if(!d) await persist('drinks', state.drinks);
    if(!b || beansChanged) await persist('beans', state.beans);
    if(!x || beansChanged) await persist('dialins', state.dialins);
    if(n===null) await persist('notes', state.notes);
    if(!m) await persist('machine', state.machine);
  }catch(e){
    console.error('storage load failed, using local seed only', e);
    state.drinks = SEED_DRINKS; state.beans = SEED_BEANS; state.dialins = SEED_DIALINS; state.notes = SEED_NOTES;
    state.machine = {...SEED_MACHINE};
  }
}

function mergeDuplicateBeans(){
  const seen = new Map();
  const idRemap = new Map();
  const merged = [];
  state.beans.forEach(b=>{
    const norm = (b.bean||'').trim().toLowerCase();
    if(!norm){ merged.push(b); return; }
    const existing = seen.get(norm);
    if(existing){
      existing.qty = (existing.qty||1) + (b.qty||1);
      if((b.purchaseDate||'') > (existing.purchaseDate||'')){
        existing.purchaseDate = b.purchaseDate;
        existing.roastLevel = b.roastLevel;
        existing.roastDate = b.roastDate;
        existing.weightOz = b.weightOz;
        existing.price = b.price;
      }
      idRemap.set(b.id, existing.id);
    } else {
      seen.set(norm, b);
      merged.push(b);
    }
  });
  if(idRemap.size===0) return false;
  state.beans = merged;
  state.dialins.forEach(x=>{
    if(x.beanId && idRemap.has(x.beanId)) x.beanId = idRemap.get(x.beanId);
  });
  return true;
}

function safeGet(key){
  try{ return localStorage.getItem(STORAGE_PREFIX + key); }
  catch(e){ return null; }
}

async function persist(key, value){
  try{ localStorage.setItem(STORAGE_PREFIX + key, typeof value==='string'?value:JSON.stringify(value)); }
  catch(e){ console.error('save failed', key, e); }
}

SL.state = state;
SL.loadState = loadState;
SL.persist = persist;

})(window.ShotLog = window.ShotLog || {});
