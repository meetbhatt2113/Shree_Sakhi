import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import worker from '../sakhi-ai-worker.mjs';
const base = 'https://sakhi-ai-proxy.bhattmeet2113.workers.dev';
const post = (body,path='/',headers={}) => new Request(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body});
assert.equal((await worker.fetch(post('{bad'),{})).status,400);
assert.equal((await worker.fetch(post(JSON.stringify({message:'Hello'})),{})).status,503);
assert.equal((await worker.fetch(post('{}','/not-a-route'),{})).status,404);
assert.equal((await worker.fetch(post('{}','/',{Origin:'https://other.example'}),{})).status,403);
assert.equal((await worker.fetch(post('x'.repeat(32769)),{})).status,413);
assert.equal((await worker.fetch(post(JSON.stringify({message:'x'.repeat(4001)})),{GROQ_API_KEY:'test-placeholder'})).status,400);
let keys=[];
const limited=await worker.fetch(post('{}'),{SAKHI_RATE_LIMITER:{limit:async({key})=>{keys.push(key);return {success:false}}}});
assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');assert.deepEqual(keys,['/']);
assert.equal((await worker.fetch(post('{}'),{SAKHI_RATE_LIMITER:{limit:async()=>{throw Error('unavailable')}}})).status,503);
assert.equal((await worker.fetch(new Request(base,{method:'OPTIONS',headers:{Origin:'https://shreesakhiiiii.vercel.app'}}),{})).headers.get('Access-Control-Allow-Origin'),'https://shreesakhiiiii.vercel.app');

class Element {
  constructor(){this.value='';this.children=[];this.listeners={};this.textContent='';this.disabled=false;this.maxLength=1200;}
  append(...values){this.children.push(...values);}
  replaceChildren(){this.children=[];}
  addEventListener(name,fn){this.listeners[name]=fn;}
  fire(name){this.listeners[name]?.({preventDefault(){}});}
}
const inputs=Object.fromEntries(['reason','start','period','impact','medicines','questions','doctor','clinic','appointmentDate','appointmentTime','duration'].map(key=>[key,new Element()]));
const ids=Object.fromEntries(['visitForm','visitStatus','visitOutput','visitPrintButton','visitDate','visitSave','visitErase','visitCalendarButton','visitCalendarStatus','visitAppointment','visitAppointmentDetails'].map(key=>[key,new Element()]));
ids.visitForm.elements={namedItem:key=>inputs[key]};ids.visitForm.reset=()=>Object.values(inputs).forEach(el=>el.value='');
const saved=new Map();let writes=0,printed=0;
const env={document:{getElementById:id=>ids[id],createElement:()=>new Element()},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>{writes++;saved.set(key,value)},removeItem:key=>saved.delete(key)},window:{print:()=>printed++},Date,JSON,crypto:webcrypto,TextEncoder};
vm.runInNewContext(readFileSync(new URL('../calendar-reminder.js',import.meta.url),'utf8'),env);
vm.runInNewContext(readFileSync(new URL('../visit-summary.js',import.meta.url),'utf8'),env);
inputs.reason.value='<img src=x onerror=alert(1)> Sample notes';
ids.visitForm.fire('input');assert.equal(writes,0,'Typing must not persist notes');
ids.visitForm.fire('submit');assert.equal(writes,0,'Preview must not persist notes');
assert.equal(ids.visitOutput.children[0].children[1].textContent,inputs.reason.value,'User content must be plain text');
ids.visitSave.fire('click');assert.equal(writes,1);assert.ok(saved.has('ss_visit_draft_v1'));
ids.visitPrintButton.fire('click');assert.equal(printed,1);
ids.visitErase.fire('click');assert.equal(saved.size,0);assert.equal(inputs.reason.value,'');assert.equal(ids.visitPrintButton.disabled,true);
ids.visitPrintButton.fire('click');assert.equal(printed,1,'Empty summary must not print');
env.localStorage.setItem=()=>{throw Error('blocked')};inputs.reason.value='Unsaved note';ids.visitSave.fire('click');assert.match(ids.visitStatus.textContent,/could not save/);
console.log('PASS: Worker boundaries, CORS, rate-limit behavior; appointment opt-in saving, plain text rendering, print, erase and storage failure.');

// Late replies from a cancelled request must never appear or start speaking.
const voiceSource=readFileSync(new URL('../site.js',import.meta.url),'utf8');
const askFunction=voiceSource.slice(voiceSource.indexOf('  async function askSakhiAI(userText'),voiceSource.indexOf('  /* ---------- VOICE SELECTION'));
const stopFunction=voiceSource.slice(voiceSource.indexOf('  function stopSakhiActivity(){'),voiceSource.indexOf('  function replayLastAnswer()'));
const voiceElements={sendQuestion:{disabled:false},replayLast:{disabled:true},autoSpeak:{checked:true}};
let resolveReply;const bubbles=[];let spoken=0;
const scope=vm.createContext({AbortController,clearTimeout,document:{getElementById:id=>voiceElements[id]||{remove(){}}},setLiveStatus(){},setListeningUI(){},stopSpeech(){},speak(){spoken++},addBubble(role,text){bubbles.push({role,text});return 'thinking'},askSakhiAIRaw:()=>new Promise(resolve=>{resolveReply=resolve})});
vm.runInContext(`let recordingGeneration=0,recordingStarting=false,recordingTimer=null,mediaRecorder=null,recognition=null,transcriptionController=null,answerController=null,lastAnswer='';${askFunction}\n${stopFunction}`,scope);
const pending=vm.runInContext("askSakhiAI('Example question','en')",scope);
assert.equal(voiceElements.sendQuestion.disabled,true);
vm.runInContext('stopSakhiActivity()',scope);resolveReply('Must not show');await pending;
assert.equal(bubbles.filter(b=>b.role==='ai').length,0);assert.equal(spoken,0);assert.equal(voiceElements.sendQuestion.disabled,false);
console.log('PASS: cancelling a reply suppresses late answers and speech and restores Send.');

