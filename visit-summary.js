/* Appointment notes never leave this page through this feature. */
(() => {
  'use strict';
  const form = document.getElementById('visitForm');
  if(!form) return;
  const KEY = 'ss_visit_draft_v1';
  const fields = {reason:'What I want help with', start:'Symptoms began', period:'Last period start', impact:'Changes and impact on my day', medicines:'Medicines, supplements and allergies', questions:'Questions for my clinician'};
  const appointmentFields = {doctor:'Doctor',clinic:'Clinic / hospital',appointmentDate:'Date',appointmentTime:'Time (India Standard Time)',duration:'Calendar time reserved'};
  const allFields = {...appointmentFields,...fields};
  let eventUID = crypto.randomUUID();
  const calendarButton = document.getElementById('visitCalendarButton');
  const calendarStatus = document.getElementById('visitCalendarStatus');
  const status = document.getElementById('visitStatus');
  const output = document.getElementById('visitOutput');
  const printButton = document.getElementById('visitPrintButton');
  const read = () => Object.fromEntries(Object.keys(allFields).map(key=>[key,form.elements.namedItem(key).value.trim()]));
  const announce = text => {status.textContent = text;};
  function readableDate(value){
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if(!match) return value;
    const date = new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    return date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  }
  function preview(){
    const values = read();
    output.replaceChildren();
    let filled = 0;
    const hasAppointment=['doctor','clinic','appointmentDate','appointmentTime'].some(key=>!!values[key]);
    const appointmentBox=document.getElementById('visitAppointment');
    const appointmentDetails=document.getElementById('visitAppointmentDetails');
    appointmentBox.hidden=!hasAppointment;
    appointmentDetails.replaceChildren();
    if(hasAppointment){
      for(const [key,label] of Object.entries(appointmentFields)){
        if(!values[key]) continue;
        const dt=document.createElement('dt');dt.textContent=label;
        const dd=document.createElement('dd');
        dd.textContent=key==='appointmentDate' ? readableDate(values[key]) : key==='appointmentTime' ? values[key]+' IST (UTC+05:30)' : key==='duration' ? values[key]+' minutes (personal reminder)' : values[key];
        appointmentDetails.append(dt,dd);
      }
    }
    const appointmentStart=window.SakhiCalendar.startDate(values);
    calendarButton.disabled=!(appointmentStart && appointmentStart>new Date());
    calendarStatus.textContent=appointmentStart && appointmentStart<=new Date() ? 'This appointment time is in the past. You can print these notes, but a reminder needs a future date and time.' : calendarButton.disabled ? 'Add a valid future date and time (IST) to download a calendar reminder.' : 'Ready to download. Import the .ics file into your calendar. It requests an alert 15 minutes before; check your calendar notification settings.';
    for(const [key,label] of Object.entries(fields)){
      if(!values[key]) continue;
      filled++;
      const section = document.createElement('section');
      section.className = 'visit-doc-section';
      const title = document.createElement('h4'); title.textContent = String(filled).padStart(2,'0')+' / '+label;
      const text = document.createElement('p'); text.textContent = ['start','period'].includes(key) ? readableDate(values[key]) : values[key];
      section.append(title,text); output.append(section);
    }
    if(!filled && !hasAppointment){ const p=document.createElement('p');p.textContent='Add at least one note to create a summary.'; output.append(p); }
    document.getElementById('visitDate').textContent = (filled || hasAppointment) ? new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
    printButton.disabled = !(filled || hasAppointment);
    return !!(filled || hasAppointment);
  }
  form.addEventListener('submit', event=>{event.preventDefault(); if(preview()) announce('Preview updated. Check the details before printing.');else announce('Add at least one note first.');});
  form.addEventListener('input', ()=>{ preview(); announce('Changes are not saved. Choose Save on this device if you want to keep this version.'); });
  document.getElementById('visitSave').addEventListener('click', ()=>{
    if(!preview()){announce('Add a note before saving.');return;}
    try{localStorage.setItem(KEY,JSON.stringify({version:1,values:read(),eventUID}));announce('Saved in this browser. Use Clear notes & saved draft to remove it.');}
    catch{announce('Your browser could not save this draft. You can still print it.');}
  });
  document.getElementById('visitErase').addEventListener('click', ()=>{
    let removed = true;
    try{localStorage.removeItem(KEY);}catch{removed=false;}
    form.reset(); eventUID=crypto.randomUUID(); preview();
    announce(removed ? 'Notes and saved draft cleared from this browser. Exported files are not deleted.' : 'Notes cleared on this page. Browser storage could not be cleared; use your browser’s site-data controls.');
  });
  calendarButton.addEventListener('click', ()=>{
    try{
      const values=read();
      const calendar=window.SakhiCalendar.build(values,eventUID);
      const blob=new Blob([calendar],{type:'text/calendar;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url; link.download='shree-sakhi-appointment-'+values.appointmentDate+'.ics';
      document.body.append(link); link.click(); link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      calendarStatus.textContent='Calendar file prepared. Open or import the download to add your reminder. No appointment has been booked or confirmed.';
    }catch(error){calendarStatus.textContent=error.message||'Unable to create a reminder. Please check the date and time.';}
  });
  printButton.addEventListener('click', ()=>{if(preview())window.print();});
  try{
    const saved = JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved?.version === 1 && saved.values && typeof saved.values === 'object'){
      for(const key of Object.keys(allFields)){
        const field=form.elements.namedItem(key);
        if(typeof saved.values[key] === 'string') field.value=saved.values[key].slice(0,field.maxLength>0?field.maxLength:10);
      }
      if(typeof saved.eventUID === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(saved.eventUID)) eventUID=saved.eventUID;
      preview(); announce('Loaded the draft saved in this browser. Changes are saved only when you choose Save.');
    }
  }catch{announce('Saved draft unavailable. You can create a new summary without saving.');}
})();

