// Narrow, source-backed educational definition. Clinical translation review pending.
// Sources: https://www.cdc.gov/hygiene/about/menstrual-hygiene.html
// https://my.clevelandclinic.org/health/articles/10132-menstrual-cycle
(() => {
  'use strict';
  const replies = {
    en: 'The menstrual cycle runs from the first day of one period to the first day of the next. Hormones prepare the uterus for a possible pregnancy. If pregnancy does not occur, blood and tissue from the lining of the uterus leave through the vagina: this is a period. Cycle length varies.',
    hi: 'मासिक धर्म चक्र एक पीरियड के पहले दिन से अगले पीरियड के पहले दिन तक गिना जाता है। हार्मोन गर्भाशय को संभावित गर्भावस्था के लिए तैयार करते हैं। गर्भधारण न होने पर गर्भाशय की अंदरूनी परत का रक्त और ऊतक योनि से बाहर निकलते हैं; इसे पीरियड कहते हैं। चक्र की अवधि अलग-अलग हो सकती है।',
    gu: 'માસિક ચક્ર એક માસિકના પહેલા દિવસથી આવતા માસિકના પહેલા દિવસ સુધી ગણાય છે. હોર્મોન્સ ગર્ભાશયને સંભવિત ગર્ભાવસ્થા માટે તૈયાર કરે છે. ગર્ભ ન રહે તો ગર્ભાશયની અંદરની પરતમાંથી લોહી અને પેશી યોનિ દ્વારા બહાર આવે છે; તેને માસિક કહે છે. ચક્રની લંબાઈ વ્યક્તિએ વ્યક્તિએ બદલાઈ શકે છે.',
    hinglish: 'Menstrual cycle ek period ke pehle din se agle period ke pehle din tak gina jata hai. Hormones uterus ko pregnancy ke liye taiyar karte hain. Pregnancy na hone par uterus ki andar ki lining ka blood aur tissue vagina se bahar aata hai; ise period kehte hain. Cycle ki length alag ho sakti hai.'
  };
  const definition = /^(?:(?:what is (?:the )?menstrual cycle)[?.! ]*(?:explain simply[.! ]*)?|मासिक (?:धर्म )?चक्र क्या है[?। ]*|માસિક ચક્ર શું છે[?। ]*|menstrual cycle kya hai[?.! ]*)$/iu;
  window.SakhiBasics = {
    answer(question, language) {
      if(!definition.test(question.trim())) return null;
      const forced = {'en-IN':'en','hi-IN':'hi','gu-IN':'gu',en:'en',hi:'hi',gu:'gu',hinglish:'hinglish'}[language];
      const detected = /[\u0A80-\u0AFF]/u.test(question) ? 'gu' : /[\u0900-\u097F]/u.test(question) ? 'hi' : /\bkya\b/i.test(question) ? 'hinglish' : 'en';
      return replies[forced || detected];
    }
  };
})();
