(function(SL){
'use strict';

// A slowly, continuously spinning 3D kraft-paper coffee pouch, with
// the bean's name rendered onto its label face. Real WebGL (Three.js,
// bundled locally in js/vendor/three.min.js — no network dependency
// once downloaded), not a CSS approximation.
let activeBag = null; // { raf, renderer, scene, onVisibility, materials, textures }

function stopBeanBag(){
  if(!activeBag) return;
  cancelAnimationFrame(activeBag.raf);
  document.removeEventListener('visibilitychange', activeBag.onVisibility);
  activeBag.scene.traverse(obj=>{
    if(obj.geometry) obj.geometry.dispose();
  });
  activeBag.materials.forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); });
  activeBag.renderer.dispose();
  activeBag = null;
}

function mountBeanBag(container, beanName){
  stopBeanBag();
  if(!container) return;

  if(typeof THREE === 'undefined'){
    container.innerHTML = '<div class="bag3d-fallback">Bag preview unavailable</div>';
    return;
  }

  const size = Math.max(160, Math.min(container.clientWidth || 260, 340));
  const canvas = document.createElement('canvas');
  container.innerHTML = '';
  container.appendChild(canvas);

  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  }catch(e){
    container.innerHTML = '<div class="bag3d-fallback">Bag preview unavailable</div>';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(size, size, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.05, 6.6);
  camera.lookAt(0, 0.05, 0);

  scene.add(new THREE.AmbientLight(0xfff2e0, 0.55));
  const key = new THREE.DirectionalLight(0xfff6ea, 1.2);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3; key.shadow.camera.right = 3;
  key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
  key.shadow.radius = 6;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdce8ff, 0.32);
  fill.position.set(-4, 2, -1.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(-2, 3, -5);
  scene.add(rim);

  const bag = new THREE.Group();
  scene.add(bag);

  const W = 1.7, H = 2.35, D = 0.62;
  const geo = new THREE.BoxGeometry(W, H, D, 1, 4, 1);
  const posAttr = geo.attributes.position;
  for(let i=0;i<posAttr.count;i++){
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    if(y > 0){
      const t = 1 - (y/(H/2)) * 0.09;
      posAttr.setX(i, x*t);
      posAttr.setZ(i, z*t);
    }
  }
  geo.computeVertexNormals();

  const labelCanvas = makeLabelCanvas(beanName);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  if(THREE.sRGBEncoding) labelTex.encoding = THREE.sRGBEncoding;
  labelTex.anisotropy = 4;

  const backCanvas = makeBackCanvas();
  const backTex = new THREE.CanvasTexture(backCanvas);
  if(THREE.sRGBEncoding) backTex.encoding = THREE.sRGBEncoding;

  const kraft = 0xC9A876, kraftSide = 0xB08F5E;
  const paperMat = (color, map) => new THREE.MeshStandardMaterial({ color, map: map||null, roughness:0.92, metalness:0.02 });
  const materials = [
    paperMat(kraftSide),           // +x right
    paperMat(kraftSide),           // -x left
    paperMat(kraft),               // +y top
    paperMat(0x8a6f47),            // -y bottom
    paperMat(0xffffff, labelTex),  // +z front (label)
    paperMat(0xffffff, backTex),   // -z back
  ];
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  bag.add(mesh);

  const foldGeo = new THREE.BoxGeometry(W*0.92, H*0.085, D*0.98);
  const foldMat = new THREE.MeshStandardMaterial({ color:0x7a5d3a, roughness:0.88 });
  const fold = new THREE.Mesh(foldGeo, foldMat);
  fold.position.y = H/2 * 0.91 + H*0.02;
  fold.castShadow = true;
  bag.add(fold);
  materials.push(foldMat);

  bag.position.y = -0.12;

  const groundGeo = new THREE.PlaneGeometry(6, 6);
  const groundMat = new THREE.ShadowMaterial({ opacity:0.26 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -H/2 - 0.17;
  ground.receiveShadow = true;
  scene.add(ground);
  materials.push(groundMat);

  let paused = document.hidden;
  function onVisibility(){ paused = document.hidden; }
  document.addEventListener('visibilitychange', onVisibility);

  activeBag = { raf:0, renderer, scene, onVisibility, materials, textures:[labelTex, backTex] };

  function tick(){
    if(!activeBag) return;
    if(!paused) bag.rotation.y += 0.02;
    renderer.render(scene, camera);
    activeBag.raf = requestAnimationFrame(tick);
  }
  activeBag.raf = requestAnimationFrame(tick);

  // Upgrade the label to the real display font once it's loaded —
  // canvas text draws with whatever's ready *right now*, and the
  // Google Font may still be arriving on first paint.
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(()=>{
      if(!activeBag || activeBag.textures[0]!==labelTex) return;
      const refreshed = makeLabelCanvas(beanName);
      const ctx = labelCanvas.getContext('2d');
      ctx.clearRect(0,0,labelCanvas.width,labelCanvas.height);
      ctx.drawImage(refreshed, 0, 0);
      labelTex.needsUpdate = true;
    }).catch(()=>{});
  }
}

function wrapLines(ctx, text, maxWidth){
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach(word=>{
    const test = line ? line + ' ' + word : word;
    if(ctx.measureText(test).width > maxWidth && line){
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if(line) lines.push(line);
  return lines;
}

function makeLabelCanvas(beanName){
  const W=768, H=1024;
  const c = document.createElement('canvas');
  c.width=W; c.height=H;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0, '#dcbd90');
  grad.addColorStop(1, '#c7a06e');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#6b4a26';
  [[170,700,120],[340,770,90],[520,710,150],[640,830,80],[250,870,70]].forEach(([x,y,r])=>{
    ctx.beginPath();
    ctx.moveTo(x, y-r);
    ctx.bezierCurveTo(x+r, y-r, x+r, y+r*0.6, x, y+r);
    ctx.bezierCurveTo(x-r, y+r*0.6, x-r, y-r, x, y-r);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const name = (beanName || 'House Blend').toUpperCase();
  ctx.fillStyle = '#241a10';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let fontSize = 74;
  ctx.font = `700 ${fontSize}px Fraunces, Georgia, serif`;
  const maxWidth = W*0.74;
  let lines = wrapLines(ctx, name, maxWidth);
  while(lines.length > 3 && fontSize > 38){
    fontSize -= 6;
    ctx.font = `700 ${fontSize}px Fraunces, Georgia, serif`;
    lines = wrapLines(ctx, name, maxWidth);
  }
  const startY = H*0.30 - (lines.length-1)*fontSize*0.56;
  lines.forEach((ln,i)=>{
    ctx.fillText(ln, W*0.13, startY + i*fontSize*1.12);
  });

  ctx.strokeStyle = 'rgba(36,26,16,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W*0.13, H*0.36);
  ctx.lineTo(W*0.13 + 90, H*0.36);
  ctx.stroke();
  ctx.font = `600 22px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(36,26,16,0.7)';
  ctx.fillText('SINGLE ORIGIN · WHOLE BEAN', W*0.13, H*0.36+40);

  return c;
}

function makeBackCanvas(){
  const W=768, H=1024;
  const c = document.createElement('canvas');
  c.width=W; c.height=H;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0, '#c7a473');
  grad.addColorStop(1, '#b7935f');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);
  return c;
}

SL.mountBeanBag = mountBeanBag;
SL.stopBeanBag = stopBeanBag;

})(window.ShotLog = window.ShotLog || {});
