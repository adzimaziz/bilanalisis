'use strict';
// A guided story, not a model of real-world grid operation or tariff calculation.
const $ = selector => document.querySelector(selector);
// ----- Audio: muzik latar "Tenaga Music" + SFX WebAudio (tiada fail tambahan) -----
const music=new Audio('tenaga-music.m4a');music.loop=true;music.volume=.35;music.preload='auto';
let soundOn=true, audioCtx=null;
function startMusic(){if(soundOn&&music.paused)music.play().catch(()=>{});}
function setSound(on){
 soundOn=on;const b=$('#soundTgl');b.setAttribute('aria-pressed',String(on));b.textContent=on?'♪ Bunyi: ON':'♪ Bunyi: OFF';
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
// In-app browser (Facebook/WhatsApp) biarkan webview hidup di latar —
// pause muzik bila halaman disembunyikan/ditutup, sambung bila kembali.
document.addEventListener('visibilitychange',()=>{if(document.hidden)music.pause();else startMusic();});
addEventListener('pagehide',()=>music.pause());
const face = (x=60,y=70) => `<g stroke="#4b625b" stroke-width="2.7" stroke-linecap="round" fill="none"><path d="M${x-9} ${y}v2m18-2v2m-13 5q4 5 8 0"/></g><g fill="#edafa0" opacity=".75"><ellipse cx="${x-15}" cy="${y+5}" rx="4" ry="2"/><ellipse cx="${x+15}" cy="${y+5}" rx="4" ry="2"/></g>`;
function art(type) {
 const shell = content => `<svg class="art" viewBox="0 0 120 110" aria-hidden="true" focusable="false"><g stroke-linejoin="round" stroke-linecap="round">${content}</g></svg>`;
 const drawings = {
  plant: `<ellipse cx="61" cy="101" rx="49" ry="6" fill="#a3bd89" opacity=".4"/><g class="steam" fill="#f7fbf1"><circle cx="87" cy="13" r="9"/><circle cx="96" cy="8" r="7"/></g><path d="M81 25h15v40H81z" fill="#d5dfd8" stroke="#708b7f" stroke-width="2.5"/><path d="M81 32h15m-15 13h15" stroke="#f7f7e9" stroke-width="7"/><rect x="16" y="49" width="88" height="48" rx="7" fill="#9acabd" stroke="#648e7c" stroke-width="2.5"/><path d="M12 50 35 32l23 17 22-14 28 16" fill="#61a792" stroke="#648e7c" stroke-width="3"/><path d="M28 60h13v12H28zm49 0h14v12H77z" fill="#edf3d1" stroke="#729b83" stroke-width="2"/><path d="m60 49-8 14h8l-4 12 13-17h-8l5-9" fill="#ffe394"/>${face(60,81)}`,
  station: `<ellipse cx="60" cy="101" rx="46" ry="6" fill="#9fb78c" opacity=".4"/><path d="M18 91V37m84 54V37M12 43h96" fill="none" stroke="#8e8aa7" stroke-width="5"/><path d="M26 42V29m68 13V29" stroke="#938eac" stroke-width="4"/><path d="M21 29h10m-10 6h10m58-6h10m-10 6h10" stroke="#d3c9e1" stroke-width="5"/><rect x="29" y="49" width="62" height="48" rx="10" fill="#d5c4e6" stroke="#9281a7" stroke-width="2.5"/><path d="M40 48V34m40 14V34" stroke="#7e8397" stroke-width="5"/><path d="M34 37h12m28 0h12" stroke="#b2a3cc" stroke-width="5"/><path d="m62 52-7 12h7l-4 10 12-14h-8l4-8" fill="#fff3af"/>${face(60,79)}`,
  house: `<ellipse cx="60" cy="101" rx="44" ry="6" fill="#a3bd89" opacity=".4"/><path d="M82 33V17h12v29" fill="#ebc29c" stroke="#bb8c73" stroke-width="2.5"/><path d="M23 48h74v47H23z" fill="#ffe1ac" stroke="#bb9979" stroke-width="2.5"/><path d="M14 50 60 14l47 36-7 8-40-30-39 31z" fill="#e7a08c" stroke="#b57c6b" stroke-width="2.5"/><rect class="house-window" x="32" y="57" width="18" height="19" rx="3" stroke="#b39772" stroke-width="2"/><path d="M41 58v17m-8-9h16" stroke="#f8eed3" stroke-width="2"/><rect x="69" y="60" width="17" height="35" rx="7" fill="#b0cbb5" stroke="#8caa8a" stroke-width="2"/><circle cx="81" cy="79" r="1.5" fill="#738a73"/>${face(46,85)}<path d="M16 99h89" stroke="#a18e6c" stroke-width="4"/>`,
  backup: `<ellipse cx="60" cy="101" rx="48" ry="6" fill="#a3bd89" opacity=".4"/><path d="M24 24h14v40H24zm60 0h14v40H84z" fill="#d3dfdf" stroke="#7e9ba0" stroke-width="2.5"/><path d="M24 32h14m46 0h14" stroke="#f5f7e7" stroke-width="7"/><rect x="13" y="51" width="95" height="46" rx="8" fill="#a6cddd" stroke="#779aa4" stroke-width="2.5"/><path d="M10 51 34 37l24 14 23-14 30 15" fill="#7baebc" stroke="#779aa4" stroke-width="2.5"/><circle cx="61" cy="62" r="10" fill="#edf4dc"/><path d="M61 56v12m-6-6h12" stroke="#83a28b" stroke-width="3"/>${face(61,82)}<text class="zzz" x="97" y="23">z</text><text class="zzz" x="107" y="13" font-size="10">z</text>`,
  fuel: `<ellipse cx="60" cy="98" rx="51" ry="6" fill="#a3bd89" opacity=".35"/><rect x="8" y="46" width="64" height="40" rx="8" fill="#e7b878" stroke="#b68e59" stroke-width="2.5"/><path d="M72 57h20l19 19v12H72z" fill="#f1ce89" stroke="#b68e59" stroke-width="2.5"/><path d="M80 61h11l12 13H80z" fill="#d5e8e0" stroke="#adad87" stroke-width="2"/><path d="M7 86h104" stroke="#b68e59" stroke-width="4"/><circle cx="28" cy="90" r="10" fill="#627673"/><circle cx="28" cy="90" r="4" fill="#dce3d0"/><circle cx="91" cy="90" r="10" fill="#627673"/><circle cx="91" cy="90" r="4" fill="#dce3d0"/><path d="M28 44V32h22v12" fill="#bfc3ac" stroke="#9da28b" stroke-width="2.5"/>${face(41,63)}`,
  tree: `<ellipse cx="60" cy="100" rx="33" ry="6" fill="#a3bd89" opacity=".4"/><path d="M52 94V49h15v45" fill="#c6a57b" stroke="#a08765" stroke-width="2.5"/><path d="M23 48c-9-19 10-33 24-29 12-22 43-9 43 10 22 4 24 32 6 39-16 12-53 10-64 0-11-1-16-14-9-20" fill="#9ac788" stroke="#78a973" stroke-width="2.5"/>${face(59,47)}<path d="m71 23 7 5m-45 5 5-4" stroke="#c9df9d" stroke-width="3"/>`,
  solar: `<ellipse cx="60" cy="101" rx="47" ry="6" fill="#a3bd89" opacity=".4"/><path d="M38 86v13m44-13v13" stroke="#829b99" stroke-width="5"/><path d="M21 48h76l14 39H9z" fill="#81b3c8" stroke="#608999" stroke-width="3"/><path d="m46 49-4 37m29-37 5 37M17 62h85M13 75h94" stroke="#c9e1df" stroke-width="2"/><circle cx="62" cy="24" r="15" fill="#ffe292" stroke="#dab35c" stroke-width="2"/>${face(62,23)}<path d="M62 3v-3m-22 9-3-3m47 3 3-3m-3 31 3 3m-50-3-3 3" stroke="#dab35c" stroke-width="3"/>`,
  up: `<path d="m27 20 55 2 24 24-14 55-65-17z" fill="#f5d5bb" stroke="#c89779" stroke-width="2.5"/><circle cx="84" cy="40" r="5" fill="#faf9f2" stroke="#c89779" stroke-width="2"/><path d="M85 39q33-18 15-27" stroke="#a58c70" stroke-width="3" fill="none"/><path d="M57 68V42m-11 12 11-12 11 12" stroke="#c48463" stroke-width="6" fill="none"/><path d="M47 81h20" stroke="#d8aa8c" stroke-width="3"/>`,
  down: `<path d="m27 20 55 2 24 24-14 55-65-17z" fill="#d6e8b8" stroke="#9ab079" stroke-width="2.5"/><circle cx="84" cy="40" r="5" fill="#faf9f2" stroke="#9ab079" stroke-width="2"/><path d="M85 39q33-18 15-27" stroke="#a58c70" stroke-width="3" fill="none"/><path d="M57 42v26M46 56l11 12 11-12" stroke="#7e9f63" stroke-width="6" fill="none"/><path d="M47 81h20" stroke="#a9c088" stroke-width="3"/>`
 };
 return shell(drawings[type] || drawings.tree);
}
const items = {
 plant:{name:'Loji elektrik',hint:'Buat elektrik'},fuel:{name:'Lori bahan api',hint:'Hantar ke loji'},station:{name:'Pencawang',hint:'Bantu hantar elektrik'},house:{name:'Rumah comel',hint:'Tempat kita tinggal'},backup:{name:'Loji sokongan',hint:'Sedia membantu'},up:{name:'Harga naik',hint:'Cuba dulu'},down:{name:'Harga turun',hint:'Cuba pula'},tree:{name:'Pokok rendang',hint:'Hijau & nyaman'},solar:{name:'Panel solar',hint:'Elektrik dari cahaya'}
};
const lots=[{id:'plant',x:23,y:38,label:'Tapak loji'},{id:'station',x:51,y:46,label:'Tapak pencawang'},{id:'house',x:79,y:38,label:'Tapak rumah'},{id:'backup',x:29,y:74,label:'Tapak sokongan'},{id:'garden1',x:54,y:76,label:'Taman kecil'},{id:'garden2',x:79,y:77,label:'Taman kecil'}];
const lessons=[
 {title:'Caj Tenaga',icon:'ϟ',short:'Untuk membuat elektrik.',text:'Macam memasak perlukan bahan, loji perlukan tenaga dan bahan api untuk buat elektrik. Inilah cerita Caj Tenaga.',color:'#edf4e4',border:'#d8e4c9'},
 {title:'Caj Rangkaian',icon:'⌁',short:'Untuk menghantar elektrik ke rumah.',text:'Elektrik perlu jalan untuk sampai ke rumah. Kabel, pencawang dan penjagaannya dibiayai oleh Caj Rangkaian.',color:'#f1edf7',border:'#e2d8ee'},
 {title:'Caj Kapasiti',icon:'♡',short:'Untuk memastikan loji sentiasa tersedia.',text:'Walaupun belum digunakan, loji perlu dijaga supaya sedia membantu bila diperlukan. Itulah peranan Caj Kapasiti.',color:'#eaf2f5',border:'#d3e2e9'},
 {title:'Caj AFA',icon:'↕',short:'Pelarasan kos: boleh naik atau turun.',text:'Bila kos bahan api dan penjanaan berubah berbanding kos asas, AFA melaraskannya setiap bulan. Boleh jadi surcaj, boleh jadi rebat.',color:'#faf0de',border:'#ecdfc3'}
];
let stage=0, buildings={}, fueled=false, learned=new Set(), selected=null, priceSeen=new Set(), lastPrice=null;
let drag=null, suppressClickUntil=0, celebrationTimer=null;
function complete(){return learned.has(stage);}
function available(){
 if(stage===4)return ['house','tree','solar'];
 if(complete())return [];
 if(stage===0)return buildings.plant?['fuel']:['plant'];
 if(stage===1)return buildings.station?['house']:['station'];
 if(stage===2)return ['backup'];
 return priceSeen.has('up')?['down']:['up'];
}
function targets(type=available()[0]){
 if(stage===4)return ['garden1','garden2'];
 return ({plant:['plant'],fuel:['plant'],station:['station'],house:['house'],backup:['backup'],up:['plant'],down:['plant']})[type] || [];
}
function instruction(){
 if(stage===4)return ['Kampung ini milik anda.','Pilih rumah, pokok atau solar. Letak di dua tapak taman. Nak tukar? Letak barang lain di tapak yang sama.'];
 if(complete())return ['Hore, berjaya!','Satu lagi cerita bil dah terbuka. Baca kad kecil di bawah, kemudian kita sambung.'];
 if(stage===0)return buildings.plant?['Loji pun perlukan makanan!','Seret lori bahan api ke loji. Bahan api membantu loji membuat elektrik.']:['Mula dengan sebuah loji.','Seret loji elektrik ke tapak berkelip. Di sinilah perjalanan elektrik kita bermula!'];
 if(stage===1)return buildings.station?['Jom masuk rumah baharu!','Letak rumah di tapaknya. Kabel akan bersambung sendiri. Tengok tingkap rumah menyala!']:['Elektrik nak pergi mana?','Bina pencawang di tapak berkelip. Pencawang membantu bekalan elektrik sampai ke rumah dengan selamat.'];
 if(stage===2)return ['Malam pesta dah tiba!','Ramai orang pasang lampu serentak. Letak loji sokongan supaya ada loji yang sedia membantu.'];
 return priceSeen.has('up')?['Kalau harga turun pula?','Seret tanda “Harga turun” ke loji. AFA bukan sentiasa bayaran tambahan tau.']:['Eh, harga bahan api naik!','Seret tanda “Harga naik” ke loji. Kita tengok apa jadi pada cerita bil.'];
}
function render(){
 const [title,text]=instruction();
 $('#taskTitle').textContent=title;$('#taskText').textContent=text;
 $('#chapterLabel').textContent=stage===4?'MASA UNTUK MENGHIAS':`CERITA ${stage+1} / 4`;
 $('#chapters').innerHTML=['Buat','Hantar','Bersedia','Harga'].map((s,i)=>`<li class="${learned.has(i)?'done':stage===i?'active':''}" ${stage===i?'aria-current="step"':''}><b>${learned.has(i)?'✓':i+1}</b>${s}</li>`).join('');
 $('#stars').textContent=Array.from({length:4},(_,i)=>i<learned.size?'★':'☆').join(' ');$('#starCount').textContent=`${learned.size} daripada 4`;
 $('#albumCount').textContent=`${learned.size} / 4 kad dibuka`;
 $('#cards').innerHTML=lessons.map((l,i)=>`<article class="story-card ${learned.has(i)?'unlocked':'locked'}" style="--card-bg:${l.color};--card-border:${l.border}"><span class="card-icon" aria-hidden="true">${learned.has(i)?l.icon:'✧'}</span>${learned.has(i)?'<span class="number">✓</span>':''}<h3>${l.title}</h3><p>${learned.has(i)?l.short:'Buka sambil membina kampung.'}</p></article>`).join('');
 $('#tray').innerHTML=available().map(key=>`<button type="button" class="item" data-item="${key}" aria-pressed="false" aria-label="Pilih ${items[key].name}. Kemudian pilih tapak berkelip." draggable="false">${art(key)}<span class="item-name">${items[key].name}</span><small>${items[key].hint}</small></button>`).join('');
 $('.toolbox').hidden=stage<4&&complete();
 $('#lots').innerHTML=lots.map(l=>{
 const type=buildings[l.id];const isTarget=targets().includes(l.id)&&!complete();
 const label=type?items[type].name:l.label;
 const content=type?art(type):'<span class="empty-icon" aria-hidden="true">＋</span>';
 return `<button type="button" class="lot ${type?'built':'empty'} ${isTarget?'target':''} ${l.id==='plant'&&fueled?'fed':''}" data-slot="${l.id}" style="left:${l.x}%;top:${l.y}%" aria-label="${label}${type?' (sudah dibina)':''}${isTarget?', tapak pilihan':''}" ${!isTarget&&stage!==4?'aria-disabled="true"':''}>${content}<span class="lot-label">${l.id==='plant'&&lastPrice?(lastPrice==='up'?'AFA: surcaj ↑':'AFA: rebat ↓'):label}</span></button>`;
 }).join('');
 const lit=Boolean(fueled&&buildings.station&&buildings.house);
 $('#world').classList.toggle('powered',lit);$('#world').classList.toggle('night',stage===2);$('#world').classList.toggle('party',stage===2&&!buildings.backup);$('#world').classList.toggle('ready',Boolean(buildings.backup));
 $('#line1').classList.toggle('on',Boolean(fueled&&buildings.station));$('#line2').classList.toggle('on',lit);$('#line3').classList.toggle('on',Boolean(buildings.backup));
 $('#dayLabel').textContent=stage===2?'☾ Malam pesta':stage>=3?'☀ Hari baharu':'☀ Pagi yang indah';
 $('#sun').innerHTML=stage===2?'<path d="M12-26A28 28 0 1 0 27 14 26 26 0 0 1 12-26" fill="#fff0b4"/><path d="m-40-22 2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill="#fff4c7"/>':'<circle r="28" fill="#ffe78f" stroke="#ecc462" stroke-width="3"/><path d="M-10 0v3m20-3v3m-14 8q4 5 8 0" stroke="#936e36" stroke-width="3" fill="none" stroke-linecap="round"/>';
 $('#worldCaption').textContent=stage===2?'Malam pesta! Semua nak pasang lampu.':stage===3?'Lori datang lagi. Harga pun berubah.':stage===4?'Dibina dengan kasih sayang oleh anda.':'Sebuah kampung kecil. Sebuah permulaan besar.';
 $('#worldBubble').textContent=stage===4?'Terima kasih! Seronoknya tinggal di sini ♡':stage===3?(lastPrice==='up'?'Harga naik → AFA boleh jadi surcaj ↑':lastPrice==='down'?'Harga turun → AFA boleh jadi rebat ↓':'Jom lihat cerita harga bahan api.'):stage===2?(buildings.backup?'Loji dah bersedia. Pesta boleh diteruskan!':'Lebih ramai guna elektrik. Jom bersedia!'):lit?'Yay! Lampu rumah kami dah menyala!':buildings.station?'Pencawang siap! Tinggal rumah pula.':fueled?'Loji dah buat elektrik! Jom hantar ke rumah.':'Penghuni kampung tak sabar nak pindah masuk…';
 $('#villageStatus').textContent=stage===4?'💛 Kampung gembira · 4 cerita dipelajari':lit?'✨ Kampung sudah bercahaya':'🌱 Kampung anda sedang dibina';
 $('#discovery').hidden=!complete();
 if(complete()){const l=lessons[stage];$('#discoveryTitle').textContent=l.title;$('#discoveryText').textContent=l.text;$('#next').textContent=stage===3?'Siap! Jom hias kampung →':'Jom sambung →';}
 $('#finish').hidden=stage!==4;
 selected=null;
}
function say(message){$('#feedback').textContent=message;}
function selectItem(key){
 if(!available().includes(key))return;
 selected=key;
 document.querySelectorAll('.item').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.item===key)));
 document.querySelectorAll('.lot').forEach(el=>{const valid=targets(key).includes(el.dataset.slot);el.classList.toggle('target',valid);el.setAttribute('aria-disabled',String(!valid));});
 say(`${items[key].name} dipilih. Seret atau tekan tapak berkelip untuk letak.`);
}
function celebrate(){
 clearTimeout(celebrationTimer);
 $('#celebration').innerHTML=Array.from({length:16},(_,i)=>`<span class="confetti" style="--x:${12+(i*19)%78}%;--c:${['#ffe98f','#fff9de','#e9b9a3','#e0f4bd'][i%4]};animation-delay:${i%4*.09}s">${i%2?'✦':'♡'}</span>`).join('');
 celebrationTimer=setTimeout(()=>{$('#celebration').innerHTML='';},2300);
}
function unlock(){if(learned.has(stage))return;learned.add(stage);celebrate();}
function place(key,slot){
 if(!available().includes(key))return false;
 if(!targets(key).includes(slot)){sfx('err');say('Dekat tapak yang berkelip ya. Tak apa, cuba lagi!');return false;}
 let message='';
 if(stage===4){buildings[slot]=key;message=key==='solar'?'Cantiknya! Panel solar buat elektrik daripada cahaya matahari. Waktu malam, ia tidak menjana.':key==='tree'?'Teduhnya! Pokok ini untuk menghias kampung.':'Jiran baharu dah sampai. Selamat datang!';}
 else if(key==='fuel'){fueled=true;unlock();message='Vroom! Bahan api sampai. Loji boleh mula buat elektrik. ★';}
 else if(key==='up'||key==='down'){lastPrice=key;priceSeen.add(key);message=key==='up'?'Harga bahan api naik berbanding asas. AFA boleh menambah bayaran (surcaj). Sekarang cuba harga turun pula.':'Harga turun berbanding asas. AFA boleh mengurangkan bayaran (rebat). ★';if(priceSeen.size===2)unlock();}
 else {buildings[slot]=key;message=key==='plant'?'Loji dah siap! Sekarang, beri loji bahan api.':key==='station'?'Pencawang dah siap! Jom bawa masuk rumah.':key==='house'?'Klik! Lampu rumah menyala. Elektrik dah sampai! ★':'Loji sokongan dah bersedia. Penduduk boleh terus berpesta! ★';if(key==='house'||key==='backup')unlock();}
 sfx('pop');
 render();say(message);
 // Keyboard users retain a useful focus after the placed item's button is replaced.
 const focusTarget=complete()?$('#next'):$('#tray .item');
 if(focusTarget)focusTarget.focus({preventScroll:true});
 return true;
}
$('#tray').addEventListener('click',e=>{if(Date.now()<suppressClickUntil)return;const item=e.target.closest('[data-item]');if(item)selectItem(item.dataset.item);});
$('#lots').addEventListener('click',e=>{const lot=e.target.closest('[data-slot]');if(!lot)return;if(selected){place(selected,lot.dataset.slot);return;}if(stage<4&&complete()){say('Bagus! Tekan “'+(stage===3?'Siap! Jom hias kampung':'Jom sambung')+'” untuk teruskan.');return;}say('Pilih barang dalam kotak binaan dulu, kemudian tekan tapak berkelip.');});
function clearDrag(){
 if(drag?.button?.hasPointerCapture?.(drag.id))drag.button.releasePointerCapture(drag.id);
 $('.drag-ghost')?.remove();document.body.classList.remove('dragging');document.querySelectorAll('.drop-hover').forEach(x=>x.classList.remove('drop-hover'));drag=null;
}
$('#tray').addEventListener('pointerdown',e=>{
 if(e.button!==0||drag)return;
 const button=e.target.closest('[data-item]');if(!button)return;
 selectItem(button.dataset.item);
 drag={id:e.pointerId,key:button.dataset.item,x:e.clientX,y:e.clientY,moved:false,button};
 button.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
 e.preventDefault();
 if(!drag.moved){drag.moved=true;const ghost=document.createElement('div');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.innerHTML=art(drag.key);document.body.append(ghost);document.body.classList.add('dragging');}
 const ghost=$('.drag-ghost');ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
 const under=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');
 document.querySelectorAll('.lot').forEach(l=>l.classList.toggle('drop-hover',l===under&&targets(drag.key).includes(l.dataset.slot)));
},{passive:false});
document.addEventListener('pointerup',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 const {key,moved}=drag;
 const under=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');
 clearDrag();
 if(moved){suppressClickUntil=Date.now()+450;if(under)place(key,under.dataset.slot);else say('Hampir! Lepaskan barang atas tapak yang berkelip. Boleh juga tekan barang, kemudian tapak.');}
});
document.addEventListener('pointercancel',clearDrag);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){clearDrag();selected=null;document.querySelectorAll('.item').forEach(x=>x.setAttribute('aria-pressed','false'));say('Pilihan dibatalkan. Pilih barang bila dah bersedia.');}});
$('#next').addEventListener('click',()=>{
 if(!complete()||stage>=4)return;
 stage++;lastPrice=null;render();say('');
 $('#taskTitle').focus({preventScroll:true});
 if(stage===4){celebrate();$('#finish').scrollIntoView({behavior:'smooth',block:'nearest'});}else $('.play-layout').scrollIntoView({behavior:'smooth',block:'start'});
});
$('#soundTgl').addEventListener('click',()=>setSound(!soundOn));
$('#restart').addEventListener('click',()=>{
 clearDrag();clearTimeout(celebrationTimer);$('#celebration').innerHTML='';stage=0;buildings={};fueled=false;learned=new Set();priceSeen=new Set();lastPrice=null;selected=null;suppressClickUntil=0;render();say('Jom bina kampung baharu!');$('#taskTitle').focus({preventScroll:true});
});
render();
