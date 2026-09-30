import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
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
const inputs=Object.fromEntries(['reason','start','period','impact','medicines','questions'].map(key=>[key,new Element()]));
const ids=Object.fromEntries(['visitForm','visitStatus','visitOutput','visitPrintButton','visitDate','visitSave','visitErase'].map(key=>[key,new Element()]));
ids.visitForm.elements={namedItem:key=>inputs[key]};ids.visitForm.reset=()=>Object.values(inputs).forEach(el=>el.value='');
const saved=new Map();let writes=0,printed=0;
const env={document:{getElementById:id=>ids[id],createElement:()=>new Element()},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>{writes++;saved.set(key,value)},removeItem:key=>saved.delete(key)},window:{print:()=>printed++},Date,JSON};
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
