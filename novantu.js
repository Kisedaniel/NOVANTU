/* ============================================================
   NOVANTU® — shared script. Every block guards on element
   presence so one file can serve all pages.
   Copyright © 2026 NOVANTU. All rights reserved. Proprietary.
   ============================================================ */
(function(){
  'use strict';
  const DEMO_EMAIL = 'novantuinfo@novantu.app';
  const $  = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));

  /* ---- toast ---- */
  let toastT;
  function showToast(msg){
    let t = $('#toast');
    if(!t){ t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), 3200);
  }
  window.showToast = showToast;

  /* ---- scroll reveal ---- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.style.opacity=1; e.target.style.transform='none'; io.unobserve(e.target); } });
  },{threshold:.12});
  $$('section .wrap > *, .page-hero .wrap > *').forEach((el,i)=>{
    if(el.classList.contains('reveal')) return;
    el.style.opacity=0; el.style.transform='translateY(16px)';
    const d = Math.min(i*0.04, 0.2);
    el.style.transition=`opacity .6s cubic-bezier(.2,.7,.2,1) ${d}s, transform .6s cubic-bezier(.2,.7,.2,1) ${d}s`;
    io.observe(el);
  });

  /* ---- count-up hero stats ---- */
  function countUp(el, to, dur=900){
    const t0 = performance.now();
    (function tick(t){
      const p = Math.min((t-t0)/dur,1), e = 1-Math.pow(1-p,3);
      el.textContent = Math.round(to*e);
      if(p<1) requestAnimationFrame(tick);
    })(performance.now());
  }
  $$('.stat-strip').forEach(strip=>{
    const nums = $$('.n', strip);
    if(nums[0] && /^\s*12/.test(nums[0].textContent)) nums[0].innerHTML = '<span class="cnt" data-to="12">0</span><span class="u">min</span>';
    if(nums[1] && /^\s*1\s*$/.test(nums[1].textContent)) nums[1].innerHTML = '<span class="cnt" data-to="1">0</span>';
  });
  const statIO = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ $$('.cnt', e.target).forEach(el=>countUp(el, Number(el.dataset.to))); statIO.unobserve(e.target); } });
  },{threshold:.4});
  $$('.stat-strip').forEach(el=>statIO.observe(el));

  /* ---- sequential reveal of mockup rows ---- */
  const mkIO = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const rows = $$('.mk-line, .mk-matrix tbody tr, .mk-bid', e.target);
      rows.forEach((r,i)=>setTimeout(()=>r.classList.add('show'), i*90));
      const total = $('.mk-total', e.target);
      if(total) setTimeout(()=>total.classList.add('show'), rows.length*90 + 150);
      mkIO.unobserve(e.target);
    });
  },{threshold:.3});
  $$('.mk').forEach(el=>mkIO.observe(el));

  /* ---- Ask Novantu cycling Q&A ---- */
  const qaHost = $('#qaDots');
  if(qaHost){
    const QA = [
      { q:'How many linear feet of R-8 flex duct does this job need?', a:'1,240 lf across both floors, sized straight from the mechanical schedule.', cite:'M-301 · SCHED 2' },
      { q:'Is the wall between kitchen and living room load-bearing?', a:'Yes — keynote 6 calls it a bearing wall. Removing it needs the beam on the structural sheet.', cite:'S-101 · NOTE 6' },
      { q:'What changed between rev A and rev B of the set?', a:'Primary bath moved 2\'-6" east, a diffuser was added, and the garage slab thickened to 5". Impact: +$1,860.', cite:'A-201 · REV B' },
    ];
    let qi=0, qt;
    function renderQA(i){
      const qEl=$('#qaQ'), aEl=$('#qaA'); if(!qEl||!aEl) return;
      qEl.classList.remove('show'); aEl.classList.remove('show');
      setTimeout(()=>{
        qEl.innerHTML = '<b>Q —</b> ' + QA[i].q;
        aEl.innerHTML = QA[i].a + '<span class="ai-qa-cite">' + QA[i].cite + '</span>';
        requestAnimationFrame(()=>{ qEl.classList.add('show'); aEl.classList.add('show'); });
      },180);
      $$('#qaDots span').forEach((d,di)=>d.classList.toggle('on', di===i));
    }
    function resetQT(){ clearInterval(qt); qt=setInterval(()=>{ qi=(qi+1)%QA.length; renderQA(qi); },5200); }
    qaHost.innerHTML = QA.map((_,i)=>`<span data-i="${i}"></span>`).join('');
    qaHost.addEventListener('click', e=>{ const s=e.target.closest('span'); if(!s) return; qi=Number(s.dataset.i); renderQA(qi); resetQT(); });
    renderQA(0); resetQT();
  }

  /* ---- pricing ---- */
  const PRICES = {
    starter:    { sub:{m:200,y:2100}, gc:{m:200,y:2100} },
    pro:        { sub:{m:250,y:2800}, gc:{m:320,y:3700} },
    enterprise: { sub:{m:350,y:4000}, gc:{m:400,y:4650} },
  };
  const PLAN_LABEL = { starter:'Standard', pro:'Pro', enterprise:'Enterprise' };
  const CHECKOUT_URL = 'https://link.payoneer.com/Token?t=E0F7E37A9D134121AADA20D6647E0B4E&src=pl';
  let pAcct='sub', pCycle='m', _coSel=null;
  const money = n => '$' + n.toLocaleString();

  window.setAcct = function(a){ pAcct=a; const s=$('#seg-sub'),g=$('#seg-gc'); if(s)s.classList.toggle('on',a==='sub'); if(g)g.classList.toggle('on',a==='gc'); updatePricing(); };
  window.setCycle = function(c){ pCycle=c; const m=$('#seg-m'),y=$('#seg-y'); if(m)m.classList.toggle('on',c==='m'); if(y)y.classList.toggle('on',c==='y'); updatePricing(); };
  function updatePricing(){
    ['starter','pro','enterprise'].forEach(id=>{
      const a=PRICES[id]&&PRICES[id][pAcct]; if(!a) return;
      const val = pCycle==='m'?a.m:a.y;
      const priceEl=$('#price-'+id), subEl=$('#sub-'+id);
      if(priceEl) priceEl.classList.add('swap'); if(subEl) subEl.classList.add('swap');
      setTimeout(()=>{
        if(priceEl){ priceEl.innerHTML = money(val)+`<span>/${pCycle==='m'?'mo':'yr'}</span>`; priceEl.classList.remove('swap'); }
        if(subEl){ subEl.textContent = pCycle==='m' ? `or ${money(a.y)}/yr billed yearly` : `≈ ${money(Math.round(a.y/12))}/mo, billed yearly`; subEl.classList.remove('swap'); }
      },140);
    });
  }
  window.openCheckout = function(planId){
    const a=PRICES[planId][pAcct], val = pCycle==='m'?a.m:a.y;
    _coSel={id:planId,acct:pAcct,cycle:pCycle,amount:val,y:a.y};
    $('#coTitle').textContent = `${PLAN_LABEL[planId]} · ${pAcct==='sub'?'Subcontractor':'General contractor'}`;
    $('#coPrice').innerHTML = money(val)+`<span>/${pCycle==='m'?'mo':'yr'}</span>`;
    $('#coCyc').textContent = pCycle==='m'?'Billed monthly · cancel anytime':`Billed annually (${money(a.y)}) · cancel anytime`;
    const echo=$('#coPlanEcho'); if(echo) echo.textContent=PLAN_LABEL[planId];
    $('#coBackdrop').classList.add('show');
  };
  window.closeCheckout = function(){ const b=$('#coBackdrop'); if(b) b.classList.remove('show'); };
  window.goCheckout = function(ev){
    if(ev) ev.preventDefault();
    if(!_coSel) return;
    if(CHECKOUT_URL){ window.open(CHECKOUT_URL,'_blank','noopener'); }
    else {
      const s=_coSel, subject=`Novantu subscription — ${PLAN_LABEL[s.id]}`;
      window.location.href = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}`;
    }
    closeCheckout(); showToast('Opening secure checkout…');
  };
  if($('#price-starter')) updatePricing();
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') window.closeCheckout(); });

  /* ---- booking slots ---- */
  const slotsHost = $('#slots');
  if(slotsHost){
    const TIMES=['9:00 AM','11:00 AM','1:30 PM','3:30 PM'];
    let selected=null;
    const days=(()=>{ const out=[],d=new Date(); const u=((8-d.getDay())%7)||7; d.setDate(d.getDate()+u); for(let i=0;i<5;i++){const x=new Date(d);x.setDate(d.getDate()+i);out.push(x);} return out; })();
    const fday=d=>d.toLocaleDateString('en-US',{weekday:'long'});
    const fdate=d=>d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    slotsHost.innerHTML = days.map(d=>`<div class="day-block"><div class="day-label">${fday(d)} <span class="dl-date">${fdate(d)}</span></div><div class="slot-row">${TIMES.map(t=>`<button class="slot" data-day="${fday(d)}" data-date="${fdate(d)}" data-time="${t}">${t}</button>`).join('')}</div></div>`).join('');
    slotsHost.addEventListener('click', e=>{
      const s=e.target.closest('.slot'); if(!s) return;
      $$('.slot.sel').forEach(x=>x.classList.remove('sel')); s.classList.add('sel');
      selected={day:s.dataset.day,date:s.dataset.date,time:s.dataset.time};
      $('#chosen').textContent = `${selected.day}, ${selected.date} · ${selected.time}`;
    });
    window.requestSlot = function(){
      if(!selected){ showToast('Pick a day and time first'); return; }
      const subject=`Novantu demo request (${selected.day} ${selected.date}, ${selected.time})`;
      const body=`Hi Novantu team,\n\nI'd like to book a 20-minute demo.\n\nRequested time: ${selected.day}, ${selected.date} at ${selected.time}\n\nCompany:\nContact name:\nPhone:\nBest email:\n\n(Sent from the Novantu site.)`;
      window.location.href=`mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showToast('Opening your email to confirm the time…');
    };
  }

  /* ============================================================
     CUSTOMIZATION PLAYGROUND
     ============================================================ */
  const app = $('#demoApp');
  if(app){
    const ACCENTS = [
      {id:'plano', name:'Plano red',   c:'#c44a2c', bg:'#f7e8e2'},
      {id:'linea', name:'Blueprint',   c:'#2f5d8a', bg:'#e4ecf3'},
      {id:'verde', name:'Field green', c:'#3d6e4a', bg:'#e6efe7'},
      {id:'amber', name:'Safety amber',c:'#c8780f', bg:'#f6ecd9'},
      {id:'plum',  name:'Deep plum',   c:'#7b3f6b', bg:'#f1e6ef'},
      {id:'slate', name:'Graphite',    c:'#3a352d', bg:'#e9e4d9'},
    ];
    const FONTS = [
      {id:'geist', name:'Geist',        tag:'Modern sans',  stack:"'Geist',system-ui,sans-serif"},
      {id:'grotesk',name:'Space Grotesk',tag:'Geometric',   stack:"'Space Grotesk',system-ui,sans-serif"},
      {id:'fraunces',name:'Fraunces',   tag:'Elegant serif',stack:"'Fraunces',Georgia,serif"},
      {id:'plex',  name:'IBM Plex Sans',tag:'Corporate',    stack:"'IBM Plex Sans',system-ui,sans-serif"},
    ];
    const PRESETS = {
      hvac:{ name:'Airline Mechanical', trade:'HVAC', crumb:'Projects · Vista Del Mar', rows:[
        ['Air handler · 3.5 ton ×2','$8,320','ahu-35'],
        ['Heat-pump condenser ×3','$16,380','hp-cond'],
        ['R-8 flex duct · 600 lf','$11,340','duct-r8'],
        ['Linear diffuser boxes ×32','$12,264','diff-lin'],
      ], total:'$148,400' },
      concrete:{ name:'Foundation Pros', trade:'Concrete', crumb:'Projects · Lot 14 Residence', rows:[
        ['Footings · 42 cy','$9,660','ftg-42'],
        ['Slab on grade · 3,100 sf','$21,700','slab-sog'],
        ['Stem walls · 180 lf','$14,220','stem-180'],
        ['Rebar #4/#5 · 6.2 tons','$11,780','rebar-62'],
      ], total:'$187,300' },
      tile:{ name:'Stone & Tile Co.', trade:'Tile & Stone', crumb:'Projects · Casa Mendoza', rows:[
        ['Kitchen floor · 184 sf','$4,232','tile-kf'],
        ['Backsplash · 32 sf','$1,088','tile-bs'],
        ['Primary bath walls · 220 sf','$6,600','tile-pbw'],
        ['Waterproofing membrane','$2,940','wp-mem'],
      ], total:'$38,940' },
      glazing:{ name:'Clearview Glazing', trade:'Glazing', crumb:'Projects · 807 6th Ave', rows:[
        ['Storefront · 48 lf','$28,800','sf-48'],
        ['Sliding doors · 3 units','$19,500','sd-3'],
        ['Fixed windows ×14','$22,400','fw-14'],
        ['Tempered glass railing','$9,750','rail-tg'],
      ], total:'$132,600' },
    };

    // build swatches
    const swHost = $('#pgSwatches');
    swHost.innerHTML = ACCENTS.map((a,i)=>`<div class="pg-sw${i===0?' on':''}" data-i="${i}" style="background:${a.c}" title="${a.name}"></div>`).join('');
    // build fonts
    const fnHost = $('#pgFonts');
    fnHost.innerHTML = FONTS.map((f,i)=>`<div class="pg-font${i===0?' on':''}" data-i="${i}" style="font-family:${f.stack}">${f.name}<span class="fn-tag">${f.tag}</span></div>`).join('');
    // build presets
    const psHost = $('#pgPresets');
    const psKeys = Object.keys(PRESETS);
    psHost.innerHTML = psKeys.map((k,i)=>`<div class="pg-preset${i===0?' on':''}" data-k="${k}">${PRESETS[k].trade}</div>`).join('');

    let state = { name:'', accent:0, font:0, preset:'hvac' };

    function applyName(){
      const nm = state.name.trim() || PRESETS[state.preset].name;
      $$('.demo-name', app).forEach(el=>el.textContent = nm);
      const chip = $('#demoChip'); if(chip) chip.textContent = (nm[0]||'N').toUpperCase();
    }
    function applyAccent(flash){
      const a = ACCENTS[state.accent];
      app.style.setProperty('--demo-accent', a.c);
      app.style.setProperty('--demo-accent-bg', a.bg);
      if(flash){ app.classList.remove('demo-flash'); void app.offsetWidth; app.classList.add('demo-flash'); }
    }
    function applyFont(){ app.style.setProperty('--demo-font', FONTS[state.font].stack); }
    function applyPreset(){
      const p = PRESETS[state.preset];
      const crumb=$('#demoCrumb'); if(crumb) crumb.textContent = p.crumb;
      const trade=$('#demoTrade'); if(trade) trade.textContent = p.trade + ' · Estimate';
      const badge=$('#demoBadge'); if(badge) badge.textContent = p.trade;
      const rowsHost=$('#demoRows');
      if(rowsHost) rowsHost.innerHTML = p.rows.map(r=>`<div class="demo-row"><span>${r[0]}<span class="pc">cost code · ${r[2]}</span></span><b>${r[1]}</b></div>`).join('');
      const tot=$('#demoTotal'); if(tot) tot.textContent = p.total;
      applyName();
    }

    swHost.addEventListener('click', e=>{ const s=e.target.closest('.pg-sw'); if(!s) return; state.accent=Number(s.dataset.i); $$('.pg-sw',swHost).forEach(x=>x.classList.remove('on')); s.classList.add('on'); applyAccent(true); });
    fnHost.addEventListener('click', e=>{ const f=e.target.closest('.pg-font'); if(!f) return; state.font=Number(f.dataset.i); $$('.pg-font',fnHost).forEach(x=>x.classList.remove('on')); f.classList.add('on'); applyFont(); });
    psHost.addEventListener('click', e=>{ const p=e.target.closest('.pg-preset'); if(!p) return; state.preset=p.dataset.k; $$('.pg-preset',psHost).forEach(x=>x.classList.remove('on')); p.classList.add('on'); const inp=$('#pgName'); if(inp && !inp.value.trim()) inp.placeholder=PRESETS[state.preset].name; applyPreset(); applyAccent(true); });
    const nameInp = $('#pgName');
    if(nameInp){ nameInp.addEventListener('input', ()=>{ state.name=nameInp.value; applyName(); }); nameInp.placeholder = PRESETS.hvac.name; }

    const rnd = $('#pgRandom');
    if(rnd) rnd.addEventListener('click', ()=>{
      state.accent = Math.floor(Math.random()*ACCENTS.length);
      state.font = Math.floor(Math.random()*FONTS.length);
      state.preset = psKeys[Math.floor(Math.random()*psKeys.length)];
      $$('.pg-sw',swHost).forEach((x,i)=>x.classList.toggle('on',i===state.accent));
      $$('.pg-font',fnHost).forEach((x,i)=>x.classList.toggle('on',i===state.font));
      $$('.pg-preset',psHost).forEach(x=>x.classList.toggle('on',x.dataset.k===state.preset));
      if(nameInp && !nameInp.value.trim()) nameInp.placeholder=PRESETS[state.preset].name;
      applyPreset(); applyFont(); applyAccent(true);
      showToast('Theme shuffled — every combination ships.');
    });

    // init
    applyPreset(); applyFont(); applyAccent(false);
  }
})();
