
  // Tabs
  document.querySelectorAll('.tabbtn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tabbtn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.faqgroup').forEach(g=>g.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
    });
  });

  // Accordion
  document.querySelectorAll('.accordion-q').forEach(q=>{
    q.addEventListener('click',()=>{
      q.parentElement.classList.toggle('open');
    });
  });

  // Read-aloud button + feedback on every FAQ answer
  document.querySelectorAll('.accordion-a').forEach((ans, idx)=>{
    const originalText = ans.textContent.trim(); // capture BEFORE adding buttons below, so we don't read button labels aloud

    const btn = document.createElement('button');
    btn.className = 'faq-listen-btn';
    btn.textContent = '🔊 Listen to this answer';
    btn.setAttribute('aria-label', 'Read this answer aloud');
    btn.onclick = (e)=>{
      e.stopPropagation();
      readAloudGeneric(originalText, btn);
    };
    ans.appendChild(btn);

    const faqId = 'faq_' + idx;
    const feedback = document.createElement('div');
    feedback.className = 'faq-feedback';
    feedback.innerHTML =
      '<span class="faq-feedback-label">Was this helpful?</span>' +
      '<button class="faq-fb-btn" data-vote="up" aria-label="Yes, this was helpful">👍</button>' +
      '<button class="faq-fb-btn" data-vote="down" aria-label="No, this was not helpful">👎</button>' +
      '<span class="faq-fb-thanks" style="display:none;">Thanks for letting us know!</span>';
    ans.appendChild(feedback);

    feedback.querySelectorAll('.faq-fb-btn').forEach(fbBtn=>{
      fbBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const vote = fbBtn.dataset.vote;
        try{
          const key = 'ss_faq_feedback';
          const all = JSON.parse(localStorage.getItem(key) || '{}');
          all[faqId] = vote;
          localStorage.setItem(key, JSON.stringify(all));
        }catch(err){}
        feedback.querySelectorAll('.faq-fb-btn').forEach(b=> b.disabled = true);
        feedback.querySelector('.faq-fb-thanks').style.display = 'inline';
      });
    });
  });

  function readAloudGeneric(text, btn){
    if(!window.speechSynthesis){ return; }
    if(window.speechSynthesis.speaking){
      window.speechSynthesis.cancel();
      btn.textContent = '🔊 Listen to this answer';
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    try{
      const lang = typeof detectReplyLang === 'function' ? detectReplyLang(text) : 'en-IN';
      const gender = typeof preferredGender !== 'undefined' ? preferredGender : 'female';
      const voice = typeof pickVoiceForLang === 'function' ? pickVoiceForLang(lang, gender) : null;
      if(voice){ u.voice = voice; u.lang = voice.lang; } else { u.lang = lang; }
    }catch(e){ u.lang = 'en-IN'; }
    u.rate = 0.96;
    btn.textContent = '⏸️ Stop';
    u.onend = ()=>{ btn.textContent = '🔊 Listen to this answer'; };
    window.speechSynthesis.speak(u);
  }

  // Doctor finder
  function findDoctor(){
    const city = document.getElementById('cityInput').value.trim();
    if(!city){ alert('Please type your city or area first.'); return; }
    const url = 'https://www.google.com/maps/search/' + encodeURIComponent('gynecologist near ' + city);
    window.open(url, '_blank');
  }
  function quickFind(city){
    document.getElementById('cityInput').value = city;
    findDoctor();
  }
  function useMyLocation(){
    if(!navigator.geolocation){ alert('Location is not supported on this device/browser.'); return; }
    navigator.geolocation.getCurrentPosition(pos=>{
      const url = 'https://www.google.com/maps/search/gynecologist+near+me/@'+pos.coords.latitude+','+pos.coords.longitude+',14z';
      window.open(url, '_blank');
    }, ()=>{
      alert('Could not access your location. Please type your city instead.');
    });
  }

  /* ---------- TOOL TABS ---------- */
  document.querySelectorAll('.toolbtn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.toolbtn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.toolpanel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tool-'+btn.dataset.tool).classList.add('active');
    });
  });

  /* ---------- CYCLE TRACKER ---------- */
  function getCycleHistory(){
    try{ return JSON.parse(localStorage.getItem('ss_cycles')||'[]'); }catch(e){ return []; }
  }
  function logCycle(){
    const dateVal = document.getElementById('cycleDate').value;
    const len = parseInt(document.getElementById('cycleLen').value)||28;
    if(!dateVal){ alert('Please pick the first day of your last period.'); return; }
    let hist = getCycleHistory();
    hist.push({date:dateVal, len:len});
    hist = hist.slice(-6);
    localStorage.setItem('ss_cycles', JSON.stringify(hist));
    renderCycle();
  }
  function clearCycle(){
    localStorage.removeItem('ss_cycles');
    document.getElementById('cycleResult').classList.remove('show');
    document.getElementById('cycleHistory').innerHTML='';
  }
  function renderCycle(){
    const hist = getCycleHistory();
    if(hist.length===0) return;
    const last = hist[hist.length-1];
    const start = new Date(last.date+'T00:00:00');
    const next = new Date(start); next.setDate(next.getDate()+last.len);
    const ovulation = new Date(next); ovulation.setDate(ovulation.getDate()-14);
    const fertileStart = new Date(ovulation); fertileStart.setDate(fertileStart.getDate()-5);
    const fmt = d => d.toLocaleDateString('en-IN',{day:'numeric',month:'long'});
    document.getElementById('cycleResult').innerHTML =
      '<strong>Next period expected around '+fmt(next)+'</strong><br>'+
      'Estimated fertile window: '+fmt(fertileStart)+' – '+fmt(ovulation)+'<br>'+
      '<span style="font-size:.8rem;">(based on a '+last.len+'-day cycle)</span>';
    document.getElementById('cycleResult').classList.add('show');
    document.getElementById('cycleHistory').innerHTML =
      '<strong style="color:var(--maroon-deep);">Recent logs:</strong> '+
      hist.map(h=>new Date(h.date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})).join(' · ');
    window.lastCycleInfo = { cycleLen:last.len, nextPeriod:fmt(next), fertileWindow:fmt(fertileStart)+' to '+fmt(ovulation) };
  }
  if (document.getElementById('cycleResult')) renderCycle();

  // Shared helper for the AI proxy. Show a useful error when its model or
  // credentials fail, without sending a second billable request automatically.
  async function askSakhiAIRaw(context, saveForReview=false){
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 25000);
    try{
      const res = await fetch(SAKHI_AI_ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ system: SAKHI_SYSTEM_PROMPT, message: context,
          saveForReview, adultConfirmed: saveForReview }),
        signal: controller.signal
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail || data.error || 'Service unavailable');
      if(typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Empty AI response');
      if(saveForReview){
        const status = document.getElementById('saveQuestionStatus');
        if(data.savedId && data.deleteCode){
          try{
            const receipts = JSON.parse(localStorage.getItem('ss_saved_receipts') || '[]');
            receipts.push({id:data.savedId, deleteCode:data.deleteCode});
            localStorage.setItem('ss_saved_receipts', JSON.stringify(receipts));
            if(status) status.textContent = 'Question saved for up to 30 days. You can delete it below.';
          }catch(e){
            if(status) status.textContent = 'Question saved, but this browser could not keep its deletion receipt.';
          }
        }else if(status){ status.textContent = data.saveError || 'Question was not saved.'; }
      }
      return data.reply.trim();
    }finally{
      clearTimeout(timeout);
    }
  }

  async function getCycleAIInsight(){
    const resultEl = document.getElementById('cycleAIResult');
    const dateVal = document.getElementById('cycleDate').value;
    const age = document.getElementById('cycleAge').value;
    const height = document.getElementById('cycleHeight').value;
    const weight = document.getElementById('cycleWeight').value;
    const cycleLen = parseInt(document.getElementById('cycleLen').value) || 28;

    if(!dateVal){
      alert('Please enter the first day of your most recent period above first — Sakhi AI needs that to give a real answer.');
      return;
    }

    // Compute fresh, directly from what's in the fields right now — doesn't
    // depend on whether "Save & predict" was clicked first.
    const start = new Date(dateVal+'T00:00:00');
    const next = new Date(start); next.setDate(next.getDate()+cycleLen);
    const ovulation = new Date(next); ovulation.setDate(ovulation.getDate()-14);
    const fertileStart = new Date(ovulation); fertileStart.setDate(fertileStart.getDate()-5);
    const fmt = d => d.toLocaleDateString('en-IN',{day:'numeric',month:'long'});

    let context = `My last period started on ${fmt(start)}. My usual cycle length is ${cycleLen} days, so my next period is expected around ${fmt(next)}, with an estimated fertile window of ${fmt(fertileStart)} to ${fmt(ovulation)}.`;
    if(age) context += ` I am ${age} years old.`;
    if(height) context += ` My height is ${height} cm.`;
    if(weight) context += ` My current weight is ${weight} kg.`;
    context += ` Based on this real data, give me a short, warm, personalized note about my cycle — reference the actual dates above, add one encouraging line, one gentle lifestyle tip, and mention if these numbers suggest anything worth asking a doctor about (e.g. a very irregular cycle length, or an age/height/weight combination that could relate to PCOD risk) — but do NOT diagnose anything.`;

    resultEl.innerHTML = '<div class="ai-loading"><span></span><span></span><span></span></div>';
    resultEl.classList.add('show');
    try{
      resultEl.textContent = await askSakhiAIRaw(context);
    }catch(err){
      resultEl.textContent = "Sakhi AI isn't reachable right now — please try again in a moment, or ask in the Ask Sakhi AI section above.";
    }
  }

  /* ---------- PREGNANCY WEEK TRACKER ---------- */
  const babySizes = [
    {w:4,size:'a poppy seed'},{w:6,size:'a lentil'},{w:8,size:'a raspberry'},
    {w:10,size:'a strawberry'},{w:12,size:'a lime'},{w:14,size:'a lemon'},
    {w:16,size:'an avocado'},{w:18,size:'a bell pepper'},{w:20,size:'a banana'},
    {w:22,size:'a papaya'},{w:24,size:'an ear of corn'},{w:26,size:'a cabbage'},
    {w:28,size:'an eggplant'},{w:30,size:'a large cabbage'},{w:32,size:'a coconut'},
    {w:34,size:'a cantaloupe'},{w:36,size:'a papaya-large'},{w:38,size:'a small pumpkin'},
    {w:40,size:'a small watermelon'}
  ];
  function calcPregWeek(){
    const lmp = document.getElementById('lmpDate').value;
    if(!lmp){ alert('Please enter the first day of your last period.'); return; }
    const start = new Date(lmp+'T00:00:00');
    const today = new Date();
    const diffDays = Math.floor((today-start)/(1000*60*60*24));
    const week = Math.floor(diffDays/7);
    if(week<0 || week>44){
      document.getElementById('pregWeekResult').innerHTML = 'That date seems out of range — please double check it.';
      document.getElementById('pregWeekResult').classList.add('show');
      return;
    }
    let closest = babySizes[0];
    for(const b of babySizes){ if(week>=b.w) closest=b; }
    const trimester = week<13?'First':week<27?'Second':'Third';
    document.getElementById('pregWeekResult').innerHTML =
      '<strong>You are approximately '+week+' weeks pregnant</strong><br>'+
      'Your baby is roughly the size of '+closest.size+' right now.<br>'+
      '<span style="font-size:.8rem;">Trimester: '+trimester+'</span>';
    document.getElementById('pregWeekResult').classList.add('show');
    window.lastPregWeekInfo = { week, trimester, babySize: closest.size };
  }

  async function getPregAIInsight(){
    const resultEl = document.getElementById('pregAIResult');
    const lmp = document.getElementById('lmpDate').value;
    const age = document.getElementById('pregAge').value;
    const height = document.getElementById('pregHeight').value;
    const weight = document.getElementById('pregWeight').value;

    if(!lmp){
      alert('Please enter the first day of your last period above first — Sakhi AI needs that to know which week you\'re in.');
      return;
    }

    const start = new Date(lmp+'T00:00:00');
    const today = new Date();
    const diffDays = Math.floor((today-start)/(1000*60*60*24));
    const week = Math.floor(diffDays/7);
    let closest = babySizes[0];
    for(const b of babySizes){ if(week>=b.w) closest=b; }
    const trimester = week<13?'First':week<27?'Second':'Third';

    let context = `I am approximately ${week} weeks pregnant (${trimester} trimester), baby is about the size of ${closest.size}.`;
    if(age) context += ` I am ${age} years old.`;
    if(height) context += ` My height is ${height} cm.`;
    if(weight) context += ` My current weight is ${weight} kg.`;
    context += ` Based on this real data, give me a short, warm, personalized note for this exact stage of pregnancy — reference the week number, add general encouragement, one relevant tip for this week (movement, food, or rest), and if my height/weight/age combination is worth mentioning to my doctor at my next visit (like healthy weight gain ranges), say so gently — but do NOT diagnose anything or give exact medical targets.`;

    resultEl.innerHTML = '<div class="ai-loading"><span></span><span></span><span></span></div>';
    resultEl.classList.add('show');
    try{
      resultEl.textContent = await askSakhiAIRaw(context);
    }catch(err){
      resultEl.textContent = "Sakhi AI isn't reachable right now — please try again in a moment, or ask in the Ask Sakhi AI section above.";
    }
  }

  /* ---------- DUE DATE CALCULATOR ---------- */
  function calcDueDate(){
    const lmp = document.getElementById('lmpDate2').value;
    if(!lmp){ alert('Please enter the first day of your last period.'); return; }
    const start = new Date(lmp+'T00:00:00');
    const due = new Date(start); due.setDate(due.getDate()+280);
    document.getElementById('dueDateResult').innerHTML =
      '<strong>Estimated due date: '+due.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})+'</strong><br>'+
      '<span style="font-size:.8rem;">Most babies arrive within 2 weeks either side of this date.</span>';
    document.getElementById('dueDateResult').classList.add('show');
  }

  /* ---------- SYMPTOM CHECKER ---------- */
  function checkSymptoms(){
    const boxes = document.querySelectorAll('#symptomList input[type="checkbox"]');
    let urgent=0, common=0;
    boxes.forEach(b=>{ if(b.checked){ if(b.dataset.level==='urgent') urgent++; else common++; } });
    const el = document.getElementById('symptomResult');
    if(urgent>0){
      el.innerHTML = '<strong style="color:#7a3038;">Please call a doctor now</strong><br>One or more of what you selected needs prompt medical attention — this is not something to wait out. Use the helplines in the footer or the 💬 button on this page.';
    } else if(common>0){
      el.innerHTML = '<strong>This sounds within the range of common symptoms</strong><br>Keep an eye on it, rest, and stay hydrated. If anything changes or worsens, don\'t hesitate to check with a doctor anyway — trust your own sense of your body.';
    } else {
      el.innerHTML = 'Tick anything you\'re feeling above, then check again.';
    }
    el.classList.add('show');
  }

  /* ---------- KICK COUNTER ---------- */
  let kickCount=0, kickStart=null, kickTimerInt=null;
  function addKick(){
    if(!kickStart){ kickStart=Date.now(); kickTimerInt=setInterval(updateKickTimer,1000); }
    kickCount++;
    document.getElementById('kickCount').textContent = kickCount;
    if(kickCount===10){
      document.getElementById('kickResult').innerHTML = '<strong>10 movements logged.</strong><br>If movement feels reduced or different from usual, contact your maternity team promptly.';
      document.getElementById('kickResult').classList.add('show');
    }
  }
  function updateKickTimer(){
    const secs = Math.floor((Date.now()-kickStart)/1000);
    const m = Math.floor(secs/60), s = secs%60;
    document.getElementById('kickTime').textContent = m+':'+(s<10?'0':'')+s;
    if(secs >= 7200 && kickCount<10){
      document.getElementById('kickResult').innerHTML = '<strong style="color:#7a3038;">Fewer than 10 kicks in 2 hours</strong><br>Please contact your doctor to check on baby.';
      document.getElementById('kickResult').classList.add('show');
    }
  }
  function resetKicks(){
    kickCount=0; kickStart=null; clearInterval(kickTimerInt);
    document.getElementById('kickCount').textContent='0';
    document.getElementById('kickTime').textContent='0:00';
    document.getElementById('kickResult').classList.remove('show');
  }

  /* ---------- FLOATING MENU ---------- */
  function toggleFloatMenu(){
    document.getElementById('floatMenu').classList.toggle('show');
  }

  /* ---------- DARK MODE ---------- */
  function applyTheme(theme){
    if(theme === 'dark'){
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('themeToggle').textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.getElementById('themeToggle').textContent = '🌙';
    }
  }
  /* ---------- MOBILE HAMBURGER MENU ---------- */
  function toggleMobileNav(){
    document.getElementById('hamburgerBtn').classList.toggle('open');
    document.getElementById('navlinksRow').classList.toggle('open');
    document.getElementById('hamburgerBtn').setAttribute('aria-expanded', document.getElementById('navlinksRow').classList.contains('open'));
  }
  document.querySelectorAll('.navlinks a').forEach(link=>{
    link.addEventListener('click', ()=>{
      document.getElementById('hamburgerBtn').classList.remove('open');
      document.getElementById('navlinksRow').classList.remove('open');
      document.getElementById('hamburgerBtn').setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- TIP OF THE DAY ---------- */
  const DAILY_TIPS = [
    "Track your cycle for 2-3 months before assuming something is 'wrong' — a little variation month to month is completely normal.",
    "Iron-rich foods like spinach, dates, and jaggery genuinely help replace what periods take out of your body.",
    "A warm water bottle on your lower belly works as well as most people expect a painkiller to.",
    "PCOD is manageable, not permanent — small consistent changes in movement and food make a real difference over months.",
    "During pregnancy, two short walks a day are usually easier on your body than one long one.",
    "You don't need to justify resting extra during your period — your body is doing real work.",
    "Emergency contraception works best the sooner it's taken — don't wait if you think you need it.",
    "A missed period isn't automatically a pregnancy — stress, travel, and illness can delay it too.",
    "Folic acid before and during early pregnancy is one of the simplest, most protective things you can take.",
    "It's okay to cry, feel irritated, or want to be alone during your period — that's hormonal, not dramatic.",
    "A C-section is not a lesser way to give birth — both paths bring your baby into the world just as validly.",
    "If period pain stops you from standing up most months, that's worth mentioning to a doctor, not just enduring.",
    "Drinking warm ajwain or ginger water can genuinely ease cramps, not just as a placebo.",
    "Baby movements becoming less frequent after 28 weeks is always worth a same-day call to your doctor.",
    "You are allowed to ask your doctor to explain things again if you didn't understand the first time.",
  ];
  /* ---------- PWA: SERVICE WORKER REGISTRATION ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        // Silently ignore — the site works fine without offline support, this is a bonus
      });
    });
  }

  (function showTipOfDay(){
    const el = document.getElementById('tipOfDayText');
    if(!el) return;
    const dayIndex = Math.floor(Date.now() / 86400000); // changes once per calendar day
    const tip = DAILY_TIPS[dayIndex % DAILY_TIPS.length];
    el.textContent = tip;
  })();

  /* ---------- TEXT SIZE (ACCESSIBILITY) ---------- */
  function toggleTextSize(){
    const isLarge = document.documentElement.classList.toggle('text-large');
    try{ localStorage.setItem('ss_text_large', isLarge ? '1' : '0'); }catch(e){}
  }
  (function initTextSize(){
    let saved = '0';
    try{ saved = localStorage.getItem('ss_text_large') || '0'; }catch(e){}
    if(saved === '1') document.documentElement.classList.add('text-large');
  })();

  function toggleTheme(){
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    try{ localStorage.setItem('ss_theme', next); }catch(e){}
  }
  (function initTheme(){
    let saved = null;
    try{ saved = localStorage.getItem('ss_theme'); }catch(e){}
    if(saved){
      applyTheme(saved);
    } else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  })();

  /* ---------- ASK SAKHI AI (VOICE) ---------- */
  /*
    HOW THIS WORKS
    1. The browser's own Speech Recognition turns her voice into text (no API needed for this part).
    2. That text is sent to our proxy, which holds the AI service key server-side.
       Never put the key in this file; anyone can view the page source.
    3. The reply text comes back and the browser's own Speech Synthesis reads it aloud (no API needed for this part either).

    TODO before going live:
    - Deploy the companion proxy and route /api/sakhi-ai to it.
  */
  const SAKHI_AI_ENDPOINT = '/api/sakhi-ai';

  const SAKHI_SYSTEM_PROMPT = `You are Sakhi, a warm, non-judgemental friend inside the Shree Sakhi platform for girls and women in India, on topics like periods, PCOD/PCOS, pregnancy, and general wellbeing.
Rules you always follow:
- ALWAYS reply in the exact same language the person used to ask their question — if she asks in Hindi, reply fully in Hindi; if in Gujarati, reply fully in Gujarati; if in English, reply in English; if she mixes languages (Hinglish etc.), match that natural mixed style. Never switch her to a different language than the one she used.
- Speak simply and warmly, like a caring elder sister — short sentences, no jargon, 3-5 sentences max since this will be read aloud.
- You are not a doctor. Never diagnose. Never give specific medicine names, dosages, or prescriptions.
- For anything that sounds urgent or severe (heavy bleeding, severe pain, pregnancy complications, thoughts of self-harm), gently but clearly tell her to contact a doctor or one of the platform's helplines right away, instead of only relying on you.
- Never assume she is an adult; if her question suggests she may be a minor, keep the answer extra gentle, age-appropriate, and encourage she also talks to a trusted adult or doctor.
- If she seems distressed, be comforting first, information second.
- Keep every answer short enough to comfortably read aloud in under 30 seconds.`;

  let recognition = null;
  let isListening = false;
  let replyTexts = {}; // bubbleId -> text, for replay
  let speechLang = 'en-IN'; // language the mic listens for

  function isIOS(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
  }

  function chooseSpeechLang(lang){
    speechLang = lang;
    document.querySelectorAll('#speechLangPicker .vp-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.slang === lang);
    });
    // Rebuild recognition with the new language next time it's used
    recognition = null;
    try{ localStorage.setItem('ss_speech_lang', lang); }catch(e){}
  }

  (function initSpeechLang(){
    let saved = 'en-IN';
    try{ saved = localStorage.getItem('ss_speech_lang') || 'en-IN'; }catch(e){}
    speechLang = saved;
    document.querySelectorAll('#speechLangPicker .vp-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.slang === saved);
    });
  })();

  function setupRecognition(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ return null; }
    const r = new SR();
    r.lang = speechLang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e)=>{
      const text = e.results[0][0].transcript;
      addBubble('user', text);
      askSakhiAI(text);
    };
    r.onerror = (e)=>{
      setListeningUI(false);
      let msg = 'ready to listen';
      if(e.error === 'not-allowed' || e.error === 'permission-denied'){
        addBubble('ai', "I can't hear you — microphone access seems to be blocked. Check your browser's site settings and allow microphone access for this page, then try again.");
      } else if(e.error === 'no-speech'){
        msg = "didn't catch that — tap to try again";
      } else if(e.error === 'network'){
        addBubble('ai', "Voice recognition needs an internet connection — please check yours and try again, or type your question instead.");
      }
      setLiveStatus('ready', msg);
    };
    r.onend = ()=>{ setListeningUI(false); };
    return r;
  }

  function setLiveStatus(state, label){
    const el = document.getElementById('vwLiveStatus');
    el.className = state; // 'ready' | 'listening' | 'thinking' | 'speaking'
    el.innerHTML = '<span class="vw-dot"></span> ' + label;
  }

  function setListeningUI(listening){
    isListening = listening;
    document.getElementById('micBtn').classList.toggle('listening', listening);
    document.getElementById('micRing').classList.toggle('pulsing', listening);
    document.getElementById('micRing2').classList.toggle('pulsing', listening);
    document.getElementById('waveBars').classList.toggle('active', listening);
    setLiveStatus(listening ? 'listening' : 'ready', listening ? 'listening...' : 'ready to listen');
  }

  function toggleListening(){
    if(!recognition) recognition = setupRecognition();
    if(!recognition){
      const msg = isIOS()
        ? "Voice input isn't supported on iPhone/iPad browsers yet (this is an Apple limitation, not this site) — please type your question below instead, it works exactly the same way."
        : "Voice input isn't supported in this browser — please try Chrome on Android, or type your question below instead.";
      addBubble('ai', msg);
      document.getElementById('typedQuestion').focus();
      return;
    }
    if(isListening){ recognition.stop(); return; }
    window.speechSynthesis && window.speechSynthesis.cancel();
    try{
      setListeningUI(true);
      recognition.start();
    }catch(err){
      setListeningUI(false);
      addBubble('ai', "Couldn't start listening — please check microphone permissions for this site, or type your question below instead.");
    }
  }

  // Let her know upfront on unsupported browsers, rather than only after tapping the mic
  (function checkVoiceSupportOnLoad(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){
      const micBtn = document.getElementById('micBtn');
      if(micBtn){
        micBtn.style.opacity = '0.5';
        micBtn.title = isIOS()
          ? 'Voice input is not supported on iPhone/iPad — please type your question instead'
          : 'Voice input is not supported in this browser — please type your question instead';
      }
    }
  })();

  function askTyped(){
    const val = document.getElementById('typedQuestion').value.trim();
    if(!val) return;
    addBubble('user', val);
    document.getElementById('typedQuestion').value = '';
    askSakhiAI(val);
  }

  function hideEmptyState(){
    const empty = document.getElementById('vwEmpty');
    if(empty) empty.style.display = 'none';
  }

  function addBubble(role, text){
    hideEmptyState();
    const thread = document.getElementById('vwThread');
    const bubble = document.createElement('div');
    const id = 'b' + Date.now() + Math.floor(Math.random()*1000);
    bubble.id = id;
    bubble.className = 'vw-bubble ' + (role==='user' ? 'user' : 'ai');
    if(role==='user'){
      bubble.textContent = text;
    } else if(role==='thinking'){
      bubble.innerHTML = '<div class="vw-typing"><span></span><span></span><span></span></div>';
    } else {
      bubble.innerHTML = escapeHtml(text) + '<br><button class="vw-replay" onclick="replaySpeech(\''+id+'\')">🔊 Replay</button>';
      replyTexts[id] = text;
    }
    thread.appendChild(bubble);
    thread.scrollTop = thread.scrollHeight;
    return id;
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  async function askSakhiAI(userText){
    setLiveStatus('thinking', 'thinking...');
    const thinkingId = addBubble('thinking', '');
    try{
      const reply = await askSakhiAIRaw(userText, document.getElementById('saveQuestionConsent')?.checked === true);
      document.getElementById(thinkingId).remove();
      const bubbleId = addBubble('ai', reply);
      speak(reply, bubbleId);
    }catch(err){
      document.getElementById(thinkingId).remove();
      console.error('Sakhi AI request failed:', err);
      const msg = err.name === 'AbortError'
        ? 'Sakhi AI took too long to reply. Please try again shortly.'
        : 'Sakhi AI is unavailable right now. Please try again later, or use the FAQs and helplines.';
      addBubble('ai', msg);
      setLiveStatus('ready', 'ready to listen');
    }
  }

  async function deleteSavedQuestions(){
    const status = document.getElementById('saveQuestionStatus');
    let receipts;
    try{ receipts = JSON.parse(localStorage.getItem('ss_saved_receipts') || '[]'); }
    catch(e){ receipts = []; }
    if(!receipts.length){ status.textContent = 'No saved-question receipts on this device.'; return; }
    const remaining = [];
    for(const receipt of receipts){
      try{
        const res = await fetch(SAKHI_AI_ENDPOINT, {method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(receipt)});
        if(!res.ok) remaining.push(receipt);
      }catch(e){ remaining.push(receipt); }
    }
    localStorage.setItem('ss_saved_receipts', JSON.stringify(remaining));
    status.textContent = remaining.length ? 'Some questions could not be deleted. Please retry.' : 'Saved questions from this device have been deleted.';
  }

  /* ---------- VOICE SELECTION (better-than-default TTS) ---------- */
  let availableVoices = [];
  let preferredGender = 'female';
  let selectedVoice = null;

  // Names commonly used by higher-quality browser/OS voices, by likely gender.
  // Browsers vary a lot here, so we search by keyword rather than an exact match.
  const FEMALE_HINTS = ['female','zira','samantha','victoria','karen','moira','tessa','fiona','susan','heera','veena','priya','google us english','google uk english female','aria','jenny','neerja','swara'];
  const MALE_HINTS = ['male','david','mark','daniel','fred','alex','tom','james','ravi','guy','george','ryan','christopher','google uk english male'];

  function loadVoices(){
    return new Promise(resolve=>{
      let voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      if(voices.length){ resolve(voices); return; }
      if(window.speechSynthesis){
        window.speechSynthesis.onvoiceschanged = ()=> resolve(window.speechSynthesis.getVoices());
        // Fallback in case the event never fires on some browsers
        setTimeout(()=> resolve(window.speechSynthesis.getVoices()), 800);
      } else {
        resolve([]);
      }
    });
  }

  function scoreVoice(voice, hints){
    const name = voice.name.toLowerCase();
    let score = 0;
    if(hints.some(h => name.includes(h))) score += 10;
    if(voice.lang && voice.lang.toLowerCase().startsWith('en-in')) score += 4; // prefer Indian English if it matches gender
    if(voice.lang && voice.lang.toLowerCase().startsWith('en')) score += 2;
    if(name.includes('natural') || name.includes('neural') || name.includes('online')) score += 5; // modern high-quality voices
    if(name.includes('google')) score += 3;
    return score;
  }

  function pickBestVoice(gender){
    if(!availableVoices.length) return null;
    const hints = gender === 'male' ? MALE_HINTS : FEMALE_HINTS;
    let best = null, bestScore = -1;
    availableVoices.forEach(v=>{
      const s = scoreVoice(v, hints);
      if(s > bestScore){ bestScore = s; best = v; }
    });
    // If nothing matched any hint at all, just fall back to the first English voice
    if(bestScore <= 0){
      best = availableVoices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) || availableVoices[0];
    }
    return best;
  }

  // Detects which script a reply is written in, so text-to-speech can switch
  // to a Hindi or Gujarati voice automatically when Sakhi AI replies in that language.
  function detectReplyLang(text){
    if(/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN';   // Gujarati script
    if(/[\u0900-\u097F]/.test(text)) return 'hi-IN';   // Devanagari (Hindi) script
    return 'en-IN';
  }

  function pickVoiceForLang(lang, gender){
    if(!availableVoices.length) return null;
    const hints = gender === 'male' ? MALE_HINTS : FEMALE_HINTS;
    const langPrefix = lang.split('-')[0].toLowerCase();
    // Prefer a voice that actually matches the language first
    const inLang = availableVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    if(inLang.length){
      let best = inLang[0], bestScore = -1;
      inLang.forEach(v=>{
        const s = scoreVoice(v, hints);
        if(s > bestScore){ bestScore = s; best = v; }
      });
      return best;
    }
    // No voice for that language installed on this device — fall back to the usual English pick
    return pickBestVoice(gender);
  }

  function chooseVoiceGender(gender){
    preferredGender = gender;
    selectedVoice = pickBestVoice(gender);
    document.querySelectorAll('.vp-btn').forEach(b=> b.classList.toggle('active', b.dataset.gender === gender));
    try{ localStorage.setItem('ss_voice_gender', gender); }catch(e){}
    // Give a tiny preview so she can hear the change immediately
    speak(gender === 'male' ? "Hi, this is how I'll sound now." : "Hi, this is how I'll sound now.");
  }

  (async function initVoices(){
    availableVoices = await loadVoices();
    let saved = 'female';
    try{ saved = localStorage.getItem('ss_voice_gender') || 'female'; }catch(e){}
    preferredGender = saved;
    selectedVoice = pickBestVoice(saved);
    document.querySelectorAll('.vp-btn').forEach(b=> b.classList.toggle('active', b.dataset.gender === saved));
  })();

  function speak(text, bubbleId){
    if(!window.speechSynthesis){ setLiveStatus('ready', 'ready to listen'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const replyLang = detectReplyLang(text);
    const voiceForThisReply = replyLang === 'en-IN' ? selectedVoice : pickVoiceForLang(replyLang, preferredGender);
    if(voiceForThisReply){
      u.voice = voiceForThisReply;
      u.lang = voiceForThisReply.lang;
    } else {
      u.lang = replyLang;
    }
    u.rate = 0.96;
    u.pitch = preferredGender === 'male' ? 0.92 : 1.05;
    document.getElementById('micBtn').classList.add('speaking');
    setLiveStatus('speaking', 'speaking...');
    u.onend = ()=>{
      document.getElementById('micBtn').classList.remove('speaking');
      setLiveStatus('ready', 'ready to listen');
    };
    window.speechSynthesis.speak(u);
  }

  function replaySpeech(bubbleId){
    if(replyTexts[bubbleId]) speak(replyTexts[bubbleId], bubbleId);
  }

  /* ---------- LANGUAGE TOGGLE ---------- */
  const i18n = {
    en:{
      'nav.faqs':'FAQs','nav.tools':'Tools','nav.myths':'Myths vs Facts','nav.periods':'Periods Care',
      'nav.pregnancy':'Pregnancy Care','nav.calm':'Mind & Calm','nav.stories':'Stories','nav.ask':'Ask Sakhi',
      'nav.doctor':'Find a Doctor','nav.about':'About',
      'hero.eyebrow':'Your health, your pace ✳',
      'hero.title':'Real answers for <em>real life.</em>',
      'hero.p1':'Periods, PCOS, pregnancy, or the question you’re nervous to ask. Explore easy guides, useful tools, and Sakhi AI in one welcoming space.',
      'hero.p2':'Start with your question. When you need personal medical care, connect with a qualified clinician.',
      'hero.cta1':'Ask your question →','hero.cta2':'Find a gynecologist','hero.sign':'— with love, Shree Sakhi',
      'nav.aivoice':'Ask Sakhi AI','nav.voice':'Talk by Voice',
      'aivoice.eyebrow':'Instant answers, out loud','aivoice.h2':'Ask Sakhi AI — By Voice',
      'aivoice.p':"Tap the mic, ask your question like you'd ask a friend, and hear a reply back. Works best in Chrome or Edge.",
      'faqsec.eyebrow':'Start here','faqsec.h2':'Frequently Asked, Rarely Answered',
      'faqsec.p':'The questions girls whisper to their friends at 1am — answered out loud, in plain language.',
      'toolssec.eyebrow':'Tools that listen back','toolssec.h2':"Track It, Don't Just Wonder About It",
      'toolssec.p':"Simple tools that live right here in your browser — nothing is sent anywhere, it's saved only on this device.",
      'mythssec.eyebrow':"Let's clear the air",'mythssec.h2':'Myths vs Facts',
      'mythssec.p':"Tap a card to flip it and see the truth behind what you've probably heard.",
      'periodssec.eyebrow':'Periods care','periodssec.h2':'Getting Through the Hard Days, Gently',
      'periodssec.p':'For the cramps, the mood dips, and everything in between.',
      'moodkit.eyebrow':'Mood swing survival kit','moodkit.h3':"Feeling low, irritated, or just want to cry? That's okay.",
      'moodkit.p':"Here's a permission slip to feel better, on purpose.",
      'pregsec.eyebrow':'Pregnancy care','pregsec.h2':'Carrying a Life, Taking Care of Yours Too',
      'pregsec.p':'Movement, food, and everyday choices for a healthier nine months.',
      'calmsec.eyebrow':'Mind & calm','calmsec.h2':'For the Quiet Moments',
      'calmsec.p':"Pregnancy comes with a lot of waiting, worrying, and wondering. Here's what can help your mind feel as cared for as your body.",
      'storiessec.eyebrow':'You are not alone','storiessec.h2':'Real Stories, Shared Anonymously',
      'storiessec.p':'Other girls and women who once felt exactly what you might be feeling right now.',
      'voicesec.eyebrow':"You don't have to carry it alone",'voicesec.h2':'Talk It Out, By Voice',
      'voicesec.p':'No boyfriend, husband, or friend to call right now? These are real, trained volunteers in India who exist just to listen — free, confidential, and one tap away. Not just for crises — loneliness and a bad day count too.',
      'asksec.eyebrow':'Still have a question?','asksec.h2':'Ask Sakhi, Anonymously',
      'asksec.p':"No name, no login, no judgement. Type your question exactly as it's in your head.",
      'doctorsec.eyebrow':'Take the next step','doctorsec.h2':'Find a Gynecologist Near You',
      'doctorsec.p':"Type your city or area, and we'll open real, nearby clinics on the map so you can call and book an appointment.",
      'helplinesec.eyebrow':'Save these','helplinesec.h3':"India's Official Health & Women's Helplines",
      'helplinesec.p':'Free, government-run, and available right now — no appointment needed.',
      'help.104':'24×7 health advice helpline','help.102':'Free ambulance for pregnant women',
      'help.108':'Emergency ambulance','help.181':"Women's helpline (also 14490)",'help.112':'National emergency number',
      'aboutsec.eyebrow':'Meet Sakhi','aboutsec.h2':'Why This Platform Exists',
      'aboutsec.p':"Shree Sakhi was built on one simple belief: a girl or woman should never have to sit alone with a scary question about her own body. Too many of us learned about periods from whispered rumours, and about pregnancy from fear rather than facts. This platform brings together plain-language answers, real government resources, and a judgement-free space — so the next generation doesn't have to overthink in silence the way many of us did.",
      'footer.brand':'Shree Sakhi',
      'footer.p1':'Built so that no girl or woman has to feel afraid, alone, or ashamed of asking about her own body.',
      'footer.p2':'Educational content only — always confirm anything urgent or unusual with a qualified doctor.',

      'periods.card1':'<h4>Easing heavy period pain</h4><ul><li>Hold a warm water bottle or heating pad on your lower belly or back</li><li>Gentle walking or stretching — lying still can sometimes make cramps feel worse</li><li>A warm bath or shower relaxes tight pelvic muscles</li><li>A cup of warm ajwain, ginger, or chamomile water can help</li><li>Light massage with warm oil on the lower abdomen, in slow circles</li><li>Over-the-counter pain relief (like a basic anti-inflammatory) is fine occasionally — but if pain is severe every month, please see a gynecologist to rule out conditions like endometriosis</li></ul>',
      'periods.card2':'<h4>What to go easy on</h4><ul><li>Excess caffeine (coffee, cola) — can worsen cramps and irritability</li><li>Very salty or processed food — increases bloating</li><li>Too much sugar — can intensify mood swings after the initial lift</li><li>Alcohol and smoking — worsen cramps and hormonal balance</li><li>Extremely cold food/drinks for some people — if you notice they worsen your cramps, skip them during this week</li></ul>',
      'periods.card3':"<h4>What actually helps</h4><ul><li>Iron-rich foods — spinach, dates, jaggery, pomegranate (you're losing blood, replace it)</li><li>Warm fluids — soups, herbal teas, warm water through the day</li><li>Bananas and dark chocolate — genuinely help with cramps and mood, not just comfort food myths</li><li>Enough sleep — periods hit harder on broken sleep</li><li>Magnesium-rich foods — nuts, seeds, and bananas can ease cramping</li></ul>",
      'periods.toolkith3':'3 Ways to Kill Cramps, Fast','periods.toolkitp':'Tap-and-try techniques — pick whichever fits where you are right now.',
      'periods.stickertoolkit':'🎯 the actual toolkit','periods.stickerlimit':'😮\u200d💨 better to limit','periods.stickeradd':'✅ good to add',
      'periods.tool1':"<h4>Heat or cold, alternated</h4><p style=\"font-size:.88rem;color:#4a3835;\">Warm compress on the lower belly for 15 min eases cramps by relaxing muscle; a cold pack on the lower back for a few minutes can numb sharper pain. Alternate if one alone isn't enough.</p>",
      'periods.tool2':"<h4>Child's pose &amp; cat-cow</h4><p style=\"font-size:.88rem;color:#4a3835;\">Two minutes of child's pose, then slow cat-cow stretches, gently mobilizes the lower back and pelvis — often cuts cramp intensity within minutes.</p>",
      'periods.tool3':'<h4>Sip something warm</h4><p style="font-size:.88rem;color:#4a3835;">Ajwain (carom seed) water, ginger tea, or cinnamon tea — all have mild anti-inflammatory, muscle-relaxing effects. Sip slowly over 10 minutes.</p>',
      'periods.mood1':'<h4>Eat what you crave, guilt-free</h4><p>Dark chocolate, warm gulab jamun, ice cream, or a hot bowl of maggi — cravings during periods are hormonal, not a discipline failure. Enjoy it without the guilt lecture.</p>',
      'periods.mood2':'<h4>Watch something soft</h4><p>Comfort sitcoms (Friends, Modern Family, Brooklyn Nine-Nine), a nostalgic Bollywood rom-com, or a gentle K-drama. Save the intense thrillers for another week.</p>',
      'periods.mood3':'<h4>Music to soften the mood</h4><p>Soft acoustic playlists, lo-fi study beats, old Bollywood melodies (Lata Mangeshkar, Arijit Singh ballads), or anything nostalgic that makes you feel held.</p>',
      'periods.mood4':"<h4>Rest without guilt</h4><p>Cancelling a plan or lying in bed an extra hour isn't laziness this week — it's your body doing real work. Let yourself rest.</p>",
      'periods.mood5':'<h4>Vent to someone</h4><p>Call your sakhi, your mother, a friend — say the irritated thought out loud instead of holding it in. It usually shrinks the moment you say it.</p>',
      'periods.mood6':"<h4>Comfort over productivity</h4><p>A heating pad, your softest clothes, and a to-do list that can wait one more day. You don't owe anyone your best self this week.</p>",

      'preg.card1':"<h4>Safe movement</h4><ul><li>20–30 min gentle walk daily</li><li>Prenatal yoga or stretching</li><li>Pelvic floor (kegel) exercises</li><li>Swimming, if you're already comfortable in water</li><li>Avoid: contact sports, heavy weights, lying flat on the back after month 4, anything with fall risk</li></ul>",
      'preg.card2':"<h4>What to eat more of</h4><ul><li>Leafy greens, dal, jaggery — for iron</li><li>Milk, curd, til/sesame — for calcium</li><li>Eggs, paneer, sprouts — for protein</li><li>Seasonal fruit and lots of water</li><li>Doctor-prescribed folic acid, iron &amp; calcium supplements — don't skip these</li></ul>",
      'preg.card3':'<h4>What to steer clear of</h4><ul><li>Raw or undercooked eggs, meat, and unpasteurised dairy</li><li>Papaya (raw/semi-ripe) and pineapple in large amounts</li><li>Excess caffeine — keep it minimal</li><li>Alcohol and smoking — avoid entirely</li><li>High-mercury fish (like certain large sea fish)</li><li>Unwashed fruits/vegetables and street-side raw salads</li></ul>',
      'preg.tageatwell':'Eat well','preg.tagavoid':'Better to avoid',
      'preg.walk':'<h4>Walking &amp; daily rhythm</h4><p style="font-size:.92rem;color:#4a3835;">Two short walks (morning and evening) are usually easier on the body than one long one. Walk on even ground, wear comfortable footwear, and always carry water. Stop and rest if you feel breathless, dizzy, or notice tightening in your belly.</p>',
      'preg.delivery':'<h4>Preparing for a normal delivery</h4><p style="font-size:.92rem;color:#4a3835;">Staying active, practising slow breathing daily, attending antenatal/birth-prep classes, and keeping realistic expectations all help. But remember — however your baby arrives, vaginally or via C-section, you will have done the hardest, bravest thing. There is no "better" way to become a mother.</p>',
      'preg.stickereased':'🎯 pain &amp; discomfort, eased','preg.acheh3':'Common Aches — And What Actually Helps',
      'preg.achep':"Pregnancy discomfort is real. Here's what to do about the big three.",
      'preg.backpain':'<h4>Back pain</h4><p style="font-size:.88rem;color:#4a3835;">Sleep on your side with a pillow between your knees and one supporting your belly. A warm (not hot) compress on the lower back and gentle cat-cow stretches both help through the day.</p>',
      'preg.swelling':"<h4>Swollen feet &amp; ankles</h4><p style=\"font-size:.88rem;color:#4a3835;\">Elevate your legs above heart level for 15–20 minutes a few times a day, avoid standing for long stretches, stay hydrated, and go easy on salty snacks. Sudden or one-sided swelling needs a doctor's check.</p>",
      'preg.heartburn':'<h4>Heartburn &amp; acidity</h4><p style="font-size:.88rem;color:#4a3835;">Eat smaller, more frequent meals instead of large ones, skip spicy/fried food in the evening, and stay upright for at least 30 minutes after eating. Ask your doctor before taking any antacid.</p>',

      'myth1.tag':'Myth','myth1.q':'Periods are "impure" and you shouldn\'t enter a kitchen or temple.','myth1.tag2':'Fact','myth1.a':"Menstrual blood is simply the shedding of the uterine lining — it isn't dirty or impure. Temple entry is a personal or cultural choice, not a health requirement.",
      'myth2.tag':'Myth','myth2.q':"You can't get pregnant the first time you have sex.",'myth2.tag2':'Fact','myth2.a':'Pregnancy can happen the very first time, any time there\'s unprotected contact around ovulation. There\'s no "safe" first time.',
      'myth3.tag':'Myth','myth3.q':"PCOD/PCOS means you'll never be able to have children.",'myth3.tag2':'Fact','myth3.a':'Most women with PCOD conceive naturally or with medical support like ovulation induction. It can make it take longer — it doesn\'t mean "never."',
      'myth4.tag':'Myth','myth4.q':'Exercising during pregnancy can hurt the baby.','myth4.tag2':'Fact','myth4.a':'Gentle, doctor-approved exercise is actually linked to easier labour and better outcomes. Complete bed rest is only advised for specific medical reasons.',
      'myth5.tag':'Myth','myth5.q':"Eating certain foods during pregnancy decides the baby's gender.",'myth5.tag2':'Fact','myth5.a':"A baby's sex is determined at conception by chromosomes, not by diet. No food changes it — and in India, checking or trying to influence it is also illegal under the PCPNDT Act.",
      'myth6.tag':'Myth','myth6.q':'A C-section means you "failed" at giving birth.','myth6.tag2':'Fact','myth6.a':'A C-section is a medical decision made for safety, not a measure of strength or motherhood. Both paths bring a baby into the world just as validly.',

      'calm.card1':'<h4 style="color:var(--on-dark-band);">Gentle web series</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>Comfort sitcoms (Friends, The Big Bang Theory)</li><li>Light family dramas over intense thrillers</li><li>Nature/travel documentaries — calming visuals, no plot stress</li><li>Old, familiar favourites you can half-watch while resting</li></ul>',
      'calm.card2':'<h4 style="color:var(--on-dark-band);">Podcasts worth a listen</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>Pregnancy &amp; birth-prep podcasts by certified doulas or OB-GYNs</li><li>Calm storytelling or "sleep story" style podcasts</li><li>Light comedy podcasts for a mood lift on hard days</li><li>Guided meditation and breathing audio series</li></ul>',
      'calm.card3':'<h4 style="color:var(--on-dark-band);">Mantras &amp; quiet rituals</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>Om chanting or the Gayatri Mantra, softly, for 5–10 minutes</li><li>Simple affirmations: "My body knows how to do this"</li><li>Slow belly-breathing (inhale 4 counts, exhale 6 counts)</li><li>A short daily gratitude note — even one line</li></ul>',
      'calm.card4':'<h4 style="color:var(--on-dark-band);">Songs for calm</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>Soft instrumental or lo-fi playlists for background calm</li><li>Classical ragas known for a soothing effect (evening ragas work well)</li><li>Gentle devotional bhajans, if that brings you peace</li><li>Old melodic Bollywood songs that feel like a hug</li></ul>',
      'calm.card5':'<h4 style="color:var(--on-dark-band);">Reading for the mind</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>Light fiction or short stories over heavy, tense plots</li><li>A trusted pregnancy week-by-week guide</li><li>Journaling — even three lines a day about how you feel</li><li>Letters to your baby, to read together someday</li></ul>',
      'calm.card6':"<h4 style=\"color:var(--on-dark-band);\">If worry feels heavy</h4><ul style=\"color:var(--on-dark-band);opacity:.85;\"><li>Talk to your partner, mother, or a close friend — don't carry it silently</li><li>Persistent sadness, anxiety, or hopelessness deserves a conversation with your doctor — it's common and treatable, not a weakness</li><li>Antenatal classes often connect you with other women going through the same thing, at the same time</li></ul>",

      'tools.tab1':'Cycle Tracker','tools.tab2':'Pregnancy Week-by-Week','tools.tab3':'Due Date Calculator','tools.tab4':'Symptom Checker','tools.tab5':'Kick Counter',
      'tools.h1':"Log this period's start date",'tools.lbl1':'First day of your most recent period','tools.lbl2':'Your usual cycle length (days)',
      'tools.btn1':'Save & predict →','tools.btn2':'Clear history',
      'tools.note1':'Predictions are an estimate based on your average — real cycles vary with stress, illness, and PCOD. If cycles are consistently irregular, mention it to a doctor.',
      'tools.h2':"See what week you're in",'tools.lbl3':'First day of your last menstrual period (LMP)','tools.btn3':'Show my week →',
      'tools.note2':"Based on a standard 40-week pregnancy counted from your last period — your doctor's ultrasound dating is more precise if the two differ.",
      'tools.h3':'Estimate your due date','tools.lbl4':'First day of your last menstrual period','tools.btn4':'Calculate →',
      'tools.note3':"This uses the standard 280-day estimate (Naegele's rule). Your actual delivery date can fall anywhere in a 2-week window around this.",
      'tools.h4':'Is this normal, or should I call a doctor?','tools.p4':"Tick anything you're currently experiencing.",'tools.btn5':'Check →',
      'tools.note4':'This is a general guide, not a diagnosis. When in doubt, calling a doctor costs you a few minutes — ignoring something serious can cost much more.',
      'tools.h5':"Count your baby's movements",'tools.p5':'Best used from week 28 onward. Sit or lie comfortably, and tap every time you feel a kick, roll, or flutter.',
      'tools.btn6':'Reset session',
      'tools.note5':"Fewer than 10 movements in 2 hours (once you're used to your baby's pattern) is a reason to call your doctor promptly.",
      'tools.kickslabel':'kicks','tools.minlabel':'minutes elapsed',
      'tools.age':'Age','tools.height':'Height','tools.weight':'Weight','tools.curweight':'Current weight',
      'tools.aih4':'✨ Want a personalized insight?',
      'tools.aip1':'Optional — adding these helps Sakhi AI give more relevant, personal context. Nothing here is stored anywhere.',
      'tools.aip2':"Optional — these help Sakhi AI tailor the answer to you. This is general guidance, never a substitute for your doctor's advice.",
      'tools.aibtn':'✨ Get AI insight',
      'tools.sym1':'Heavy bleeding — soaking a pad/tampon every hour','tools.sym2':"Severe abdominal pain that won't ease",
      'tools.sym3':'Fever above 100.4°F (38°C)','tools.sym4':'Severe headache with blurred vision or swelling (if pregnant)',
      'tools.sym5':'Reduced or no baby movement (if pregnant, past 28 weeks)','tools.sym6':'Fluid leaking or fainting',
      'tools.sym7':'Mild cramps or lower back ache','tools.sym8':'Bloating or mild mood swings',
      'tools.sym9':'Slight change in flow or cycle length this month','tools.sym10':'Mild nausea or tiredness (if pregnant)'
    },
    hi:{
      'nav.faqs':'सवाल-जवाब','nav.tools':'टूल्स','nav.myths':'भ्रम बनाम सच','nav.periods':'पीरियड्स केयर',
      'nav.pregnancy':'प्रेगनेंसी केयर','nav.calm':'मन की शांति','nav.stories':'कहानियाँ','nav.ask':'सखी से पूछें',
      'nav.doctor':'डॉक्टर खोजें','nav.about':'हमारे बारे में',
      'hero.eyebrow':'आपकी सेहत, आपकी रफ़्तार ✳',
      'hero.title':'ज़िंदगी के सवालों के <em>सीधे जवाब।</em>',
      'hero.p1':'पीरियड्स, PCOS, प्रेगनेंसी या कोई ऐसा सवाल जिसे पूछने में झिझक होती है। आसान जानकारी, उपयोगी टूल और सखी AI एक ही जगह पाएँ।',
      'hero.p2':'अपने सवाल से शुरुआत करें। व्यक्तिगत चिकित्सा सलाह के लिए योग्य डॉक्टर से मिलें।',
      'hero.cta1':'अपना सवाल पूछें →','hero.cta2':'स्त्री रोग विशेषज्ञ खोजें','hero.sign':'— प्यार से, श्री सखी',
      'nav.aivoice':'सखी AI से पूछें','nav.voice':'आवाज़ में बात करें',
      'aivoice.eyebrow':'तुरंत जवाब, आवाज़ में','aivoice.h2':'सखी AI से पूछें — आवाज़ में',
      'aivoice.p':'माइक दबाएँ, दोस्त से पूछने जैसे अपना सवाल पूछें, और आवाज़ में जवाब सुनें। Chrome या Edge में सबसे अच्छा काम करता है।',
      'faqsec.eyebrow':'यहाँ से शुरू करें','faqsec.h2':'अक्सर पूछे जाने वाले सवाल, कम ही जिनके जवाब मिलते हैं',
      'faqsec.p':'वो सवाल जो लड़कियाँ रात 1 बजे अपनी सहेली से फुसफुसाकर पूछती हैं — यहाँ खुलकर, सीधी भाषा में जवाब दिए गए हैं।',
      'toolssec.eyebrow':'टूल्स जो आपकी सुनते हैं','toolssec.h2':'ट्रैक करें, बस सोचते मत रहिए',
      'toolssec.p':'सीधे आपके ब्राउज़र में चलने वाले आसान टूल्स — कुछ भी कहीं भेजा नहीं जाता, सिर्फ इसी डिवाइस में सेव होता है।',
      'mythssec.eyebrow':'चलिए भ्रम दूर करते हैं','mythssec.h2':'भ्रम बनाम सच',
      'mythssec.p':'कार्ड पर टैप करें और जो सच में सुना है उसके पीछे की सच्चाई देखें।',
      'periodssec.eyebrow':'पीरियड्स केयर','periodssec.h2':'मुश्किल दिनों को आसानी से पार करें',
      'periodssec.p':'ऐंठन, मूड में उतार-चढ़ाव और इन सबके बीच की हर चीज़ के लिए।',
      'moodkit.eyebrow':'मूड स्विंग सर्वाइवल किट','moodkit.h3':'उदास, चिड़चिड़ा महसूस हो रहा है या रोने का मन है? यह ठीक है।',
      'moodkit.p':'जानबूझकर बेहतर महसूस करने की एक परमिशन स्लिप।',
      'pregsec.eyebrow':'प्रेगनेंसी केयर','pregsec.h2':'एक जीवन को जन्म देना, अपना भी ख्याल रखते हुए',
      'pregsec.p':'एक स्वस्थ नौ महीनों के लिए हलचल, खानपान और रोज़मर्रा के फैसले।',
      'calmsec.eyebrow':'मन की शांति','calmsec.h2':'शांत पलों के लिए',
      'calmsec.p':'प्रेगनेंसी में बहुत इंतज़ार, चिंता और उलझन होती है। यहाँ बताया गया है कि आपके शरीर की तरह आपके मन का भी ख्याल कैसे रखा जाए।',
      'storiessec.eyebrow':'आप अकेली नहीं हैं','storiessec.h2':'सच्ची कहानियाँ, बेनाम शेयर की गईं',
      'storiessec.p':'वो लड़कियाँ और महिलाएँ जिन्होंने वही महसूस किया जो शायद अभी आप महसूस कर रही हैं।',
      'voicesec.eyebrow':'यह बोझ अकेले उठाने की ज़रूरत नहीं','voicesec.h2':'आवाज़ में बात करें',
      'voicesec.p':'अभी बात करने के लिए कोई बॉयफ्रेंड, पति या दोस्त नहीं है? ये भारत में असली, प्रशिक्षित वॉलंटियर्स हैं जो सिर्फ सुनने के लिए हैं — मुफ्त, गोपनीय, और एक टैप की दूरी पर। सिर्फ मुश्किल हालात के लिए नहीं — अकेलापन और बुरा दिन भी मायने रखता है।',
      'asksec.eyebrow':'अभी भी कोई सवाल है?','asksec.h2':'सखी से पूछें, बिना नाम बताए',
      'asksec.p':'कोई नाम नहीं, कोई लॉगिन नहीं, कोई जजमेंट नहीं। अपना सवाल बिल्कुल वैसे ही टाइप करें जैसे आपके मन में है।',
      'doctorsec.eyebrow':'अगला कदम उठाएँ','doctorsec.h2':'अपने पास स्त्री रोग विशेषज्ञ खोजें',
      'doctorsec.p':'अपना शहर या इलाका टाइप करें, और हम मैप पर पास के असली क्लीनिक खोल देंगे ताकि आप कॉल करके अपॉइंटमेंट बुक कर सकें।',
      'helplinesec.eyebrow':'इन्हें सेव कर लें','helplinesec.h3':'भारत की सरकारी स्वास्थ्य और महिला हेल्पलाइनें',
      'helplinesec.p':'मुफ्त, सरकार द्वारा चलाई जाने वाली, और अभी उपलब्ध — किसी अपॉइंटमेंट की ज़रूरत नहीं।',
      'help.104':'24×7 स्वास्थ्य सलाह हेल्पलाइन','help.102':'गर्भवती महिलाओं के लिए मुफ्त एम्बुलेंस',
      'help.108':'आपातकालीन एम्बुलेंस','help.181':'महिला हेल्पलाइन (14490 भी)','help.112':'राष्ट्रीय आपातकालीन नंबर',
      'aboutsec.eyebrow':'सखी से मिलिए','aboutsec.h2':'यह प्लेटफ़ॉर्म क्यों बना',
      'aboutsec.p':'श्री सखी एक सीधी सोच पर बनी है: किसी भी लड़की या महिला को अपने शरीर से जुड़े डरावने सवाल के साथ अकेले नहीं बैठना चाहिए। हम में से बहुतों ने पीरियड्स के बारे में फुसफुसाई हुई अफवाहों से और प्रेगनेंसी के बारे में डर से सीखा, न कि सच्चाई से। यह प्लेटफ़ॉर्म सीधी भाषा में जवाब, असली सरकारी संसाधन, और बिना जजमेंट की जगह एक साथ लाता है — ताकि अगली पीढ़ी को चुपचाप उतना न सोचना पड़े जितना हम में से कई को सोचना पड़ा।',
      'footer.brand':'श्री सखी',
      'footer.p1':'यह इसलिए बनाया गया है ताकि किसी भी लड़की या महिला को अपने शरीर के बारे में पूछने में डर, अकेलापन या शर्म महसूस न हो।',
      'footer.p2':'सिर्फ शैक्षिक जानकारी — कोई भी गंभीर या असामान्य बात हमेशा किसी योग्य डॉक्टर से ज़रूर पुष्टि करें।',

      'periods.card1':'<h4>पीरियड्स के तेज़ दर्द को कम करना</h4><ul><li>पेट के निचले हिस्से या पीठ पर गर्म पानी की बोतल या हीटिंग पैड रखें</li><li>हल्की सैर या स्ट्रेचिंग — बिल्कुल स्थिर लेटे रहने से कभी-कभी ऐंठन और बढ़ जाती है</li><li>गर्म पानी से नहाना पेल्विक की अकड़ी हुई मांसपेशियों को आराम देता है</li><li>गर्म अजवाइन, अदरक, या कैमोमाइल पानी का एक कप मदद कर सकता है</li><li>पेट के निचले हिस्से पर गर्म तेल से धीरे-धीरे गोलाई में मालिश करें</li><li>बिना पर्ची की दर्द निवारक दवा (जैसे बेसिक एंटी-इंफ्लेमेटरी) कभी-कभी लेना ठीक है — लेकिन अगर हर महीने दर्द बहुत तेज़ हो, तो एंडोमेट्रियोसिस जैसी स्थिति को खारिज करने के लिए स्त्री रोग विशेषज्ञ से मिलें</li></ul>',
      'periods.card2':'<h4>किन चीज़ों से थोड़ा बचें</h4><ul><li>ज़्यादा कैफीन (कॉफी, कोला) — ऐंठन और चिड़चिड़ापन बढ़ा सकती है</li><li>बहुत नमकीन या प्रोसेस्ड खाना — सूजन बढ़ाता है</li><li>ज़्यादा चीनी — शुरुआती राहत के बाद मूड स्विंग्स को और बढ़ा सकती है</li><li>शराब और धूम्रपान — ऐंठन और हार्मोनल संतुलन को बिगाड़ते हैं</li><li>कुछ लोगों के लिए बहुत ठंडा खाना/पीना — अगर लगे कि इससे ऐंठन बढ़ती है, तो इस हफ्ते इससे बचें</li></ul>',
      'periods.card3':'<h4>असल में क्या मदद करता है</h4><ul><li>आयरन से भरपूर खाना — पालक, खजूर, गुड़, अनार (आप खून खो रही हैं, उसे वापस पाएँ)</li><li>गर्म तरल पदार्थ — सूप, हर्बल चाय, दिनभर गर्म पानी</li><li>केले और डार्क चॉकलेट — सच में ऐंठन और मूड में मदद करते हैं, सिर्फ मिथक नहीं</li><li>पर्याप्त नींद — नींद पूरी न होने पर पीरियड्स ज़्यादा तकलीफ देते हैं</li><li>मैग्नीशियम से भरपूर खाना — नट्स, बीज, और केले ऐंठन कम कर सकते हैं</li></ul>',
      'periods.toolkith3':'ऐंठन को जल्दी कम करने के 3 तरीके','periods.toolkitp':'आज़माने लायक तकनीकें — जो भी अभी आपकी स्थिति में सही बैठे, वो चुनें।',
      'periods.stickertoolkit':'🎯 असली टूलकिट','periods.stickerlimit':'😮\u200d💨 थोड़ा कम करें','periods.stickeradd':'✅ ये अपनाएँ',
      'periods.tool1':"<h4>गर्म या ठंडा, बारी-बारी से</h4><p style=\"font-size:.88rem;color:#4a3835;\">पेट के निचले हिस्से पर 15 मिनट गर्म सिकाई मांसपेशियों को आराम देकर ऐंठन कम करती है; पीठ के निचले हिस्से पर कुछ मिनट ठंडी सिकाई तेज़ दर्द को सुन्न कर सकती है। अगर अकेले काम न करे तो दोनों को बारी-बारी से आज़माएँ।</p>",
      'periods.tool2':"<h4>चाइल्ड पोज़ और कैट-काउ</h4><p style=\"font-size:.88rem;color:#4a3835;\">दो मिनट चाइल्ड पोज़ करें, फिर धीरे-धीरे कैट-काउ स्ट्रेच करें — यह पीठ के निचले हिस्से और पेल्विस को आराम देता है, और अक्सर मिनटों में ऐंठन कम कर देता है।</p>",
      'periods.tool3':'<h4>कुछ गर्म पिएँ</h4><p style="font-size:.88rem;color:#4a3835;">अजवाइन का पानी, अदरक की चाय, या दालचीनी की चाय — इन सबमें हल्के एंटी-इंफ्लेमेटरी और मांसपेशियों को आराम देने वाले गुण होते हैं। 10 मिनट में धीरे-धीरे पिएँ।</p>',
      'periods.mood1':'<h4>जो मन करे वो खाएँ, बिना किसी अपराधबोध के</h4><p>डार्क चॉकलेट, गरम गुलाब जामुन, आइसक्रीम, या गरमागरम मैगी — पीरियड्स के दौरान क्रेविंग हार्मोनल होती है, यह अनुशासन की कमी नहीं है। बिना किसी गिल्ट के इसे एन्जॉय करें।</p>',
      'periods.mood2':'<h4>कुछ हल्का-फुल्का देखें</h4><p>कम्फर्ट सिटकॉम्स (Friends, Modern Family, Brooklyn Nine-Nine), कोई पुरानी बॉलीवुड रोम-कॉम, या हल्का K-drama। तेज़ थ्रिलर इस हफ्ते के लिए टाल दें।</p>',
      'periods.mood3':'<h4>मूड को नरम करने वाला संगीत</h4><p>सॉफ्ट एकॉस्टिक प्लेलिस्ट्स, लो-फाई बीट्स, पुराने बॉलीवुड गाने (लता मंगेशकर, अरिजीत सिंह की बैलड्स), या कुछ भी जो पुरानी यादों जैसा सुकून दे।</p>',
      'periods.mood4':'<h4>बिना किसी गिल्ट के आराम करें</h4><p>कोई प्लान कैंसिल करना या एक घंटा ज़्यादा सोना इस हफ्ते आलस नहीं है — यह आपके शरीर का असली काम है। खुद को आराम करने दें।</p>',
      'periods.mood5':'<h4>किसी से मन की बात करें</h4><p>अपनी सखी, अपनी माँ, या किसी दोस्त को कॉल करें — चिड़चिड़ाहट को अंदर रखने के बजाय ज़ोर से बोल दें। बोलते ही आमतौर पर यह छोटी लगने लगती है।</p>',
      'periods.mood6':'<h4>प्रोडक्टिविटी से ज़्यादा आराम को अहमियत दें</h4><p>एक हीटिंग पैड, आपके सबसे मुलायम कपड़े, और एक टू-डू लिस्ट जो एक दिन और इंतज़ार कर सकती है। इस हफ्ते आपको किसी को अपना बेस्ट वर्ज़न दिखाने की ज़रूरत नहीं है।</p>',

      'preg.card1':"<h4>सुरक्षित हलचल</h4><ul><li>रोज़ 20–30 मिनट हल्की सैर</li><li>प्रीनेटल योगा या स्ट्रेचिंग</li><li>पेल्विक फ्लोर (केगल) एक्सरसाइज़</li><li>तैराकी, अगर आप पहले से पानी में सहज हैं</li><li>इनसे बचें: कॉन्टैक्ट स्पोर्ट्स, भारी वज़न, चौथे महीने के बाद पीठ के बल सीधा लेटना, गिरने के जोखिम वाली कोई भी चीज़</li></ul>",
      'preg.card2':"<h4>ज़्यादा क्या खाएँ</h4><ul><li>हरी पत्तेदार सब्ज़ियाँ, दाल, गुड़ — आयरन के लिए</li><li>दूध, दही, तिल — कैल्शियम के लिए</li><li>अंडे, पनीर, स्प्राउट्स — प्रोटीन के लिए</li><li>मौसमी फल और भरपूर पानी</li><li>डॉक्टर द्वारा बताए गए फोलिक एसिड, आयरन और कैल्शियम सप्लीमेंट्स — इन्हें न छोड़ें</li></ul>",
      'preg.card3':'<h4>किन चीज़ों से दूर रहें</h4><ul><li>कच्चे या अधपके अंडे, मांस, और बिना पाश्चुराइज़ किया दूध</li><li>कच्चा/अधपका पपीता और ज़्यादा मात्रा में अनानास</li><li>ज़्यादा कैफीन — कम से कम रखें</li><li>शराब और धूम्रपान — पूरी तरह से बचें</li><li>ज़्यादा मरकरी वाली मछली (कुछ बड़ी समुद्री मछलियाँ)</li><li>बिना धुले फल/सब्ज़ियाँ और सड़क किनारे का कच्चा सलाद</li></ul>',
      'preg.tageatwell':'अच्छा खाएँ','preg.tagavoid':'बेहतर होगा बचें',
      'preg.walk':'<h4>सैर और रोज़ की दिनचर्या</h4><p style="font-size:.92rem;color:#4a3835;">एक लंबी सैर की बजाय दो छोटी सैर (सुबह और शाम) आमतौर पर शरीर के लिए आसान होती हैं। समतल ज़मीन पर चलें, आरामदायक जूते पहनें, और हमेशा पानी साथ रखें। अगर साँस फूले, चक्कर आए, या पेट में कसाव महसूस हो तो रुक जाएँ और आराम करें।</p>',
      'preg.delivery':'<h4>नॉर्मल डिलीवरी की तैयारी</h4><p style="font-size:.92rem;color:#4a3835;">सक्रिय रहना, रोज़ धीमी साँस लेने का अभ्यास, एंटेनेटल/बर्थ-प्रेप क्लासेज़ में जाना, और वास्तविक उम्मीदें रखना — ये सब मदद करते हैं। लेकिन याद रखें — चाहे आपका बच्चा नॉर्मल डिलीवरी से आए या सिज़ेरियन से, आपने सबसे मुश्किल, सबसे बहादुरी वाला काम किया होगा। माँ बनने का कोई "बेहतर" तरीका नहीं होता।</p>',
      'preg.stickereased':'🎯 दर्द और तकलीफ़, कम हुई','preg.acheh3':'आम तकलीफें — और असल में क्या मदद करता है',
      'preg.achep':'प्रेगनेंसी की तकलीफ असली होती है। यहाँ बताया गया है कि तीन बड़ी तकलीफों के लिए क्या करें।',
      'preg.backpain':'<h4>पीठ दर्द</h4><p style="font-size:.88rem;color:#4a3835;">करवट लेकर सोएँ, घुटनों के बीच एक तकिया रखें और एक तकिया पेट को सहारा देने के लिए। पीठ के निचले हिस्से पर गुनगुनी (गरम नहीं) सिकाई और हल्के कैट-काउ स्ट्रेच दिनभर मदद करते हैं।</p>',
      'preg.swelling':"<h4>पैर और टखनों में सूजन</h4><p style=\"font-size:.88rem;color:#4a3835;\">दिन में कुछ बार 15–20 मिनट के लिए पैरों को दिल के स्तर से ऊपर रखें, लंबे समय तक खड़े रहने से बचें, भरपूर पानी पिएँ, और नमकीन चीज़ों में थोड़ी कमी करें। अचानक या एक तरफ की सूजन के लिए डॉक्टर से ज़रूर जाँच कराएँ।</p>",
      'preg.heartburn':'<h4>सीने में जलन और एसिडिटी</h4><p style="font-size:.88rem;color:#4a3835;">बड़े भोजन की बजाय छोटे-छोटे, बार-बार भोजन करें, शाम को तीखा/तला खाना छोड़ें, और खाने के बाद कम से कम 30 मिनट तक सीधे बैठें। कोई भी एंटासिड लेने से पहले डॉक्टर से पूछें।</p>',

      'myth1.tag':'मिथक','myth1.q':'पीरियड्स "अपवित्र" होते हैं और इस दौरान रसोई या मंदिर में नहीं जाना चाहिए।','myth1.tag2':'सच','myth1.a':'माहवारी का खून बस गर्भाशय की परत का निकलना है — यह गंदा या अपवित्र नहीं है। मंदिर जाना या न जाना एक निजी या सांस्कृतिक चुनाव है, स्वास्थ्य की शर्त नहीं।',
      'myth2.tag':'मिथक','myth2.q':'पहली बार सेक्स करने पर प्रेगनेंसी नहीं होती।','myth2.tag2':'सच','myth2.a':'ओव्युलेशन के आसपास कभी भी बिना सुरक्षा के संपर्क होने पर पहली बार में भी प्रेगनेंसी हो सकती है। कोई भी "सुरक्षित" पहली बार नहीं होती।',
      'myth3.tag':'मिथक','myth3.q':'PCOD/PCOS का मतलब है कि आप कभी माँ नहीं बन सकतीं।','myth3.tag2':'सच','myth3.a':'PCOD वाली ज़्यादातर महिलाएँ प्राकृतिक रूप से या मेडिकल मदद (जैसे ओव्युलेशन इंडक्शन) से गर्भधारण कर लेती हैं। इसमें समय ज़्यादा लग सकता है — इसका मतलब "कभी नहीं" नहीं है।',
      'myth4.tag':'मिथक','myth4.q':'प्रेगनेंसी में एक्सरसाइज़ करने से बच्चे को नुकसान होता है।','myth4.tag2':'सच','myth4.a':'डॉक्टर की सलाह से हल्की एक्सरसाइज़ असल में आसान डिलीवरी और बेहतर परिणामों से जुड़ी है। पूरी तरह बेड रेस्ट सिर्फ खास मेडिकल कारणों से ही सलाह दी जाती है।',
      'myth5.tag':'मिथक','myth5.q':'प्रेगनेंसी में कुछ खास खाना खाने से बच्चे का लिंग तय होता है।','myth5.tag2':'सच','myth5.a':'बच्चे का लिंग गर्भधारण के समय क्रोमोसोम से तय होता है, खाने से नहीं। कोई भी खाना इसे नहीं बदलता — और भारत में इसे जाँचना या बदलने की कोशिश करना PCPNDT कानून के तहत गैरकानूनी भी है।',
      'myth6.tag':'मिथक','myth6.q':'सिज़ेरियन का मतलब है कि आप डिलीवरी में "असफल" रहीं।','myth6.tag2':'सच','myth6.a':'सिज़ेरियन एक मेडिकल फैसला है जो सुरक्षा के लिए लिया जाता है, यह ताकत या मातृत्व का पैमाना नहीं है। दोनों ही तरीकों से बच्चा उतनी ही सच्चाई से दुनिया में आता है।',

      'calm.card1':'<h4 style="color:var(--on-dark-band);">हल्की-फुल्की वेब सीरीज़</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>कम्फर्ट सिटकॉम्स (Friends, The Big Bang Theory)</li><li>तेज़ थ्रिलर की बजाय हल्के फैमिली ड्रामा</li><li>नेचर/ट्रैवल डॉक्यूमेंट्री — शांत विज़ुअल्स, कोई कहानी का तनाव नहीं</li><li>पुराने, जाने-पहचाने पसंदीदा शो जिन्हें आराम करते हुए आधा-अधूरा देखा जा सकता है</li></ul>',
      'calm.card2':'<h4 style="color:var(--on-dark-band);">सुनने लायक पॉडकास्ट</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>सर्टिफाइड डूला या OB-GYN द्वारा प्रेगनेंसी और बर्थ-प्रेप पॉडकास्ट</li><li>शांत कहानी सुनाने वाले या "स्लीप स्टोरी" जैसे पॉडकास्ट</li><li>मुश्किल दिनों में मूड बेहतर करने के लिए हल्के कॉमेडी पॉडकास्ट</li><li>गाइडेड मेडिटेशन और साँस लेने की ऑडियो सीरीज़</li></ul>',
      'calm.card3':'<h4 style="color:var(--on-dark-band);">मंत्र और शांत रिचुअल्स</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>ॐ का जाप या गायत्री मंत्र, धीरे-धीरे, 5–10 मिनट के लिए</li><li>सरल एफर्मेशन: "मेरा शरीर जानता है कि यह कैसे करना है"</li><li>धीमी पेट से साँस लेना (4 गिनती में साँस लें, 6 गिनती में छोड़ें)</li><li>रोज़ का एक छोटा आभार नोट — एक लाइन भी काफी है</li></ul>',
      'calm.card4':'<h4 style="color:var(--on-dark-band);">शांति के लिए गाने</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>बैकग्राउंड शांति के लिए सॉफ्ट इंस्ट्रूमेंटल या लो-फाई प्लेलिस्ट</li><li>शांति देने वाले शास्त्रीय राग (शाम के राग अच्छे रहते हैं)</li><li>अगर सुकून मिले तो हल्के भक्ति भजन</li><li>पुराने मधुर बॉलीवुड गाने जो गले लगाने जैसा एहसास दें</li></ul>',
      'calm.card5':'<h4 style="color:var(--on-dark-band);">मन के लिए पढ़ना</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>भारी, तनावपूर्ण कहानियों की बजाय हल्की फिक्शन या छोटी कहानियाँ</li><li>एक भरोसेमंद प्रेगनेंसी वीक-बाय-वीक गाइड</li><li>जर्नलिंग — दिन में सिर्फ तीन लाइनें भी अपने एहसासों के बारे में</li><li>अपने बच्चे के नाम चिट्ठियाँ, जिन्हें कभी साथ पढ़ा जा सके</li></ul>',
      'calm.card6':'<h4 style="color:var(--on-dark-band);">अगर चिंता भारी लगे</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>अपने पार्टनर, माँ, या किसी करीबी दोस्त से बात करें — चुपचाप मत सहें</li><li>लगातार उदासी, चिंता, या निराशा के लिए डॉक्टर से बात करना ज़रूरी है — यह आम है और ठीक हो सकता है, यह कमज़ोरी नहीं है</li><li>एंटेनेटल क्लासेज़ अक्सर आपको उन दूसरी महिलाओं से जोड़ती हैं जो उसी समय वही सब झेल रही हैं</li></ul>',

      'tools.tab1':'साइकल ट्रैकर','tools.tab2':'प्रेगनेंसी वीक-बाय-वीक','tools.tab3':'ड्यू डेट कैलकुलेटर','tools.tab4':'लक्षण जाँच','tools.tab5':'किक काउंटर',
      'tools.h1':'इस पीरियड की शुरुआत की तारीख डालें','tools.lbl1':'आपके सबसे हाल के पीरियड का पहला दिन','tools.lbl2':'आपके साइकल की सामान्य लंबाई (दिनों में)',
      'tools.btn1':'सेव करें और अनुमान लगाएँ →','tools.btn2':'इतिहास मिटाएँ',
      'tools.note1':'अनुमान आपके औसत पर आधारित हैं — असली साइकल तनाव, बीमारी, और PCOD के साथ बदलती है। अगर साइकल लगातार अनियमित रहे, तो डॉक्टर को ज़रूर बताएँ।',
      'tools.h2':'देखें आप किस हफ्ते में हैं','tools.lbl3':'आपके आखिरी माहवारी का पहला दिन (LMP)','tools.btn3':'मेरा हफ्ता दिखाएँ →',
      'tools.note2':'आपके आखिरी पीरियड से गिनकर मानक 40-हफ्ते की प्रेगनेंसी पर आधारित है — अगर अल्ट्रासाउंड की तारीख अलग हो तो वह ज़्यादा सटीक होती है।',
      'tools.h3':'अपनी ड्यू डेट का अनुमान लगाएँ','tools.lbl4':'आपके आखिरी माहवारी का पहला दिन','tools.btn4':'गणना करें →',
      'tools.note3':'यह मानक 280-दिन के अनुमान (नेगेले के नियम) का उपयोग करता है। असली डिलीवरी डेट इसके आसपास 2 हफ्ते की सीमा में कहीं भी हो सकती है।',
      'tools.h4':'क्या यह सामान्य है, या मुझे डॉक्टर को कॉल करना चाहिए?','tools.p4':'अभी जो भी महसूस हो रहा हो, उस पर टिक करें।','tools.btn5':'जाँचें →',
      'tools.note4':'यह एक सामान्य गाइड है, डायग्नोसिस नहीं। शक होने पर डॉक्टर को कॉल करना कुछ मिनट लेता है — किसी गंभीर बात को नज़रअंदाज़ करना कहीं ज़्यादा भारी पड़ सकता है।',
      'tools.h5':'अपने बच्चे की हलचल गिनें','tools.p5':'28वें हफ्ते से इस्तेमाल करना सबसे अच्छा है। आराम से बैठें या लेटें, और जब भी किक, हलचल, या फड़फड़ाहट महसूस हो तब टैप करें।',
      'tools.btn6':'सेशन रीसेट करें',
      'tools.note5':'2 घंटे में 10 से कम हलचल (एक बार जब आपको बच्चे के पैटर्न की आदत हो जाए) डॉक्टर को तुरंत कॉल करने की वजह है।',
      'tools.kickslabel':'किक','tools.minlabel':'मिनट बीते',
      'tools.age':'उम्र','tools.height':'लंबाई','tools.weight':'वज़न','tools.curweight':'वर्तमान वज़न',
      'tools.aih4':'✨ एक पर्सनलाइज़्ड जानकारी चाहिए?',
      'tools.aip1':'वैकल्पिक — यह जोड़ने से सखी AI ज़्यादा सटीक, व्यक्तिगत जवाब दे पाती है। यहाँ कुछ भी कहीं सेव नहीं होता।',
      'tools.aip2':'वैकल्पिक — यह सखी AI को आपके लिए जवाब बेहतर बनाने में मदद करता है। यह सामान्य सलाह है, आपके डॉक्टर की सलाह का विकल्प नहीं।',
      'tools.aibtn':'✨ AI जानकारी पाएँ',
      'tools.sym1':'भारी ब्लीडिंग — हर घंटे पैड/टैम्पोन भीग जाना','tools.sym2':'तेज़ पेट दर्द जो कम नहीं हो रहा',
      'tools.sym3':'100.4°F (38°C) से ज़्यादा बुखार','tools.sym4':'धुंधली नज़र या सूजन के साथ तेज़ सिरदर्द (अगर प्रेगनेंट हैं)',
      'tools.sym5':'बच्चे की हलचल कम होना या न होना (अगर प्रेगनेंट हैं, 28 हफ्ते के बाद)','tools.sym6':'पानी का रिसाव या बेहोशी',
      'tools.sym7':'हल्की ऐंठन या पीठ के निचले हिस्से में दर्द','tools.sym8':'सूजन या हल्के मूड स्विंग्स',
      'tools.sym9':'इस महीने फ्लो या साइकल की लंबाई में हल्का बदलाव','tools.sym10':'हल्की मितली या थकान (अगर प्रेगनेंट हैं)'
    },
    gu:{
      'nav.faqs':'પ્રશ્નો','nav.tools':'ટૂલ્સ','nav.myths':'ભ્રમ વિ સત્ય','nav.periods':'પીરિયડ્સ કેર',
      'nav.pregnancy':'પ્રેગનેન્સી કેર','nav.calm':'મન ની શાંતિ','nav.stories':'વાર્તાઓ','nav.ask':'સખી ને પૂછો',
      'nav.doctor':'ડૉક્ટર શોધો','nav.about':'અમારા વિશે',
      'hero.eyebrow':'તમારું સ્વાસ્થ્ય, તમારી ગતિ ✳',
      'hero.title':'જીવનના સવાલોના <em>સરળ જવાબ.</em>',
      'hero.p1':'પીરિયડ્સ, PCOS, પ્રેગ્નન્સી કે પૂછવામાં સંકોચ થાય એવો કોઈ સવાલ. સરળ માર્ગદર્શિકા, ઉપયોગી ટૂલ્સ અને સખી AI એક જ જગ્યાએ મેળવો.',
      'hero.p2':'તમારા સવાલથી શરૂઆત કરો. વ્યક્તિગત તબીબી સલાહ માટે લાયક ડૉક્ટરને મળો.',
      'hero.cta1':'તમારો પ્રશ્ન પૂછો →','hero.cta2':'સ્ત્રીરોગ નિષ્ણાત શોધો','hero.sign':'— પ્રેમ સાથે, શ્રી સખી',
      'nav.aivoice':'સખી AI ને પૂછો','nav.voice':'અવાજમાં વાત કરો',
      'aivoice.eyebrow':'તરત જવાબ, અવાજમાં','aivoice.h2':'સખી AI ને પૂછો — અવાજમાં',
      'aivoice.p':'માઇક દબાવો, મિત્રને પૂછો તેમ તમારો પ્રશ્ન પૂછો, અને જવાબ અવાજમાં સાંભળો. Chrome અથવા Edge માં શ્રેષ્ઠ કામ કરે છે.',
      'faqsec.eyebrow':'અહીંથી શરૂ કરો','faqsec.h2':'વારંવાર પુછાતા પ્રશ્નો, ભાગ્યે જ જવાબ મળે એવા',
      'faqsec.p':'એ પ્રશ્નો જે છોકરીઓ રાત્રે 1 વાગ્યે પોતાની બહેનપણીને ધીમેથી પૂછે છે — અહીં ખુલ્લેઆમ, સાદી ભાષામાં જવાબ આપ્યા છે.',
      'toolssec.eyebrow':'ટૂલ્સ જે તમારું સાંભળે છે','toolssec.h2':'ટ્રેક કરો, ફક્ત વિચારતા ના રહો',
      'toolssec.p':'તમારા બ્રાઉઝરમાં જ ચાલતા સરળ ટૂલ્સ — કંઈ પણ ક્યાંય મોકલાતું નથી, ફક્ત આ ડિવાઇસ પર જ સેવ થાય છે.',
      'mythssec.eyebrow':'ચાલો ભ્રમ દૂર કરીએ','mythssec.h2':'ભ્રમ વિરુદ્ધ સત્ય',
      'mythssec.p':'કાર્ડ પર ટેપ કરો અને તમે જે સાંભળ્યું હશે તેની પાછળનું સત્ય જુઓ.',
      'periodssec.eyebrow':'પીરિયડ્સ કેર','periodssec.h2':'મુશ્કેલ દિવસો સરળતાથી પસાર કરો',
      'periodssec.p':'દુખાવો, મૂડમાં ફેરફાર, અને આ બધાની વચ્ચેની દરેક વસ્તુ માટે.',
      'moodkit.eyebrow':'મૂડ સ્વિંગ સર્વાઇવલ કિટ','moodkit.h3':'ઉદાસ, ચીડિયા લાગે છે અથવા રડવાનું મન થાય છે? એ બરાબર છે.',
      'moodkit.p':'ઇરાદાપૂર્વક સારું અનુભવવા માટેની એક પરવાનગી સ્લિપ.',
      'pregsec.eyebrow':'પ્રેગનેન્સી કેર','pregsec.h2':'એક જીવનને જન્મ આપવો, તમારી પોતાની પણ સંભાળ રાખવી',
      'pregsec.p':'સ્વસ્થ નવ મહિના માટે હલનચલન, ખોરાક અને રોજિંદા પસંદગીઓ.',
      'calmsec.eyebrow':'મન ની શાંતિ','calmsec.h2':'શાંત ક્ષણો માટે',
      'calmsec.p':'ગર્ભાવસ્થામાં ઘણી રાહ જોવી, ચિંતા અને મૂંઝવણ હોય છે. અહીં જણાવ્યું છે કે તમારા શરીરની જેમ તમારા મનની પણ કાળજી કેવી રીતે રાખવી.',
      'storiessec.eyebrow':'તમે એકલા નથી','storiessec.h2':'સાચી વાર્તાઓ, અનામી રીતે શેર કરેલી',
      'storiessec.p':'એ છોકરીઓ અને સ્ત્રીઓ જેમણે એવું જ અનુભવ્યું જે કદાચ અત્યારે તમે અનુભવી રહ્યા છો.',
      'voicesec.eyebrow':'આ બોજ એકલા ઉપાડવાની જરૂર નથી','voicesec.h2':'અવાજમાં વાત કરો',
      'voicesec.p':'અત્યારે વાત કરવા માટે કોઈ બોયફ્રેન્ડ, પતિ કે મિત્ર નથી? આ ભારતના સાચા, પ્રશિક્ષિત સ્વયંસેવકો છે જે ફક્ત સાંભળવા માટે છે — મફત, ગુપ્ત, અને એક ટેપ દૂર. ફક્ત કટોકટી માટે નહીં — એકલતા અને ખરાબ દિવસ પણ મહત્વના છે.',
      'asksec.eyebrow':'હજુ પણ કોઈ પ્રશ્ન છે?','asksec.h2':'સખીને પૂછો, અનામી રીતે',
      'asksec.p':'કોઈ નામ નહીં, કોઈ લોગિન નહીં, કોઈ નિર્ણય નહીં. તમારો પ્રશ્ન બરાબર એ જ રીતે લખો જેમ તમારા મનમાં છે.',
      'doctorsec.eyebrow':'આગળનું પગલું ભરો','doctorsec.h2':'તમારી નજીક સ્ત્રીરોગ નિષ્ણાત શોધો',
      'doctorsec.p':'તમારું શહેર અથવા વિસ્તાર લખો, અને અમે નકશા પર નજીકના સાચા ક્લિનિક ખોલીશું જેથી તમે કૉલ કરીને એપોઇન્ટમેન્ટ બુક કરી શકો.',
      'helplinesec.eyebrow':'આ સેવ કરો','helplinesec.h3':'ભારતની સત્તાવાર આરોગ્ય અને મહિલા હેલ્પલાઇન',
      'helplinesec.p':'મફત, સરકાર દ્વારા ચલાવવામાં આવતી, અને અત્યારે જ ઉપલબ્ધ — કોઈ એપોઇન્ટમેન્ટની જરૂર નથી.',
      'help.104':'24×7 આરોગ્ય સલાહ હેલ્પલાઇન','help.102':'ગર્ભવતી મહિલાઓ માટે મફત એમ્બ્યુલન્સ',
      'help.108':'કટોકટી એમ્બ્યુલન્સ','help.181':'મહિલા હેલ્પલાઇન (14490 પણ)','help.112':'રાષ્ટ્રીય કટોકટી નંબર',
      'aboutsec.eyebrow':'સખીને મળો','aboutsec.h2':'આ પ્લેટફોર્મ શા માટે છે',
      'aboutsec.p':'શ્રી સખી એક સાદી માન્યતા પર બનેલું છે: કોઈ પણ છોકરી કે સ્ત્રીએ પોતાના શરીર વિશેના ડરામણા પ્રશ્ન સાથે એકલા બેસવું ન જોઈએ. આપણામાંથી ઘણાએ પીરિયડ્સ વિશે ગુસપુસ થતી અફવાઓથી અને ગર્ભાવસ્થા વિશે ડરથી શીખ્યું, હકીકતોથી નહીં. આ પ્લેટફોર્મ સાદી ભાષામાં જવાબો, સાચા સરકારી સંસાધનો, અને નિર્ણય વગરની જગ્યા સાથે લાવે છે — જેથી આગલી પેઢીને એટલું બધું એકલા વિચારવું ન પડે જેટલું આપણામાંથી ઘણાને પડ્યું.',
      'footer.brand':'શ્રી સખી',
      'footer.p1':'આ એટલા માટે બનાવવામાં આવ્યું છે જેથી કોઈ પણ છોકરી કે સ્ત્રીને પોતાના શરીર વિશે પૂછવામાં ડર, એકલતા કે શરમ ન લાગે.',
      'footer.p2':'ફક્ત શૈક્ષણિક માહિતી — કોઈ પણ તાત્કાલિક કે અસામાન્ય બાબત હંમેશા લાયક ડૉક્ટર સાથે ચકાસો.',

      'periods.card1':'<h4>ભારે પીરિયડ દુખાવો ઓછો કરવો</h4><ul><li>પેટના નીચેના ભાગ કે પીઠ પર ગરમ પાણીની બોટલ કે હીટિંગ પેડ રાખો</li><li>હળવું ચાલવું કે સ્ટ્રેચિંગ — સ્થિર સૂઈ રહેવાથી ક્યારેક દુખાવો વધુ લાગે છે</li><li>ગરમ પાણીથી નહાવાથી પેલ્વિક સ્નાયુઓને આરામ મળે છે</li><li>ગરમ અજમો, આદુ, અથવા કેમોમાઈલ પાણીનો એક કપ મદદરૂપ થઈ શકે</li><li>પેટના નીચેના ભાગ પર ગરમ તેલથી ધીમે ધીમે ગોળાકારમાં માલિશ કરો</li><li>પ્રિસ્ક્રિપ્શન વગરની દર્દ નિવારક દવા (જેમ કે સામાન્ય એન્ટી-ઇન્ફ્લેમેટરી) ક્યારેક લેવી ઠીક છે — પણ જો દર દર મહિને દુખાવો ગંભીર હોય, તો એન્ડોમેટ્રિઓસિસ જેવી સ્થિતિ નકારવા સ્ત્રીરોગ નિષ્ણાતને મળો</li></ul>',
      'periods.card2':'<h4>શેનાથી થોડું બચવું</h4><ul><li>વધારે કેફીન (કોફી, કોલા) — દુખાવો અને ચીડિયાપણું વધારી શકે</li><li>ખૂબ મીઠું અથવા પ્રોસેસ્ડ ખોરાક — સોજો વધારે છે</li><li>વધારે ખાંડ — શરૂઆતની રાહત પછી મૂડ સ્વિંગ્સ વધારી શકે</li><li>દારૂ અને ધૂમ્રપાન — દુખાવો અને હોર્મોનલ સંતુલન બગાડે છે</li><li>કેટલાક લોકો માટે ખૂબ ઠંડો ખોરાક/પીણાં — જો લાગે કે તેનાથી દુખાવો વધે છે, તો આ અઠવાડિયે તેને ટાળો</li></ul>',
      'periods.card3':'<h4>ખરેખર શું મદદ કરે છે</h4><ul><li>આયર્નથી ભરપૂર ખોરાક — પાલક, ખજૂર, ગોળ, દાડમ (તમે લોહી ગુમાવી રહ્યા છો, તેને પાછું મેળવો)</li><li>ગરમ પ્રવાહી — સૂપ, હર્બલ ચા, દિવસભર ગરમ પાણી</li><li>કેળા અને ડાર્ક ચોકલેટ — ખરેખર દુખાવો અને મૂડમાં મદદ કરે છે, ફક્ત આરામદાયક ખોરાકની માન્યતા નથી</li><li>પૂરતી ઊંઘ — ઊંઘ અધૂરી હોય ત્યારે પીરિયડ્સ વધુ તકલીફ આપે છે</li><li>મેગ્નેશિયમથી ભરપૂર ખોરાક — બદામ, બીજ, અને કેળા દુખાવો ઘટાડી શકે</li></ul>',
      'periods.toolkith3':'દુખાવો ઝડપથી ઘટાડવાની 3 રીતો','periods.toolkitp':'અજમાવવા જેવી ટેકનિક — અત્યારે તમને જે બંધબેસે તે પસંદ કરો.',
      'periods.stickertoolkit':'🎯 સાચી ટૂલકિટ','periods.stickerlimit':'😮\u200d💨 થોડું ઘટાડો','periods.stickeradd':'✅ આ ઉમેરો',
      'periods.tool1':'<h4>ગરમ કે ઠંડું, વારાફરતી</h4><p style="font-size:.88rem;color:#4a3835;">પેટના નીચેના ભાગ પર 15 મિનિટ ગરમ શેક સ્નાયુઓને આરામ આપીને દુખાવો ઘટાડે છે; પીઠના નીચેના ભાગ પર થોડી મિનિટો ઠંડો શેક તીવ્ર દુખાવાને સુન્ન કરી શકે છે. જો એકલું પૂરતું ન હોય તો બંને વારાફરતી અજમાવો.</p>',
      'periods.tool2':'<h4>ચાઇલ્ડ પોઝ અને કેટ-કાઉ</h4><p style="font-size:.88rem;color:#4a3835;">બે મિનિટ ચાઇલ્ડ પોઝ કરો, પછી ધીમે ધીમે કેટ-કાઉ સ્ટ્રેચ કરો — આ પીઠના નીચેના ભાગ અને પેલ્વિસને હલનચલન આપે છે અને ઘણીવાર મિનિટોમાં દુખાવો ઘટાડે છે.</p>',
      'periods.tool3':'<h4>કંઈક ગરમ પીવો</h4><p style="font-size:.88rem;color:#4a3835;">અજમાનું પાણી, આદુની ચા, અથવા તજની ચા — આ બધામાં હળવા એન્ટી-ઇન્ફ્લેમેટરી અને સ્નાયુ-આરામ આપતા ગુણો હોય છે. 10 મિનિટ ધીમે ધીમે પીવો.</p>',
      'periods.mood1':'<h4>જે મન થાય તે ખાઓ, કોઈ અપરાધભાવ વગર</h4><p>ડાર્ક ચોકલેટ, ગરમ ગુલાબ જામુન, આઈસક્રીમ, અથવા ગરમાગરમ મેગી — પીરિયડ્સ દરમિયાન ક્રેવિંગ હોર્મોનલ હોય છે, તે શિસ્તની ખામી નથી. કોઈ પણ અપરાધભાવ વગર તેને માણો.</p>',
      'periods.mood2':'<h4>કંઈક હળવું જુઓ</h4><p>કમ્ફર્ટ સિટકોમ્સ (Friends, Modern Family, Brooklyn Nine-Nine), કોઈ જૂની બોલિવૂડ રોમ-કોમ, અથવા હળવો K-drama. તીવ્ર થ્રિલર આ અઠવાડિયા માટે ટાળો.</p>',
      'periods.mood3':'<h4>મૂડને નરમ કરતું સંગીત</h4><p>સોફ્ટ એકોસ્ટિક પ્લેલિસ્ટ, લો-ફાઈ બીટ્સ, જૂના બોલિવૂડ ગીતો (લતા મંગેશકર, અરિજિત સિંહની બેલડ્સ), અથવા કંઈ પણ જે જૂની યાદો જેવો હૂંફાળો અહેસાસ આપે.</p>',
      'periods.mood4':'<h4>કોઈ અપરાધભાવ વગર આરામ કરો</h4><p>કોઈ પ્લાન રદ કરવો કે એક કલાક વધારે સૂવું આ અઠવાડિયે આળસ નથી — તે તમારા શરીરનું ખરું કામ છે. તમારી જાતને આરામ કરવા દો.</p>',
      'periods.mood5':'<h4>કોઈની સાથે મન હળવું કરો</h4><p>તમારી સખી, તમારી મમ્મી, અથવા મિત્રને કૉલ કરો — ચીડિયો વિચાર અંદર રાખવાને બદલે મોટેથી કહો. કહેતાની સાથે જ તે સામાન્ય રીતે નાનો લાગવા લાગે છે.</p>',
      'periods.mood6':'<h4>પ્રોડક્ટિવિટી કરતાં આરામને મહત્વ આપો</h4><p>એક હીટિંગ પેડ, તમારા સૌથી નરમ કપડાં, અને એક ટૂ-ડૂ લિસ્ટ જે એક દિવસ વધુ રાહ જોઈ શકે. આ અઠવાડિયે તમારે કોઈને તમારું શ્રેષ્ઠ સ્વરૂપ બતાવવાની જરૂર નથી.</p>',

      'preg.card1':"<h4>સુરક્ષિત હલનચલન</h4><ul><li>રોજ 20–30 મિનિટ હળવું ચાલવું</li><li>પ્રિનેટલ યોગા અથવા સ્ટ્રેચિંગ</li><li>પેલ્વિક ફ્લોર (કેગલ) કસરતો</li><li>તરવું, જો તમે પહેલેથી પાણીમાં આરામદાયક હો</li><li>આનાથી બચો: કોન્ટેક્ટ સ્પોર્ટ્સ, ભારે વજન, ચોથા મહિના પછી પીઠ પર સીધા સૂવું, પડવાનું જોખમ ધરાવતી કોઈ પણ વસ્તુ</li></ul>",
      'preg.card2':"<h4>વધુ શું ખાવું</h4><ul><li>લીલા પાંદડાવાળા શાકભાજી, દાળ, ગોળ — આયર્ન માટે</li><li>દૂધ, દહીં, તલ — કેલ્શિયમ માટે</li><li>ઈંડા, પનીર, સ્પ્રાઉટ્સ — પ્રોટીન માટે</li><li>મોસમી ફળો અને પુષ્કળ પાણી</li><li>ડૉક્ટરે સૂચવેલ ફોલિક એસિડ, આયર્ન અને કેલ્શિયમ સપ્લિમેન્ટ્સ — આ ચૂકશો નહીં</li></ul>",
      'preg.card3':'<h4>શેનાથી દૂર રહેવું</h4><ul><li>કાચા અથવા અધકચરા ઈંડા, માંસ, અને પાશ્ચરાઇઝ ન કરેલ ડેરી</li><li>કાચું/અધપાકું પપૈયું અને મોટા પ્રમાણમાં અનાનસ</li><li>વધારે કેફીન — ઓછામાં ઓછું રાખો</li><li>દારૂ અને ધૂમ્રપાન — સંપૂર્ણપણે ટાળો</li><li>વધારે મરક્યુરીવાળી માછલી (અમુક મોટી દરિયાઈ માછલી)</li><li>ધોયા વગરના ફળો/શાકભાજી અને રસ્તા પરનું કાચું સલાડ</li></ul>',
      'preg.tageatwell':'સારું ખાઓ','preg.tagavoid':'બહેતર છે ટાળવું',
      'preg.walk':'<h4>ચાલવું અને રોજિંદી લય</h4><p style="font-size:.92rem;color:#4a3835;">એક લાંબા ચાલવા કરતાં બે ટૂંકા ચાલવા (સવારે અને સાંજે) સામાન્ય રીતે શરીર માટે સરળ હોય છે. સમતળ જમીન પર ચાલો, આરામદાયક પગરખાં પહેરો, અને હંમેશા પાણી સાથે રાખો. જો શ્વાસ ચડે, ચક્કર આવે, અથવા પેટમાં ખેંચાણ લાગે તો રોકાઈને આરામ કરો.</p>',
      'preg.delivery':'<h4>સામાન્ય પ્રસૂતિ માટે તૈયારી</h4><p style="font-size:.92rem;color:#4a3835;">સક્રિય રહેવું, રોજ ધીમો શ્વાસ લેવાનો અભ્યાસ, એન્ટેનેટલ/બર્થ-પ્રેપ ક્લાસમાં જવું, અને વાસ્તવિક અપેક્ષાઓ રાખવી — આ બધું મદદ કરે છે. પણ યાદ રાખો — તમારું બાળક ગમે તે રીતે આવે, યોનિમાર્ગે કે સિઝેરિયનથી, તમે સૌથી અઘરું, સૌથી બહાદુર કામ કર્યું હશે. માતા બનવાની કોઈ "વધુ સારી" રીત નથી.</p>',
      'preg.stickereased':'🎯 દુખાવો અને તકલીફ, ઓછી થઈ','preg.acheh3':'સામાન્ય તકલીફો — અને ખરેખર શું મદદ કરે છે',
      'preg.achep':'ગર્ભાવસ્થાની તકલીફ સાચી હોય છે. અહીં જણાવ્યું છે કે ત્રણ મોટી તકલીફો માટે શું કરવું.',
      'preg.backpain':'<h4>પીઠનો દુખાવો</h4><p style="font-size:.88rem;color:#4a3835;">પડખે સૂઈ જાઓ, ઘૂંટણ વચ્ચે એક ઓશીકું અને એક પેટને ટેકો આપવા માટે રાખો. પીઠના નીચેના ભાગ પર હૂંફાળો (ગરમ નહીં) શેક અને હળવા કેટ-કાઉ સ્ટ્રેચ બંને દિવસભર મદદ કરે છે.</p>',
      'preg.swelling':'<h4>પગ અને પગની ઘૂંટીમાં સોજો</h4><p style="font-size:.88rem;color:#4a3835;">દિવસમાં થોડી વાર 15–20 મિનિટ માટે પગને હૃદયના સ્તરથી ઉપર રાખો, લાંબા સમય સુધી ઊભા રહેવાનું ટાળો, પૂરતું પાણી પીવો, અને મીઠાવાળા નાસ્તા ઓછા કરો. અચાનક અથવા એક બાજુના સોજા માટે ડૉક્ટર પાસે તપાસ કરાવો.</p>',
      'preg.heartburn':'<h4>છાતીમાં બળતરા અને એસિડિટી</h4><p style="font-size:.88rem;color:#4a3835;">મોટા ભોજનને બદલે નાનું, વારંવાર ભોજન કરો, સાંજે તીખો/તળેલો ખોરાક ટાળો, અને ખાધા પછી ઓછામાં ઓછું 30 મિનિટ સીધા બેસો. કોઈ પણ એન્ટાસિડ લેતા પહેલા ડૉક્ટરને પૂછો.</p>',

      'myth1.tag':'ભ્રમ','myth1.q':'પીરિયડ્સ "અપવિત્ર" હોય છે અને આ દરમિયાન રસોડામાં કે મંદિરમાં ન જવું જોઈએ.','myth1.tag2':'સત્ય','myth1.a':'માસિક રક્ત ફક્ત ગર્ભાશયની અસ્તર છૂટવાનું છે — તે ગંદું કે અપવિત્ર નથી. મંદિરમાં જવું એ વ્યક્તિગત કે સાંસ્કૃતિક પસંદગી છે, આરોગ્યની જરૂરિયાત નથી.',
      'myth2.tag':'ભ્રમ','myth2.q':'પહેલી વાર સેક્સ કરવાથી ગર્ભાવસ્થા થતી નથી.','myth2.tag2':'સત્ય','myth2.a':'ઓવ્યુલેશનની આસપાસ ગમે ત્યારે અસુરક્ષિત સંપર્કથી પહેલી વારમાં પણ ગર્ભાવસ્થા થઈ શકે છે. કોઈ પણ "સુરક્ષિત" પહેલી વાર હોતી નથી.',
      'myth3.tag':'ભ્રમ','myth3.q':'PCOD/PCOS નો અર્થ છે કે તમે ક્યારેય બાળકો પેદા કરી શકશો નહીં.','myth3.tag2':'સત્ય','myth3.a':'PCOD ધરાવતી મોટાભાગની સ્ત્રીઓ કુદરતી રીતે અથવા તબીબી મદદ (જેમ કે ઓવ્યુલેશન ઇન્ડક્શન) થી ગર્ભધારણ કરે છે. તેમાં સમય વધુ લાગી શકે — તેનો અર્થ "ક્યારેય નહીં" નથી.',
      'myth4.tag':'ભ્રમ','myth4.q':'ગર્ભાવસ્થામાં કસરત કરવાથી બાળકને નુકસાન થાય છે.','myth4.tag2':'સત્ય','myth4.a':'ડૉક્ટરની મંજૂરીવાળી હળવી કસરત ખરેખર સરળ પ્રસૂતિ અને સારા પરિણામો સાથે જોડાયેલી છે. સંપૂર્ણ બેડ રેસ્ટ ફક્ત ચોક્કસ તબીબી કારણોસર જ સલાહ આપવામાં આવે છે.',
      'myth5.tag':'ભ્રમ','myth5.q':'ગર્ભાવસ્થામાં અમુક ખોરાક ખાવાથી બાળકનું લિંગ નક્કી થાય છે.','myth5.tag2':'સત્ય','myth5.a':'બાળકનું લિંગ ગર્ભધારણ સમયે રંગસૂત્રો દ્વારા નક્કી થાય છે, ખોરાકથી નહીં. કોઈ પણ ખોરાક તેને બદલતો નથી — અને ભારતમાં તેને તપાસવું કે બદલવાનો પ્રયાસ કરવો PCPNDT કાયદા હેઠળ ગેરકાયદેસર પણ છે.',
      'myth6.tag':'ભ્રમ','myth6.q':'સિઝેરિયનનો અર્થ છે કે તમે પ્રસૂતિમાં "નિષ્ફળ" ગયા.','myth6.tag2':'સત્ય','myth6.a':'સિઝેરિયન એક તબીબી નિર્ણય છે જે સલામતી માટે લેવાય છે, તે તાકાત કે માતૃત્વનું માપદંડ નથી. બંને રીતે બાળક એટલી જ સાચી રીતે દુનિયામાં આવે છે.',

      'calm.card1':'<h4 style="color:var(--on-dark-band);">હળવી વેબ સિરીઝ</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>કમ્ફર્ટ સિટકોમ્સ (Friends, The Big Bang Theory)</li><li>તીવ્ર થ્રિલર કરતાં હળવા કૌટુંબિક ડ્રામા</li><li>નેચર/ટ્રાવેલ ડોક્યુમેન્ટરી — શાંત દ્રશ્યો, કોઈ કથાનો તણાવ નહીં</li><li>જૂના, પરિચિત મનપસંદ શો જે આરામ કરતી વખતે અડધા-અડધા જોઈ શકાય</li></ul>',
      'calm.card2':'<h4 style="color:var(--on-dark-band);">સાંભળવા જેવા પોડકાસ્ટ</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>પ્રમાણિત ડૌલા અથવા OB-GYN દ્વારા ગર્ભાવસ્થા અને બર્થ-પ્રેપ પોડકાસ્ટ</li><li>શાંત વાર્તા કહેતા અથવા "સ્લીપ સ્ટોરી" જેવા પોડકાસ્ટ</li><li>અઘરા દિવસોમાં મૂડ સુધારવા હળવા કોમેડી પોડકાસ્ટ</li><li>ગાઇડેડ મેડિટેશન અને શ્વાસ લેવાની ઓડિયો સિરીઝ</li></ul>',
      'calm.card3':'<h4 style="color:var(--on-dark-band);">મંત્રો અને શાંત વિધિઓ</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>ૐ નો જાપ અથવા ગાયત્રી મંત્ર, ધીમેથી, 5–10 મિનિટ માટે</li><li>સરળ પુષ્ટિકરણ: "મારું શરીર જાણે છે કે આ કેવી રીતે કરવું"</li><li>ધીમો પેટનો શ્વાસ (4 ગણતરીમાં શ્વાસ લો, 6 ગણતરીમાં છોડો)</li><li>રોજનો એક ટૂંકો આભારની નોંધ — એક લીટી પણ પૂરતી</li></ul>',
      'calm.card4':'<h4 style="color:var(--on-dark-band);">શાંતિ માટે ગીતો</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>બેકગ્રાઉન્ડ શાંતિ માટે સોફ્ટ ઇન્સ્ટ્રુમેન્ટલ અથવા લો-ફાઈ પ્લેલિસ્ટ</li><li>શાંતિ આપતા શાસ્ત્રીય રાગ (સાંજના રાગ સારા રહે છે)</li><li>જો શાંતિ મળે તો હળવા ભક્તિ ભજન</li><li>જૂના મધુર બોલિવૂડ ગીતો જે ભેટવા જેવો અહેસાસ આપે</li></ul>',
      'calm.card5':'<h4 style="color:var(--on-dark-band);">મન માટે વાંચન</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>ભારે, તણાવપૂર્ણ કથાનકને બદલે હળવી ફિક્શન અથવા ટૂંકી વાર્તાઓ</li><li>એક ભરોસાપાત્ર ગર્ભાવસ્થા વીક-બાય-વીક ગાઈડ</li><li>જર્નલિંગ — દિવસમાં ફક્ત ત્રણ લીટીઓ પણ તમારી લાગણીઓ વિશે</li><li>તમારા બાળકને પત્રો, જે ક્યારેક સાથે વાંચી શકાય</li></ul>',
      'calm.card6':'<h4 style="color:var(--on-dark-band);">જો ચિંતા ભારે લાગે</h4><ul style="color:var(--on-dark-band);opacity:.85;"><li>તમારા પાર્ટનર, મમ્મી, અથવા નજીકના મિત્ર સાથે વાત કરો — ચૂપચાપ સહન ન કરો</li><li>સતત ઉદાસી, ચિંતા, અથવા નિરાશા માટે ડૉક્ટર સાથે વાત કરવી જરૂરી છે — તે સામાન્ય છે અને સારવાર શક્ય છે, તે નબળાઈ નથી</li><li>એન્ટેનેટલ ક્લાસ ઘણીવાર તમને એ જ સમયે એ જ વસ્તુમાંથી પસાર થતી બીજી સ્ત્રીઓ સાથે જોડે છે</li></ul>',

      'tools.tab1':'સાયકલ ટ્રેકર','tools.tab2':'પ્રેગનેન્સી વીક-બાય-વીક','tools.tab3':'ડ્યૂ ડેટ કેલ્ક્યુલેટર','tools.tab4':'લક્ષણ તપાસ','tools.tab5':'કિક કાઉન્ટર',
      'tools.h1':'આ પીરિયડની શરૂઆતની તારીખ નોંધો','tools.lbl1':'તમારા સૌથી તાજેતરના પીરિયડનો પહેલો દિવસ','tools.lbl2':'તમારા સાયકલની સામાન્ય લંબાઈ (દિવસોમાં)',
      'tools.btn1':'સેવ કરો અને અંદાજ લગાવો →','tools.btn2':'ઇતિહાસ સાફ કરો',
      'tools.note1':'અંદાજ તમારી સરેરાશ પર આધારિત છે — સાચી સાયકલ તણાવ, બીમારી, અને PCOD સાથે બદલાય છે. જો સાયકલ સતત અનિયમિત રહે, તો ડૉક્ટરને જણાવો.',
      'tools.h2':'જુઓ તમે કયા અઠવાડિયામાં છો','tools.lbl3':'તમારા છેલ્લા માસિકનો પહેલો દિવસ (LMP)','tools.btn3':'મારું અઠવાડિયું બતાવો →',
      'tools.note2':'તમારા છેલ્લા પીરિયડથી ગણીને પ્રમાણભૂત 40-અઠવાડિયાની ગર્ભાવસ્થા પર આધારિત છે — જો અલ્ટ્રાસાઉન્ડની તારીખ અલગ હોય તો તે વધુ ચોક્કસ છે.',
      'tools.h3':'તમારી ડ્યૂ ડેટનો અંદાજ લગાવો','tools.lbl4':'તમારા છેલ્લા માસિકનો પહેલો દિવસ','tools.btn4':'ગણતરી કરો →',
      'tools.note3':'આ પ્રમાણભૂત 280-દિવસના અંદાજ (નેગેલેના નિયમ) નો ઉપયોગ કરે છે. તમારી સાચી ડિલિવરી તારીખ આની આસપાસ 2-અઠવાડિયાની રેન્જમાં ગમે ત્યાં હોઈ શકે.',
      'tools.h4':'શું આ સામાન્ય છે, કે મારે ડૉક્ટરને કૉલ કરવો જોઈએ?','tools.p4':'અત્યારે તમને જે અનુભવાય તેના પર ટિક કરો.','tools.btn5':'તપાસો →',
      'tools.note4':'આ એક સામાન્ય માર્ગદર્શિકા છે, નિદાન નથી. શંકા હોય ત્યારે ડૉક્ટરને કૉલ કરવામાં થોડી મિનિટો જાય છે — કંઈક ગંભીરને અવગણવાથી ઘણું વધારે ગુમાવવું પડી શકે.',
      'tools.h5':'તમારા બાળકની હલનચલન ગણો','tools.p5':'28મા અઠવાડિયાથી ઉપયોગ કરવો શ્રેષ્ઠ છે. આરામથી બેસો કે સૂઈ જાઓ, અને જ્યારે પણ કિક, હલનચલન, કે ફફડાટ અનુભવાય ત્યારે ટેપ કરો.',
      'tools.btn6':'સેશન રીસેટ કરો',
      'tools.note5':'2 કલાકમાં 10 થી ઓછી હલનચલન (એકવાર તમને બાળકની પેટર્નની આદત પડી જાય પછી) ડૉક્ટરને તરત કૉલ કરવાનું કારણ છે.',
      'tools.kickslabel':'કિક','tools.minlabel':'મિનિટ પસાર થઈ',
      'tools.age':'ઉંમર','tools.height':'ઊંચાઈ','tools.weight':'વજન','tools.curweight':'હાલનું વજન',
      'tools.aih4':'✨ પર્સનલાઇઝ્ડ માહિતી જોઈએ છે?',
      'tools.aip1':'વૈકલ્પિક — આ ઉમેરવાથી સખી AI વધુ સુસંગત, વ્યક્તિગત જવાબ આપી શકે છે. અહીં કંઈ પણ ક્યાંય સેવ થતું નથી.',
      'tools.aip2':'વૈકલ્પિક — આ સખી AI ને તમારા માટે જવાબ વધુ યોગ્ય બનાવવામાં મદદ કરે છે. આ સામાન્ય માર્ગદર્શન છે, તમારા ડૉક્ટરની સલાહનો વિકલ્પ નથી.',
      'tools.aibtn':'✨ AI માહિતી મેળવો',
      'tools.sym1':'ભારે રક્તસ્ત્રાવ — દર કલાકે પેડ/ટેમ્પોન પલળી જવું','tools.sym2':'તીવ્ર પેટનો દુખાવો જે ઓછો થતો નથી',
      'tools.sym3':'100.4°F (38°C) થી વધુ તાવ','tools.sym4':'ઝાંખી દ્રષ્ટિ અથવા સોજા સાથે તીવ્ર માથાનો દુખાવો (જો ગર્ભવતી હો)',
      'tools.sym5':'બાળકની હલનચલન ઓછી થવી અથવા ન થવી (જો ગર્ભવતી હો, 28 અઠવાડિયા પછી)','tools.sym6':'પ્રવાહી લીક થવું અથવા બેભાન થવું',
      'tools.sym7':'હળવો દુખાવો અથવા પીઠના નીચેના ભાગમાં દુખાવો','tools.sym8':'સોજો અથવા હળવા મૂડ સ્વિંગ્સ',
      'tools.sym9':'આ મહિને પ્રવાહ અથવા સાયકલની લંબાઈમાં થોડો ફેરફાર','tools.sym10':'હળવી ઉબકા અથવા થાક (જો ગર્ભવતી હો)'
    }
  };
  document.querySelectorAll('#langswitch button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#langswitch button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.dataset.lang;
      document.querySelectorAll('[data-i18n]').forEach(el=>{
        const key = el.dataset.i18n;
        if(i18n[lang] && i18n[lang][key]) el.innerHTML = i18n[lang][key];
      });
    });
  });


  // Preserve links shared before the site was split into topic pages.
  if (location.pathname.endsWith('/index.html') || location.pathname === '/') {
    const moved = { '#ask-sakhi':'#ai-voice', '#periods-care':'periods.html#periods-care', '#pregnancy-care':'pregnancy.html#pregnancy-care', '#faqs':'faqs.html#faqs', '#myths':'faqs.html#myths', '#tools':'tools.html#tools', '#mind-calm':'wellbeing.html#mind-calm', '#stories':'wellbeing.html#stories', '#voice-support':'wellbeing.html#voice-support', '#find-doctor':'care.html#find-doctor', '#about':'about.html#about' };
    if (moved[location.hash]) location.replace(moved[location.hash]);
  }
