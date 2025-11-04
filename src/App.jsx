import React, { useState, useEffect, useRef } from "react";

function roundHalf(n){return Math.round(n*2)/2;}
const USERS=[{id:"J",name:"Γιάννης"},{id:"M",name:"Τερεζούλα"}];
const DAYS=[{id:"upperA",title:"Upper A",short:"Στήθος/Ώμοι"},{id:"lowerA",title:"Lower A",short:"Πόδια/Γλουτοί"},{id:"upperB",title:"Upper B",short:"Πλάτη/Ώμοι"},{id:"lowerB",title:"Lower B",short:"Πόδια/Σταθερότητα"}];
const PROGRAM={upperA:[{key:"chestPress",name:"Chest Press",suggested:35,muscle:"Στήθος"},{key:"shoulderPress",name:"Shoulder Press",suggested:18,muscle:"Ώμοι"},{key:"pecDeck",name:"Cable Fly / Pec Deck",suggested:20,muscle:"Στήθος"},{key:"latRaise",name:"Dumbbell Lateral Raise",suggested:6,muscle:"Ώμοι"},{key:"tricepsPushdown",name:"Triceps Pushdown",suggested:20,muscle:"Τρικέφαλοι"}],lowerA:[{key:"legPress",name:"Leg Press",suggested:140,muscle:"Τετρακέφαλοι"},{key:"legExt",name:"Leg Extension",suggested:40,muscle:"Τετρακέφαλοι"},{key:"lyingCurl",name:"Lying Leg Curl",suggested:30,muscle:"Οπίσθιοι"},{key:"rdead",name:"Dumbbell Romanian Deadlift",suggested:20,muscle:"Οπίσθιοι"},{key:"hipAbd",name:"Hip Abduction",suggested:30,muscle:"Γλουτοί"}],upperB:[{key:"latPulldown",name:"Lat Pulldown",suggested:45,muscle:"Πλάτη"},{key:"seatedRow",name:"Seated Row",suggested:40,muscle:"Πλάτη"},{key:"rearDelt",name:"Rear Delt Fly",suggested:6,muscle:"Ώμοι"},{key:"shrugs",name:"Dumbbell Shrugs",suggested:22,muscle:"Τραπέζιοι"},{key:"bicepsCurl",name:"Dumbbell Bicep Curl",suggested:10,muscle:"Δικέφαλοι"}],lowerB:[{key:"gobletSquat",name:"Goblet Squat",suggested:24,muscle:"Τετρακέφαλοι"},{key:"bulgarian",name:"Bulgarian Split Squat",suggested:12,muscle:"Τετρακέφαλοι"},{key:"hipThrust",name:"Hip Thrust",suggested:50,muscle:"Γλουτοί"},{key:"legCurl",name:"Leg Curl",suggested:35,muscle:"Οπίσθιοι"},{key:"calf",name:"Standing Calf Raise",suggested:0,muscle:"Γαστροκνήμιοι"}]};
const STORAGE_KEY="upperLower_dashboard_v3";