// Failed requests restore the question, but never overwrite the user's next draft.
voiceElements.typedQuestion={value:''};
scope.askSakhiAIRaw=async()=>{throw new Error('offline')};
await vm.runInContext("askSakhiAI('Retry this question','en')",scope);
assert.equal(voiceElements.typedQuestion.value,'Retry this question');
voiceElements.typedQuestion.value='My next question';
await vm.runInContext("askSakhiAI('Previous question','en')",scope);
assert.equal(voiceElements.typedQuestion.value,'My next question');

// Replay must invoke device speech synchronously, before Safari's tap gesture expires.
const replaySource=voiceSource.slice(voiceSource.indexOf('  function replayOnDevice('),voiceSource.indexOf('  /* ---------- LANGUAGE TOGGLE'));
const replayCalls=[];
const replayScope=vm.createContext({stopSpeech:()=>replayCalls.push('stop'),speakWithDevice:(text)=>replayCalls.push(text)});
vm.runInContext(`let answerController=null,transcriptionController=null,isListening=false,recordingStarting=false,currentSpeech=1; const replyTexts={sample:'Hello'}; ${replaySource}`,replayScope);
vm.runInContext("replaySpeech('sample')",replayScope);
assert.deepEqual(replayCalls,['stop','Hello']);
vm.runInContext("isListening=true; replaySpeech('sample')",replayScope);
assert.equal(replayCalls.length,2,'Replay cannot interrupt recording');

const basicsScope={window:{}};
vm.runInNewContext(readFileSync(new URL('../menstrual-basics.js',import.meta.url),'utf8'),basicsScope);
assert.equal(basicsScope.window.SakhiBasics.answer('What is the menstrual cycle? I am bleeding heavily and dizzy.','en'),null,'Longer symptom questions must not be intercepted');
assert.match(basicsScope.window.SakhiBasics.answer('માસિક ચક્ર શું છે?','auto'),/ગર્ભાશય/);
for(const [language,pattern] of [['en',/lining of the uterus/],['hi',/गर्भाशय/],['gu',/ગર્ભાશય/],['hinglish',/uterus/]]){
  const response=await worker.fetch(post(JSON.stringify({message:'What is the menstrual cycle? Explain simply.',language})),{GROQ_API_KEY:'test-placeholder'});
  assert.equal(response.status,200);
  const reply=(await response.json()).reply;
  assert.match(reply,pattern);
  assert.equal(basicsScope.window.SakhiBasics.answer('What is the menstrual cycle? Explain simply.',language),reply,'Website and Worker definitions must agree');
}
console.log('PASS: failed-question restoration, draft preservation, synchronous device replay and multilingual menstrual definition.');


// Calendar times are India Standard Time, regardless of the device time zone.
const calendar=env.window.SakhiCalendar;
const appointment={doctor:'Dr. Example',clinic:'Clinic, East; Wing\nBEGIN:VEVENT',appointmentDate:'2030-01-02',appointmentTime:'00:15',duration:'30',reason:'PRIVATE SYMPTOM NOTE'};
const ics=calendar.build(appointment,'test-event',new Date('2029-01-01T00:00:00Z'));
const unfolded=ics.replace(/\r\n /g,'');
assert.match(unfolded,/DTSTART:20300101T184500Z/);
assert.match(unfolded,/DTEND:20300101T191500Z/);
assert.match(unfolded,/TRIGGER:-PT15M/);
assert.match(unfolded,/STATUS:TENTATIVE/);
assert.ok(!ics.includes('PRIVATE SYMPTOM NOTE'));
assert.equal(unfolded.split('\r\n').filter(line=>line==='BEGIN:VEVENT').length,1,'User text cannot inject calendar components');
assert.ok(unfolded.includes('LOCATION:Clinic\\, East\\; Wing\\nBEGIN:VEVENT'));
for(const invalid of [{appointmentDate:'2030-02-31',appointmentTime:'10:00'},{appointmentDate:'',appointmentTime:''},{appointmentDate:'2030-01-01',appointmentTime:'25:00'}])assert.equal(calendar.startDate(invalid),null);
assert.throws(()=>calendar.build({...appointment,appointmentDate:'2000-01-01'},'test-event'),/future/);
assert.throws(()=>calendar.build({...appointment,duration:'999'},'test-event'),/duration/);
const unicode=calendar.build({...appointment,clinic:'ગુજરાતી ક્લિનિક '.repeat(12)},'unicode-event',new Date('2029-01-01'));
for(const line of unicode.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
assert.match(unicode.replace(/\r\n /g,''),/ગુજરાતી ક્લિનિક/);
inputs.doctor.value='Dr. Test';inputs.appointmentDate.value='2030-01-02';inputs.appointmentTime.value='10:00';inputs.duration.value='30';
ids.visitForm.fire('input');assert.equal(ids.visitCalendarButton.disabled,false);assert.equal(ids.visitAppointment.hidden,false);
assert.equal(ids.visitAppointmentDetails.children[1].textContent,'Dr. Test');
ids.visitErase.fire('click');assert.equal(ids.visitCalendarButton.disabled,true);assert.equal(ids.visitAppointment.hidden,true);
console.log('PASS: IST-to-UTC conversion, midnight rollover, past/invalid dates, ICS escaping and Unicode folding, symptom exclusion, appointment preview and clear.');
