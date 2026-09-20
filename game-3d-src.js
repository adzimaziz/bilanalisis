import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// This is a friendly visual story, not a grid simulator or tariff calculator.
const $ = s => document.querySelector(s);
// ----- Audio: muzik latar "Tenaga Music" + SFX WebAudio (tiada fail tambahan) -----
const music=new Audio('tenaga-music.m4a');music.loop=true;music.volume=.35;music.preload='auto';
let soundOn=true, audioCtx=null;
function startMusic(){if(soundOn&&music.paused)music.play().catch(()=>{});}
function setSound(on){
 soundOn=on;const b=$('#soundTgl');b.setAttribute('aria-pressed',String(on));b.querySelector('.fullscreen-label').textContent=on?'Bunyi: ON':'Bunyi: OFF';
 if(on)startMusic();else music.pause();
}
function sfx(kind){
 if(!soundOn)return;
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  const t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);
  if(kind==='err'){o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(150,t+.16);g.gain.setValueAtTime(.10,t);}
  else{o.type='sine';o.frequency.setValueAtTime(500,t);o.frequency.exponentialRampToValueAtTime(880,t+.11);g.gain.setValueAtTime(.20,t);}
  g.gain.exponentialRampToValueAtTime(.001,t+.22);o.start(t);o.stop(t+.24);
 }catch(e){}
}
// pointerdown sahaja tidak diiktiraf sebagai aktivasi pengguna pada skrin sentuh —
// pointerup/touchend/click diperlukan supaya autoplay dibenarkan di mobile.
for(const ev of ['pointerdown','pointerup','touchend','click','keydown'])
 document.addEventListener(ev,startMusic);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const definitions = {
  plant: {name:'Loji elektrik', hint:'Tempat elektrik dibuat'},
  fuel: {name:'Lori bahan api', hint:'Hantar ke loji'},
  station: {name:'Pencawang', hint:'Bantu elektrik sampai'},
  house: {name:'Rumah comel', hint:'Jom nyalakan lampu'},
  backup: {name:'Loji sokongan', hint:'Sentiasa bersedia'},
  up: {name:'Harga naik', hint:'Apa jadi pada bil?'},
  down: {name:'Harga turun', hint:'Cuba pula'},
  tree: {name:'Pokok rendang', hint:'Teduh dan nyaman'},
  solar: {name:'Panel solar', hint:'Kuasa cahaya matahari'}
};
const lessons = [
  {name:'Caj Tenaga', icon:'ϟ', short:'Untuk membuat elektrik.', text:'Loji perlukan tenaga dan bahan api untuk membuat elektrik. Kos menghasilkan elektrik inilah cerita Caj Tenaga.', bg:'#eef4e3', border:'#dbe7ca'},
  {name:'Caj Rangkaian', icon:'⌁', short:'Untuk menghantar elektrik ke rumah.', text:'Elektrik perlukan jalan untuk sampai ke rumah. Kabel, pencawang dan penjagaannya dibiayai oleh Caj Rangkaian.', bg:'#f2edf7', border:'#e4daef'},
  {name:'Caj Kapasiti', icon:'♡', short:'Untuk memastikan loji tersedia.', text:'Walaupun belum digunakan, loji perlu dijaga supaya sedia membantu bila diperlukan. Itulah peranan Caj Kapasiti.', bg:'#ebf3f5', border:'#d5e4e9'},
  {name:'Caj AFA', icon:'↕', short:'Pelarasan kos: boleh naik atau turun.', text:'Bila kos bahan api dan penjanaan berubah berbanding kos asas, AFA melaraskannya setiap bulan. Boleh jadi surcaj, boleh jadi rebat.', bg:'#fbf2df', border:'#ece0c2'}
];
const sites = {plant:'B3', station:'D3', house:'E5', backup:'B5'};
const scenery = {A1:'tree',F1:'tree',F3:'tree',A5:'tree'};
const allCells = Array.from({length:36},(_,i)=>String.fromCharCode(65+i%6)+(Math.floor(i/6)+1));
let stage=0, buildings={}, fueled=false, learned=new Set(), prices=new Set(), lastPrice=null, selected=null;
let renderer, scene, camera, controls, sunlight, ambient, highlight, preview, engineReady=false;
let drag=null, canvasDown=null, suppressClick=0, tickId=0, celebrationTimer=0, lastFrame=0;
const materialCache=new Map(), thumbnails={}, tileMeshes=[], models=new Map(), wireObjects=[];
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
const viewport=$('#viewport'), canvas=$('#board');
const structures=new THREE.Group(), wires=new THREE.Group();
function pos(cell){return new THREE.Vector3((cell.charCodeAt(0)-65-2.5)*1.4,.18,(Number(cell.slice(1))-1-2.5)*1.4);}
function mat(color, extra={}) {
  const key=JSON.stringify([color,extra]);
  if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:0,...extra}));
  return materialCache.get(key);
}
function mesh(parent,geometry,color,x=0,y=0,z=0,extra={}) {
  const m=new THREE.Mesh(geometry,mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function box(g,w,h,d,color,x=0,y=0,z=0,r=.035){return mesh(g,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),color,x,y,z);}
function cyl(g,rt,rb,h,color,x=0,y=0,z=0){return mesh(g,new THREE.CylinderGeometry(rt,rb,h,24),color,x,y,z);}
function ball(g,r,color,x,y,z){return mesh(g,new THREE.SphereGeometry(r,16,12),color,x,y,z);}
function ring(g,r,t,color,x,y,z){const m=mesh(g,new THREE.TorusGeometry(r,t,8,24),color,x,y,z);m.rotation.x=Math.PI/2;return m;}
function face(g,y,z,width=.17){
  ball(g,.025,'#3d594d',-width/2,y,z);ball(g,.025,'#3d594d',width/2,y,z);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.038,y-.064,z),new THREE.Vector3(0,y-.087,z+.005),new THREE.Vector3(.038,y-.064,z)]);
  mesh(g,new THREE.TubeGeometry(curve,8,.009,6,false),'#3d594d');
  const a=ball(g,.037,'#e7ac97',-.15,y-.06,z-.006);a.scale.set(1,.5,.3);
  const b=ball(g,.037,'#e7ac97',.15,y-.06,z-.006);b.scale.set(1,.5,.3);
}
function base(g,color='#e8e4d1'){
  cyl(g,.51,.53,.10,color,0,.06,0);cyl(g,.46,.50,.07,'#f7f2e0',0,.145,0);cyl(g,.43,.46,.06,color,0,.21,0);
}
function bolt(g,x,y,z,color='#ffe399'){
 const shape=new THREE.Shape();shape.moveTo(.035,.12);shape.lineTo(-.07,-.015);shape.lineTo(-.005,-.015);shape.lineTo(-.035,-.13);shape.lineTo(.08,.035);shape.lineTo(.015,.035);shape.closePath();
 return mesh(g,new THREE.ExtrudeGeometry(shape,{depth:.02,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.004,bevelThickness:.004}),color,x,y,z);
}
function roof(g,color){
 const sh=new THREE.Shape();sh.moveTo(-.45,0);sh.lineTo(0,.31);sh.lineTo(.45,0);sh.closePath();
 const m=mesh(g,new THREE.ExtrudeGeometry(sh,{depth:.79,bevelEnabled:true,steps:1,bevelSegments:2,bevelSize:.022,bevelThickness:.022}),color,0,.84,-.395);return m;
}
function makePiece(type){
 const g=new THREE.Group();g.userData.type=type;
 if(type==='plant'||type==='backup'){
  const backup=type==='backup',body=backup?'#9fc4d3':'#9bc7b2',top=backup?'#699dac':'#629b83';base(g,backup?'#d8e7e8':'#dce8cc');
  box(g,.79,.55,.64,body,0,.53,0,.05);box(g,.88,.09,.73,top,0,.84,0);
  box(g,.31,.20,.66,top,-.24,.91,0);box(g,.32,.13,.67,top,.18,.875,0);
  for(const x of [-.24,.26]){cyl(g,.065,.076,.55,backup?'#d4e0de':'#e5d9c6',x,1.07,-.18);cyl(g,.082,.082,.055,top,x,1.33,-.18);cyl(g,.076,.076,.07,'#f5f0df',x,1.15,-.18);}
  for(const x of [-.25,.25])box(g,.12,.14,.025,'#e9ebc9',x,.63,.331,.01);
  face(g,.45,.337,.17);
  if(backup){cyl(g,.102,.102,.027,'#edf2d7',0,.68,.352).rotation.x=Math.PI/2;box(g,.025,.14,.025,'#82a88b',0,.68,.374);box(g,.13,.024,.025,'#82a88b',0,.68,.374);}else bolt(g,0,.72,.345);
 } else if(type==='station'){
  base(g,'#e7def0');box(g,.62,.44,.50,'#cab7db',0,.48,.07,.06);box(g,.70,.07,.57,'#a28bb7',0,.73,.07);
  for(const x of [-.23,.23]){cyl(g,.064,.075,.31,'#89919b',x,.91,.07);for(let k=0;k<4;k++)cyl(g,.092,.092,.028,'#bcb0ce',x,.80+k*.07,.07);}
  for(const x of [-.44,.44])cyl(g,.027,.033,.86,'#a59db0',x,.69,-.25);
  box(g,.98,.055,.055,'#a59db0',0,1.1,-.25);face(g,.44,.326);bolt(g,0,.61,.329);
 } else if(type==='house'){
  base(g,'#eddfc8');box(g,.7,.57,.65,'#f4d7a0',0,.55,0,.025);roof(g,'#d9947e');
  box(g,.12,.37,.14,'#ddba9b',.23,1.02,-.18);box(g,.16,.055,.18,'#bd967c',.23,1.21,-.18);
  box(g,.18,.30,.022,'#90b49b',.18,.46,.338,.065);ball(g,.015,'#647d65',.23,.47,.356);
  const win=box(g,.18,.18,.025,'#c2d4c8',-.19,.64,.34,.025);win.userData.window=true;
  box(g,.012,.18,.017,'#fbefd1',-.19,.64,.36,.004);box(g,.18,.012,.017,'#fbefd1',-.19,.64,.36,.004);face(g,.40,.338,.12);
  box(g,.16,.18,.02,'#c2d4c8',.357,.63,0,.02).rotation.y=Math.PI/2;
 } else if(type==='tree'){
  base(g,'#dbe4c6');cyl(g,.072,.11,.55,'#bb9770',0,.49,0);ball(g,.36,'#91b983',0,.95,0);ball(g,.24,'#a6c894',-.22,.80,.03);ball(g,.25,'#7fab78',.21,.83,-.035);face(g,.91,.337,.14);
 } else if(type==='solar'){
  base(g,'#d9e5d1');box(g,.06,.38,.06,'#8baba2',-.25,.44,0);box(g,.06,.38,.06,'#8baba2',.25,.44,0);
  const panel=new THREE.Group();panel.position.set(0,.70,0);panel.rotation.x=.32;g.add(panel);
  box(panel,.89,.055,.67,'#769fac');box(panel,.84,.02,.61,'#75a6bf',0,.039,0);
  for(const x of [-.27,0,.27])box(panel,.013,.018,.60,'#c2e0df',x,.055,0,.002);
  for(const z of [-.10,.10])box(panel,.84,.018,.012,'#c2e0df',0,.055,z,.002);
  ball(g,.13,'#f7d885',0,1.07,-.21);face(g,1.085,-.08,.09);
 } else if(type==='fuel'){
  box(g,.68,.39,.48,'#e4b878',-.13,.40,0,.065);box(g,.35,.33,.47,'#f2d296',.37,.35,0,.06);box(g,.19,.13,.36,'#c6deda',.47,.57,0,.02);
  box(g,1.08,.09,.49,'#a28d71',.06,.16,0);for(const x of [-.36,.40])for(const z of [-.27,.27]){const wheel=cyl(g,.11,.11,.075,'#566960',x,.135,z);wheel.rotation.x=Math.PI/2;const hub=cyl(g,.045,.045,.078,'#e9e7d8',x,.135,z);hub.rotation.x=Math.PI/2;}
  face(g,.43,.245,.18);cyl(g,.10,.10,.10,'#aeb6a0',-.13,.64,0);bolt(g,-.14,.50,.251);
 } else if(type==='up'||type==='down'){
  base(g,type==='up'?'#f0d9bc':'#dce9c2');cyl(g,.03,.03,.40,'#b69c77',0,.41,0);
  box(g,.57,.58,.075,type==='up'?'#efd2a5':'#c6ddb0',0,.83,0,.07);
  const arrow=new THREE.Group();g.add(arrow);arrow.position.set(0,.84,.05);if(type==='down')arrow.rotation.z=Math.PI;
  box(arrow,.05,.26,.03,type==='up'?'#bc8c55':'#749658',0,-.025,0,.01);
  const a=box(arrow,.05,.18,.03,type==='up'?'#bc8c55':'#749658',-.05,.065,0,.01);a.rotation.z=-.65;
  const b=box(arrow,.05,.18,.03,type==='up'?'#bc8c55':'#749658',.05,.065,0,.01);b.rotation.z=.65;
 }
 return g;
}
function disposeGroup(group){group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});group.removeFromParent();}
function labelSprite(text,color='#869378'){
 const cv=document.createElement('canvas');cv.width=96;cv.height=64;const ctx=cv.getContext('2d');ctx.fillStyle=color;ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,48,32);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));spr.scale.set(.35,.235,1);return spr;
}
function buildBoard(){
 box(scene,9.05,.43,9.05,'#e2d3af',0,-.22,0,.16);box(scene,8.87,.14,8.87,'#f6eed8',0,.005,0,.07);
 for(const cell of allCells){const p=pos(cell),col=cell.charCodeAt(0)-65,row=Number(cell[1])-1;const tile=box(scene,1.37,.085,1.37,(col+row)%2?'#acc68e':'#e8dfc2',p.x,.11,p.z,.018);tile.userData.cell=cell;tileMeshes.push(tile);}
 for(let i=0;i<6;i++){const l=labelSprite(String.fromCharCode(65+i));l.position.set((i-2.5)*1.4,.19,4.38);scene.add(l);const n=labelSprite(String(i+1));n.position.set(-4.38,.19,(i-2.5)*1.4);scene.add(n);}
 for(const x of [-4.28,4.28])for(const z of [-4.28,4.28])ball(scene,.045,'#c4b38c',x,.10,z);
 for(const [cell,type]of Object.entries(scenery)){const tree=makePiece(type);tree.position.copy(pos(cell));tree.scale.setScalar(.68);scene.add(tree);}
 // A tiny pond occupies one decorative corner; it is not a playable cell.
 const pond=cyl(scene,.39,.42,.045,'#a7d5cb',3.5,.19,3.5);pond.scale.z=.77;scenery.F6='pond';
 for(let i=0;i<3;i++)ball(scene,.065,'#dadcca',3.82-i*.09,.24,3.29-i*.11);
 const floor=mesh(scene,new THREE.PlaneGeometry(180,180),'#eaf0e7',0,-.465,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
 highlight=new THREE.Group();const outline=box(highlight,1.30,.027,1.30,'#f7d98d',0,0,0,.035);outline.material=mat('#f7d98d',{emissive:'#d7a841',emissiveIntensity:.14});const inside=box(highlight,1.19,.03,1.19,'#e6e8bd',0,.006,0,.025);inside.material=mat('#efe4af',{emissive:'#f1d877',emissiveIntensity:.10});scene.add(highlight);
 scene.add(structures,wires);
}
function previewThumb(type){
 const s=new THREE.Scene();s.background=new THREE.Color('#f9faf5');s.add(new THREE.HemisphereLight('#fff9eb','#92ab84',2.5));const key=new THREE.DirectionalLight('#fff7e6',3.2);key.position.set(-3,6,5);s.add(key);
 const model=makePiece(type);s.add(model);const c=new THREE.OrthographicCamera(-.93,.93,.82,-.82,.1,20);c.position.set(2,1.9,3);c.lookAt(0,.63,0);renderer.setSize(180,160,false);renderer.render(s,c);const url=canvas.toDataURL('image/png');disposeGroup(model);return url;
}
function setup(){
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 scene=new THREE.Scene();scene.background=new THREE.Color('#eaf0e7');scene.fog=new THREE.Fog('#eaf0e7',28,65);
 ambient=new THREE.HemisphereLight('#fff9ec','#96b18c',2.6);scene.add(ambient);
 sunlight=new THREE.DirectionalLight('#fff5df',3.6);sunlight.position.set(-6,11,7);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1536,1536);sunlight.shadow.camera.left=-8;sunlight.shadow.camera.right=8;sunlight.shadow.camera.top=8;sunlight.shadow.camera.bottom=-8;sunlight.shadow.normalBias=.035;sunlight.shadow.bias=-.0003;sunlight.shadow.radius=4;scene.add(sunlight);
 camera=new THREE.OrthographicCamera(-8,8,6,-6,.1,100);camera.position.set(11,12,15);camera.lookAt(0,.15,0);
 controls=new OrbitControls(camera,canvas);controls.target.set(0,.15,0);controls.enableDamping=!reducedMotion;controls.dampingFactor=.08;controls.enablePan=false;controls.minPolarAngle=.35;controls.maxPolarAngle=1.23;controls.minZoom=.75;controls.maxZoom=1.65;controls.rotateSpeed=.65;controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
 buildBoard();for(const type of Object.keys(definitions))thumbnails[type]=previewThumb(type);
 new ResizeObserver(resize).observe(viewport);resize();controls.update();
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();showFallback('Paparan 3D terhenti. Muat semula untuk membuka papan semula.');});
 engineReady=true;$('#loading').hidden=true;renderUI();renderFrame(0);
}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h;const span=aspect<1?13.5/aspect:10.8;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}
function showFallback(text){engineReady=false;cancelAnimationFrame(tickId);$('#loading').hidden=true;$('#fallback').hidden=false;$('#targetHint').hidden=true;if(text)$('#fallbackText').textContent=text;}
let decorations=new Set();
function isComplete(){return stage<4&&learned.has(stage);}
function available(){
 if(stage===4)return ['house','tree','solar'];
 if(isComplete())return [];
 if(stage===0)return buildings[sites.plant]?['fuel']:['plant'];
 if(stage===1)return buildings[sites.station]?['house']:['station'];
 if(stage===2)return ['backup'];
 return prices.has('up')?['down']:['up'];
}
function goalCell(type=available()[0]){return sites[type]||sites.plant;}
function allowed(type,cell,fromCell=null){
 if(!cell||!allCells.includes(cell)||scenery[cell]||(cell==='C2'&&fueled))return false;
 if(stage===4)return !buildings[cell]||cell===fromCell;
 return available().includes(type)&&cell===goalCell(type);
}
function instruction(){
 if(stage===4)return ['Kampung ini milik anda.','Tambah rumah, pokok atau solar di petak kosong. Seret buah hiasan di papan untuk alihkannya.'];
 if(isComplete())return ['Cantik! Satu cerita terbuka.','Baca kad kecil di bawah. Lepas itu, kita sambung bina kampung.'];
 if(stage===0)return buildings[sites.plant]?['Lori bahan api dah sampai!','Hantar lori ke loji. Macam kita perlukan makanan, loji perlukan bahan api untuk buat elektrik.']:['Semuanya bermula di loji.','Letak loji elektrik di petak B3 yang bercahaya. Di sinilah elektrik kita dibuat!'];
 if(stage===1)return buildings[sites.station]?['Rumah pertama kita!','Letak rumah di E5. Kabel akan bersambung sendiri. Tengok lampu tingkap menyala!']:['Jom hantar elektrik.','Letak pencawang di D3. Pencawang membantu elektrik sampai ke rumah dengan selamat.'];
 if(stage===2)return ['Malam pesta di kampung!','Ramai orang nak guna elektrik. Letak loji sokongan di B5 supaya ada loji yang sedia membantu.'];
 return prices.has('up')?['Kalau harga turun pula?','Hantar tanda “Harga turun” ke loji. AFA bukan sentiasa bayaran tambahan tau.']:['Harga bahan api berubah.','Hantar tanda “Harga naik” ke loji. Kita tengok apa jadi pada cerita bil.'];
}
function say(text){$('#feedback').textContent=text;}
function clearSelected(){selected=null;document.querySelectorAll('.piece').forEach(b=>b.setAttribute('aria-pressed','false'));if(controls)controls.enabled=true;}
function selectPiece(type){
 if(!available().includes(type)||!engineReady)return;
 selected=type;document.querySelectorAll('.piece').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.piece===type)));
 controls.enabled=false;updateTargets();say(`${definitions[type].name} dipilih. ${stage===4?'Tekan petak kosong di papan.':'Letak di '+goalCell(type)+' yang bercahaya.'}`);
}
function updateTargets(){
 if(!highlight)return;
 highlight.visible=stage<4&&!isComplete();if(highlight.visible)highlight.position.copy(pos(goalCell(selected||available()[0]))).setY(.175);
 $('#targetHint').hidden=stage===4||isComplete()||!engineReady;
 if(!$('#targetHint').hidden)$('#targetHint').textContent=`${goalCell()} · ${selected?'Letak di sini ↓':'Tapak pilihan ↓'}`;
 document.querySelectorAll('[data-cell]').forEach(button=>{const valid=allowed(selected||available()[0],button.dataset.cell);button.classList.toggle('valid',valid);button.disabled=!valid;});
}
function renderUI(){
 clearSelected();const [title,text]=instruction();$('#taskTitle').textContent=title;$('#taskText').textContent=text;$('#chapter').textContent=stage===4?'MASA UNTUK MAIN BEBAS':`CERITA ${stage+1} / 4`;
 $('#journey').innerHTML=['Buat elektrik','Hantar','Bersedia','Harga'].map((s,i)=>`<li class="${learned.has(i)?'done':stage===i?'active':''}" ${stage===i?'aria-current="step"':''}><b>${learned.has(i)?'✓':i+1}</b>${s}</li>`).join('');
 $('#starCounter').textContent=Array.from({length:4},(_,i)=>learned.has(i)?'★':'☆').join(' ');$('#starCounter').setAttribute('aria-label',`${learned.size} daripada 4 bintang`);$('#cardCount').textContent=`${learned.size} / 4 dikumpul`;
 $('#cards').innerHTML=lessons.map((l,i)=>`<article class="story-card ${learned.has(i)?'unlocked':''}" style="--bg:${l.bg};--border:${l.border}"><span class="icon" aria-hidden="true">${learned.has(i)?l.icon:'✧'}</span><span class="tick">${learned.has(i)?'✓':'♡'}</span><h3>${l.name}</h3><p>${learned.has(i)?l.short:'Terbuka sambil anda bermain.'}</p></article>`).join('');
 $('#tray').innerHTML=available().map(type=>`<button type="button" class="piece" data-piece="${type}" aria-pressed="false" aria-label="Pilih ${definitions[type].name}" draggable="false"><img src="${thumbnails[type]}" alt="" draggable="false"><b>${definitions[type].name}</b><small>${definitions[type].hint}</small></button>`).join('');
 $('#toolbox').hidden=isComplete();$('#discovery').hidden=!isComplete();
 if(isComplete()){const lesson=lessons[stage];$('#lessonTitle').textContent=lesson.name;$('#lessonText').textContent=lesson.text;$('#next').textContent=stage===3?'Siap! Jom main bebas →':'Jom sambung →';}
 $('#finish').hidden=stage!==4;$('#dayBadge').textContent=stage===2?'☾ Malam pesta':'☀ Pagi yang indah';
 $('#cellButtons').innerHTML=allCells.map(cell=>`<button type="button" data-cell="${cell}" aria-label="Petak ${cell}${buildings[cell]?', '+definitions[buildings[cell]].name:scenery[cell]?', hiasan':''}">${cell}</button>`).join('');
 $('#boardToast').textContent=stage===4?'Pusing papan dan lihat kampung dari setiap sudut.':stage===3?(lastPrice==='up'?'Harga naik → AFA boleh jadi surcaj ↑':lastPrice==='down'?'Harga turun → AFA boleh jadi rebat ↓':'Jom lihat cerita harga bahan api.'):stage===2?(buildings[sites.backup]?'Loji dah bersedia. Pesta boleh diteruskan!':'Malam pesta! Semua nak pasang lampu.'):buildings[sites.house]?'Yay! Lampu rumah kami dah menyala.':fueled?'Loji dah buat elektrik. Jom hantar ke rumah!':'Sebuah kampung menanti sentuhan anda.';
 updateTargets();syncWorld();
}
function syncWorld(){
 if(!scene)return;
 for(const [cell,entry]of models){if(buildings[cell]!==entry.type){disposeGroup(entry.group);models.delete(cell);}}
 for(const [cell,type]of Object.entries(buildings))if(!models.has(cell)){const group=makePiece(type);group.position.copy(pos(cell));group.userData.cell=cell;group.userData.born=performance.now();structures.add(group);models.set(cell,{type,group});}
 const lit=!!(fueled&&buildings[sites.station]&&buildings[sites.house]);
 const party=stage===2&&!buildings[sites.backup];
 for(const {group}of models.values())group.traverse(obj=>{if(obj.userData.window)obj.material=mat(lit&&!party?'#ffe3a0':'#b4c7c0',{emissive:lit&&!party?'#ffce6d':'#000000',emissiveIntensity:(lit&&!party)?0.6:0});});
 ambient.intensity=stage===2?1.15:2.6;sunlight.intensity=stage===2?1.2:3.6;sunlight.color.set(stage===2?'#d0dffc':'#fff5df');scene.background.set(stage===2?'#bacbd0':'#eaf0e7');scene.fog.color.copy(scene.background);
 while(wires.children.length)disposeGroup(wires.children[0]);wireObjects.length=0;
 const connect=(a,b)=>{const start=pos(a).setY(.225),end=pos(b).setY(.225);const mid=new THREE.Vector3(end.x,.225,start.z);const pts=start.x===end.x||start.z===end.z?[start,end]:[start,mid,end];
  for(let k=0;k<pts.length-1;k++){const p=pts[k],q=pts[k+1],length=p.distanceTo(q);if(length<.01)continue;const tube=new THREE.CatmullRomCurve3([p,q]);mesh(wires,new THREE.TubeGeometry(tube,2,.028,6,false),'#d9b966');for(let j=0;j<3;j++){const dot=ball(wires,.045,'#ffeeb2',0,0,0);dot.material=mat('#ffeeb2',{emissive:'#ffd77c',emissiveIntensity:.8});wireObjects.push({dot,p,q,offset:j/3});}}
 };
 if(fueled&&buildings[sites.station])connect(sites.plant,sites.station);if(lit)connect(sites.station,sites.house);if(buildings[sites.backup])connect(sites.backup,sites.station);
 for(const cell of decorations)if(buildings[cell]==='house')connect(sites.station,cell);
 const oldDelivery=scene.getObjectByName('delivery');if(oldDelivery)disposeGroup(oldDelivery);
 if(fueled){const truck=makePiece('fuel');truck.name='delivery';truck.position.copy(pos('C2'));truck.scale.setScalar(.60);truck.rotation.y=-Math.PI/2;scene.add(truck);}
 const oldPrice=scene.getObjectByName('price');if(oldPrice)disposeGroup(oldPrice);
 if(lastPrice){const tag=makePiece(lastPrice);tag.name='price';tag.position.copy(pos('A3'));tag.scale.setScalar(.72);scene.add(tag);}
}
function celebrate(){clearTimeout(celebrationTimer);viewport.classList.remove('celebrate');void viewport.offsetWidth;viewport.classList.add('celebrate');celebrationTimer=setTimeout(()=>viewport.classList.remove('celebrate'),1800);}
function unlock(){if(learned.has(stage))return;learned.add(stage);celebrate();}
function place(type,cell,fromCell=null){
 if(!engineReady||(!available().includes(type)&&!fromCell))return false;
 if(!allowed(type,cell,fromCell)){sfx('err');say(stage===4?'Petak itu sudah berisi. Cuba petak kosong ya.':`Hampir! Letak ${definitions[type].name} di ${goalCell(type)} yang bercahaya.`);return false;}
 let message='';
 if(stage===4){if(fromCell){delete buildings[fromCell];decorations.delete(fromCell);}buildings[cell]=type;decorations.add(cell);message=fromCell?`Dah dialihkan ke ${cell}. Cantik susunan baharu!`:type==='solar'?'Panel solar buat elektrik daripada cahaya. Waktu malam, ia tidak menjana.':type==='tree'?'Teduhnya kampung! Pokok ini untuk menghias.':'Selamat datang, jiran baharu!';}
 else if(type==='fuel'){fueled=true;unlock();message='Vroom! Bahan api sampai. Loji boleh buat elektrik. ★';}
 else if(type==='up'||type==='down'){prices.add(type);lastPrice=type;message=type==='up'?'Kos bahan api naik berbanding asas. AFA boleh menambah bayaran (surcaj). Cuba harga turun pula.':'Kos turun berbanding asas. AFA boleh mengurangkan bayaran (rebat). ★';if(prices.size===2)unlock();}
 else{buildings[cell]=type;message=type==='plant'?'Loji dah berdiri! Sekarang hantar bahan api.':type==='station'?'Pencawang siap. Jom bawa masuk rumah!':type==='house'?'Klik! Lampu menyala. Elektrik dah sampai ke rumah. ★':'Loji sokongan dah bersedia. Pesta boleh diteruskan! ★';if(type==='house'||type==='backup')unlock();}
 sfx('pop');renderUI();say(message);(isComplete()?$('#next'):$('#tray .piece'))?.focus({preventScroll:true});return true;
}
function screenRay(clientX,clientY){
 const rect=canvas.getBoundingClientRect();if(clientX<rect.left||clientY<rect.top||clientX>rect.right||clientY>rect.bottom)return false;
 pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return true;
}
function tileAt(x,y){if(!engineReady||!screenRay(x,y))return null;return raycaster.intersectObjects(tileMeshes,false)[0]?.object.userData.cell||null;}
function pieceAt(x,y){if(!engineReady||!screenRay(x,y))return null;const hits=raycaster.intersectObjects([...models.values()].map(e=>e.group),true);if(!hits.length)return null;let obj=hits[0].object;while(obj&&!obj.userData.cell)obj=obj.parent;return obj?.userData.cell||null;}
function removePreview(){if(preview){preview.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});preview.removeFromParent();preview=null;}}
function makePreview(type){removePreview();preview=makePiece(type);preview.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.68;o.material.depthWrite=false;o.castShadow=false;}});scene.add(preview);}
function startDrag(e,type,button,fromCell=null){
 if(drag||!engineReady||e.button!==0)return;
 if(!fromCell)selectPiece(type);else{selected=null;controls.enabled=false;say('Angkat dan letak di petak kosong.');}
 drag={id:e.pointerId,type,button,fromCell,x:e.clientX,y:e.clientY,moved:false};button.setPointerCapture(e.pointerId);
}
function endDrag(){
 if(drag?.button?.hasPointerCapture?.(drag.id))drag.button.releasePointerCapture(drag.id);
 $('.drag-ghost')?.remove();removePreview();document.body.classList.remove('dragging');drag=null;if(controls)controls.enabled=!selected;updateTargets();
}
function cancelDrag(){const wasMove=drag?.fromCell;endDrag();if(wasMove)clearSelected();}
$('#tray').addEventListener('pointerdown',e=>{const btn=e.target.closest('[data-piece]');if(btn)startDrag(e,btn.dataset.piece,btn);});
$('#tray').addEventListener('click',e=>{if(Date.now()<suppressClick)return;const btn=e.target.closest('[data-piece]');if(btn)selectPiece(btn.dataset.piece);});
document.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;e.preventDefault();
 if(!drag.moved){drag.moved=true;const ghost=document.createElement('div');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.innerHTML=`<img src="${thumbnails[drag.type]}" alt="">`;document.body.append(ghost);document.body.classList.add('dragging');makePreview(drag.type);}
 const cell=tileAt(e.clientX,e.clientY);const ghost=$('.drag-ghost');ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';ghost.hidden=!!cell;
 preview.visible=!!cell;if(cell){preview.position.copy(pos(cell));preview.position.y=.43;highlight.visible=true;highlight.position.copy(pos(cell)).setY(.175);}
},{passive:false});
document.addEventListener('pointerup',e=>{
 if(drag&&drag.id===e.pointerId){const {type,fromCell,moved}=drag;const cell=tileAt(e.clientX,e.clientY);endDrag();if(moved){suppressClick=Date.now()+400;if(cell)place(type,cell,fromCell);else say('Lepaskan buah atas papan. Boleh juga tekan buah, kemudian petak.');}else if(fromCell)say(`${definitions[type].name}. Seret buah ini untuk alihkannya.`);return;}
 if(!canvasDown||canvasDown.id!==e.pointerId)return;const down=canvasDown;canvasDown=null;
 if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;
 const cell=tileAt(e.clientX,e.clientY);if(selected&&cell)place(selected,cell);else{const at=pieceAt(e.clientX,e.clientY);if(at)say(`${definitions[buildings[at]].name} di ${at}. ${stage===4?'Tambah buah hiasan di petak kosong.':'Ikut cerita Si Kilat untuk sambung.'}`);}
});
document.addEventListener('pointercancel',()=>{canvasDown=null;cancelDrag();});
canvas.addEventListener('pointerdown',e=>{
 if(!engineReady||e.button!==0)return;
 const cell=pieceAt(e.clientX,e.clientY);
 if(stage===4&&!selected&&cell&&decorations.has(cell)){e.stopImmediatePropagation();startDrag(e,buildings[cell],canvas,cell);return;}
 canvasDown={id:e.pointerId,x:e.clientX,y:e.clientY};
},true);
$('#targetHint').addEventListener('click',()=>{if(selected)place(selected,goalCell(selected));else say('Pilih buah dalam kotak binaan dahulu. Kemudian tekan tapak ini.');});
$('#cellButtons').addEventListener('click',e=>{const b=e.target.closest('[data-cell]');if(!b||b.disabled)return;if(selected)place(selected,b.dataset.cell);else say('Pilih buah binaan dahulu, kemudian pilih petak.');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelDrag();clearSelected();updateTargets();say('Pilihan dibatalkan. Anda boleh pusing papan semula.');}});
function turn(angle){if(!controls)return;clearSelected();controls.enabled=true;controls.update();const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();}
$('#rotateLeft').addEventListener('click',()=>turn(-Math.PI/4));$('#rotateRight').addEventListener('click',()=>turn(Math.PI/4));
function zoom(factor){if(!camera)return;camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.75,1.65);camera.updateProjectionMatrix();controls.update();}
$('#zoomIn').addEventListener('click',()=>zoom(1.15));$('#zoomOut').addEventListener('click',()=>zoom(1/1.15));
function resetCamera(){if(!camera)return;clearSelected();camera.position.set(11,12,15);camera.zoom=1;controls.target.set(0,.15,0);camera.updateProjectionMatrix();controls.update();}
$('#resetView').addEventListener('click',resetCamera);
$('#next').addEventListener('click',()=>{if(!isComplete())return;stage++;lastPrice=null;renderUI();say('');$('#taskTitle').focus({preventScroll:true});if(stage===4){celebrate();$('#finish').scrollIntoView({behavior:'smooth',block:'nearest'});}else $('.game-layout').scrollIntoView({behavior:'smooth',block:'start'});});
$('#restart').addEventListener('click',()=>{if(!engineReady)return;cancelDrag();stage=0;buildings={};fueled=false;learned=new Set();prices=new Set();decorations=new Set();lastPrice=null;selected=null;suppressClick=0;resetCamera();renderUI();say('Jom bina kampung baharu!');$('#taskTitle').focus({preventScroll:true});});
$('#soundTgl').addEventListener('click',()=>setSound(!soundOn));
$('#retry').addEventListener('click',()=>location.reload());
function renderFrame(time){
 if(!engineReady)return;tickId=requestAnimationFrame(renderFrame);if(document.hidden||time-lastFrame<30)return;lastFrame=time;
 controls.update();
 if(highlight.visible&&!drag)highlight.position.y=.175+(reducedMotion?0:Math.sin(time*.003)*.013);
 for(const {group}of models.values()){const age=(performance.now()-group.userData.born)/380;group.scale.setScalar(reducedMotion||age>=1?1:Math.min(1.07,.3+age*.82));}
 wireObjects.forEach(({dot,p,q,offset})=>dot.position.lerpVectors(p,q,reducedMotion?offset:(time*.00035+offset)%1));
 if(!$('#targetHint').hidden){const p=pos(goalCell()).setY(.44).project(camera);const x=(p.x+1)/2*viewport.clientWidth,y=(-p.y+1)/2*viewport.clientHeight;$('#targetHint').style.left=THREE.MathUtils.clamp(x,75,viewport.clientWidth-75)+'px';$('#targetHint').style.top=THREE.MathUtils.clamp(y,70,viewport.clientHeight-80)+'px';}
 renderer.render(scene,camera);
}
try{setup();}catch(error){console.error('Kampung 3D could not start:',error);showFallback('Pelayar ini belum dapat membuka paparan 3D. Cuba muat semula atau main versi 2D.');}