export default function WorkoutDashboard(){
  const [activeUser,setActiveUser]=useState(USERS[0].id);
  const [dayIndex,setDayIndex]=useState(0);
  const [notes,setNotes]=useState({});
  const [doneMap,setDoneMap]=useState({});
  const [actuals,setActuals]=useState({});
  const [bestMap,setBestMap]=useState({});
  const [history,setHistory]=useState([]);
  const [darkMode,setDarkMode]=useState(false);
  const [percentMap,setPercentMap]=useState({M:50});
  const saveTimeout=useRef(null);

  useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY); if(raw){const p=JSON.parse(raw); setNotes(p.notes||{}); setDoneMap(p.doneMap||{}); setActuals(p.actuals||{}); setBestMap(p.bestMap||{}); setHistory(p.history||[]); setDarkMode(p.darkMode??false); setPercentMap(p.percentMap||{M:50});}}catch(e){console.warn(e);}},[]);

  useEffect(()=>{ if(saveTimeout.current) clearTimeout(saveTimeout.current); saveTimeout.current=setTimeout(()=>{ const payload={notes,doneMap,actuals,bestMap,history,darkMode,percentMap}; try{localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));}catch(e){console.warn(e);} },450); return ()=>clearTimeout(saveTimeout.current);},[notes,doneMap,actuals,bestMap,history,darkMode,percentMap]);

  const activeDay=DAYS[dayIndex].id;

  function handleActualChange(exKey,value){
    const key=`${activeUser}_${activeDay}_${exKey}`;
    if(value===""){ setActuals(s=>{const c={...s}; delete c[key]; return c;}); return;}
    const num=Number(value); if(Number.isNaN(num)) return;
    setActuals(s=>({...s,[key]:num}));
    const bestKey=`${activeUser}_${exKey}_best`; setBestMap(s=>{const prev=s[bestKey]??0; if(num>prev) return {...s,[bestKey]:num}; return s;});
    const entry={user:activeUser,day:activeDay,exKey,weight:num,ts:new Date().toISOString()};
    setHistory(h=>[entry,...h].slice(0,1000));
  }

  function toggleDone(exKey){ const key=`${activeUser}_${activeDay}_${exKey}_done`; setDoneMap(s=>({...s,[key]:!s[key]}));}
  function updateNote(t){ const key=`${activeUser}_${activeDay}_note`; setNotes(s=>({...s,[key]:t}));}
  function nextDay(){ setDayIndex(i=>(i+1)%DAYS.length); }
  function prevDay(){ setDayIndex(i=>(i-1+DAYS.length)%DAYS.length); }
  function resetDay(){ const newDone={...doneMap}; PROGRAM[activeDay].forEach(ex=>{const key=`${activeUser}_${activeDay}_${ex.key}_done`; newDone[key]=false;}); setDoneMap(newDone); setNotes(s=>({...s,[`${activeUser}_${activeDay}_note`]:""}));}
  function completeAndNext(){ setDoneMap(s=>{const copy={...s}; PROGRAM[activeDay].forEach(ex=>{const key=`${activeUser}_${activeDay}_${ex.key}_done`; copy[key]=true;}); return copy;}); nextDay(); }

  function exportHistoryCSV(){ const rows=['user,day,exercise,weight,timestamp']; history.forEach(h=>{const userObj=USERS.find(u=>u.id===h.user); const userName=userObj?String(userObj.name):String(h.user); const day=String(h.day); const ex=String(h.exKey); const wt=String(h.weight); const ts=String(h.ts); rows.push(`\"${userName}\",\"${day}\",\"${ex}\",\"${wt}\",\"${ts}\"`); }); const csv=rows.join(\"\\n\"); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`workout-history-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url); }

  function computeSuggestedForUser(ex){ if(activeUser==='M'){ const pct=(percentMap['M']??50)/100; return roundHalf(ex.suggested*pct);} return ex.suggested; }
  function onPercentChange(userId,value){ const num=Number(value); if(Number.isNaN(num)) return; setPercentMap(s=>({...s,[userId]:Math.max(10,Math.min(100,Math.round(num)))})); }

  return (<div className={darkMode?"min-h-screen bg-slate-900 p-4 sm:p-6 text-slate-100":"min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-900"}>
    <div className={'max-w-md mx-auto rounded-2xl shadow-lg overflow-hidden '+(darkMode?"bg-slate-800 text-slate-100 border border-slate-700":"bg-white text-slate-900")}>
      <div className="p-4 border-b" style={{borderColor: darkMode?'#374151':undefined}}>
        <div className="flex items-center justify-between">
          <div><div className="text-sm text-slate-400">Πρόγραμμα Προπόνησης</div><div className="text-lg font-semibold">{DAYS[dayIndex].title} • {DAYS[dayIndex].short}</div></div>
          <div className="flex items-center gap-2">
            {USERS.map(u=> (<button key={u.id} onClick={()=>setActiveUser(u.id)} className={`px-3 py-1 rounded-full text-sm font-medium ${activeUser===u.id?'bg-emerald-500 text-white':(darkMode?'bg-slate-700 text-slate-200':'bg-slate-100 text-slate-700')}`}>{u.name}</button>))}
            <button onClick={()=>setDarkMode(d=>!d)} className="ml-2 px-3 py-1 rounded bg-slate-100 dark:bg-slate-700 text-sm">{darkMode?'Ανοιχτό':'Σκοτεινό'}</button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><button onClick={prevDay} className={`px-2 py-1 ${darkMode?'bg-slate-700':'bg-slate-100'} rounded`}>◀</button><div className="text-sm text-slate-500">{DAYS[dayIndex].title}</div><button onClick={nextDay} className={`px-2 py-1 ${darkMode?'bg-slate-700':'bg-slate-100'} rounded`}>▶</button></div>
          <div className="text-xs text-slate-500">3×13 • 45–60" ξεκούραση</div>
        </div>
      </div>

      <div className="p-4">
        {activeUser==='M' && (<div className={`mb-4 p-3 rounded ${darkMode?'bg-slate-700':'bg-slate-50'}`}><div className="text-sm font-medium">Ποσοστό φόρτου (σε σχέση με τον Γιάννη)</div><div className="text-xs text-slate-500 mb-2">Μετακινήστε το slider για να ορίσετε το ποσοστό των προτεινόμενων βαρών του Γιάννη (π.χ. 50%).</div><input type="range" min="10" max="100" step="5" value={percentMap['M']??50} onChange={e=>onPercentChange('M',e.target.value)} className="w-full"/><div className="mt-2 text-sm">Τρέχον: {percentMap['M']??50}% των βαρών του Γιάννη</div></div>)}

        <div className="space-y-3">
          {PROGRAM[activeDay].map(ex=>{ const actKey=`${activeUser}_${activeDay}_${ex.key}`; const doneKey=`${activeUser}_${activeDay}_${ex.key}_done`; const bestKey=`${activeUser}_${ex.key}_best`; const currentActual=actuals[actKey]??''; const suggestedForUser=computeSuggestedForUser(ex); const best=bestMap[bestKey]??ex.suggested??0;
            return (<div key={ex.key} className={`${darkMode?'bg-slate-700':'bg-slate-50'} p-3 rounded-md flex items-center justify-between`}><div className="flex-1"><div className="flex items-center justify-between"><div><div className="font-medium">{ex.name}</div><div className="text-xs text-slate-400">{ex.muscle}</div></div><div className="text-right"><div className="text-sm">Προτεινόμενο: <span className="font-semibold">{suggestedForUser} kg</span></div><div className="text-xs text-slate-400">Καλύτερο: {best||'—'} kg</div></div></div><div className="mt-2 flex gap-2 items-center"><input value={currentActual} onChange={e=>handleActualChange(ex.key,e.target.value)} placeholder="Πραγματικό βάρος (kg)" className={`w-28 px-2 py-1 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-700 text-slate-100':'bg-white border-slate-300 text-slate-900'}`} type="number" min="0"/><button onClick={()=>toggleDone(ex.key)} className={`px-3 py-1 text-sm rounded ${doneMap[doneKey]?'bg-emerald-500 text-white':(darkMode?'bg-slate-700 text-slate-200 border border-slate-600':'bg-white border text-slate-700')}`}>{doneMap[doneKey]?'Ολοκληρώθηκε':'Σήμανση'}</button><input className={`flex-1 px-2 py-1 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-700 text-slate-100':'bg-white border-slate-300 text-slate-900'}`} placeholder="Σημειώσεις..." value={notes[`${activeUser}_${activeDay}_note`]||''} onChange={e=>updateNote(e.target.value)}/></div></div></div>); })}
          <div className="flex items-center justify-between gap-2"><button onClick={resetDay} className={`flex-1 py-2 rounded ${darkMode?'bg-red-900 text-red-200':'bg-red-50 text-red-600'}`}>Επαναφορά ημέρας</button><button onClick={completeAndNext} className="flex-1 py-2 rounded bg-emerald-600 text-white">Ολοκλήρωση & Επόμενη</button></div>
          <div className="flex items-center gap-2 mt-2"><button onClick={()=>exportHistoryCSV()} className={`flex-1 py-2 rounded ${darkMode?'bg-slate-700':'bg-slate-100'}`}>Εξαγωγή ιστορικού (CSV)</button><button onClick={()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})} className={`flex-1 py-2 rounded ${darkMode?'bg-slate-700':'bg-slate-100'}`}>Μετάβαση στο Ιστορικό</button></div>
        </div>
      </div>

      <div className="p-3 border-t text-xs text-slate-400" style={{borderColor: darkMode?'#374151':undefined}}>Tip: Τα καλύτερα βάρη αποθηκεύονται αυτόματα όταν εισάγεις μεγαλύτερο αριθμό από το προηγούμενο best.</div>

      <div className={`p-4 border-t ${darkMode?'border-slate-700 bg-slate-800':'bg-slate-100'}`}>
        <div className="flex items-center justify-between"><div className="text-sm font-medium">Πρόσφατο ιστορικό (βάρη)</div><div className="text-xs">Εγγραφές: {history.length}</div></div>
        <div className="mt-2 max-h-64 overflow-auto">{history.length===0 && <div className="text-sm text-slate-400">Δεν υπάρχει ιστορικό ακόμα.</div>}{history.map((h,idx)=>{const userObj=USERS.find(u=>u.id===h.user);const userName=userObj?userObj.name:h.user;return (<div key={idx} className={`py-2 border-b text-sm flex items-center justify-between ${darkMode?'border-slate-700':''}`}><div><div><span className="font-medium">{userName}</span> • {h.day} • {h.exKey}</div><div className="text-xs text-slate-400">{new Date(h.ts).toLocaleString()}</div></div><div className="font-semibold">{h.weight} kg</div></div>);})}</div>
      </div>
    </div>
  </div>);
}
