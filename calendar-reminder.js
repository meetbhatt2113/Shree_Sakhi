/* Local iCalendar export. No accounts, network requests or symptom data. */
(() => {
  'use strict';
  const NOTICE = 'Appointment details entered by you—confirm directly with your clinic.';
  function startDate(values){
    const date=values.appointmentDate||'', time=values.appointmentTime||'';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)) return null;
    const result=new Date(date+'T'+time+':00+05:30');
    if(!Number.isFinite(result.getTime())) return null;
    if(new Date(result.getTime()+330*60000).toISOString().slice(0,16)!==date+'T'+time) return null;
    return result;
  }
  function escapeText(value){
    return String(value).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  }
  function foldLine(line){
    const encoder=new TextEncoder();let result='',bytes=0;
    for(const char of line){
      const size=encoder.encode(char).length;
      if(bytes+size>75){result+='\r\n ';bytes=1;}
      result+=char;bytes+=size;
    }
    return result;
  }
  const stamp = date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  function build(values, uid, now=new Date()){
    const start=startDate(values);
    if(!start) throw new Error('Enter a valid appointment date and time (India Standard Time).');
    if(start<=now) throw new Error('Choose a future appointment date and time for a reminder. You can still print past visit notes.');
    if(!/^[a-zA-Z0-9-]+$/.test(uid)) throw new Error('Invalid reminder ID.');
    const duration=Number(values.duration||30);
    if(![15,30,45,60].includes(duration)) throw new Error('Choose a calendar duration from the list.');
    const description=[NOTICE,'Time entered in India Standard Time (UTC+05:30).'];
    if(values.doctor) description.push('Doctor: '+values.doctor.slice(0,120));
    if(values.clinic) description.push('Clinic: '+values.clinic.slice(0,240));
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Shree Sakhi//Personal Appointment Reminder//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+uid+'@shreesakhi.local','DTSTAMP:'+stamp(now),'DTSTART:'+stamp(start),'DTEND:'+stamp(new Date(start.getTime()+duration*60000)),'SUMMARY:Doctor appointment (personal reminder)','STATUS:TENTATIVE','CLASS:PRIVATE','DESCRIPTION:'+escapeText(description.join('\n'))];
    if(values.clinic) lines.push('LOCATION:'+escapeText(values.clinic.slice(0,240)));
    lines.push('BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY','DESCRIPTION:Doctor appointment reminder','END:VALARM','END:VEVENT','END:VCALENDAR');
    return lines.map(foldLine).join('\r\n')+'\r\n';
  }
  window.SakhiCalendar=Object.freeze({startDate,build});
})();
