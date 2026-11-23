(function(root){
  'use strict';
  const dayKey=(value=new Date())=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  function initial(){return {version:1,pet:{name:'코코',breed:'푸들',age:3},weights:[],activities:{},dailyTargets:{},goal:101,scales:{food:{url:'',weight:120,last:null,error:''},water:{url:'',weight:600,last:null,error:''}},logs:[],demoRunning:false};}
  function readGrams(value){
    if(value!==null&&typeof value==='object')value=value.grams??value.weightGrams??value.weight_grams??value.weight_g??value.weight??value.value;
    if(!['number','string'].includes(typeof value)||String(value).trim()==='')throw new Error('무게 데이터가 없습니다.');
    const n=Number(value);if(!Number.isFinite(n)||n<0||n>100000)throw new Error('올바른 무게(g)가 아닙니다.');return Math.round(n*10)/10;
  }
  function record(state,type,value,now=Date.now(),source='device'){
    if(!['food','water'].includes(type))throw new Error('알 수 없는 저울입니다.');
    const grams=readGrams(value),scale=state.scales[type],prev=scale.last===null?null:scale.weight;
    scale.weight=grams;scale.last=now;scale.error='';
    if(prev!==null){const delta=Math.round((grams-prev)*10)/10;if(Math.abs(delta)>=2){state.logs.unshift({id:`${now}-${type}-${Math.random().toString(36).slice(2,7)}`,type,at:now,weight:grams,delta,consumed:delta<0?-delta:0,source});if(state.logs.length>5000)state.logs.length=5000;}}
    return state;
  }
  function total(state,date=dayKey(),type){return Math.round(state.logs.filter(l=>(!type||l.type===type)&&dayKey(l.at)===date).reduce((a,l)=>a+l.consumed,0)*10)/10;}
  function merge(value){
    const fresh=initial();if(!value||value.version!==1)return fresh;
    fresh.pet.name=typeof value.pet?.name==='string'?value.pet.name.slice(0,30):fresh.pet.name;
    fresh.pet.breed=typeof value.pet?.breed==='string'?value.pet.breed.slice(0,40):fresh.pet.breed;
    fresh.pet.age=Number.isFinite(+value.pet?.age)&&+value.pet.age>=0?Math.min(40,+value.pet.age):fresh.pet.age;
    const validTime=at=>Number.isFinite(at)&&Number.isFinite(new Date(at).getTime());
    fresh.weights=Array.isArray(value.weights)?value.weights.filter(v=>Number.isFinite(v.kg)&&v.kg>0&&v.kg<=150&&validTime(v.at)).slice(0,1000):[];
    fresh.goal=Number.isFinite(+value.goal)&&+value.goal>0?Math.min(10000,+value.goal):101;
    for(const kind of ['food','water']){const old=value.scales?.[kind];if(old){try{fresh.scales[kind].weight=readGrams(old.weight);}catch{}fresh.scales[kind].url=typeof old.url==='string'?old.url:'';fresh.scales[kind].last=Number.isFinite(old.last)?old.last:null;}}
    for(const [date,a] of Object.entries(value.activities||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&a&&Number.isFinite(a.steps)&&a.steps>=0&&a.steps<=200000&&Number.isFinite(a.minutes)&&a.minutes>=0&&a.minutes<=1440)fresh.activities[date]={steps:Math.round(a.steps),minutes:Math.round(a.minutes)};
    for(const [date,n] of Object.entries(value.dailyTargets||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(n)&&n>0&&n<=10000)fresh.dailyTargets[date]=n;
    fresh.logs=Array.isArray(value.logs)?value.logs.filter(l=>['food','water'].includes(l.type)&&validTime(l.at)&&Number.isFinite(l.weight)&&l.weight>=0&&Number.isFinite(l.delta)&&Number.isFinite(l.consumed)&&l.consumed>=0&&['device','demo'].includes(l.source)).slice(0,5000):[];
    return fresh;
  }
  const api={dayKey,initial,readGrams,record,total,merge};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FeederCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
