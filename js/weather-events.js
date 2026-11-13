/** Experimental Weather Events browser. Purely opt-in; never scans, downloads model grids,
 * changes active viewer state, publishes events, or preserves case data. v1.2.40 (threshold-screened RAP/GFSv16 F000 analyses). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const button=$('weatherEventsBtn'),dialog=$('weatherEventsDialog');
if(!button||!dialog)return;
const list=$('weatherEventsList'),detail=$('weatherEventsDetail'),status=$('weatherEventsStatus');
const filter=$('weatherEventsCategory'),search=$('weatherEventsSearch'),alertFilter=$('weatherEventsAlertFilter');
const categoryNames={heavy_precipitation:'Heavy precipitation',heavy_snowfall:'Heavy snowfall',deep_low:'Surface cyclone',strong_wind:'Strong winds',model_disagreement:'Model disagreement',high_cape:'High instability',radar_signal:'Radar reflectivity',severe_report:'Severe weather reports'};
const setIds={rrfs:'rrfs-refs',gfs:'gfs-versions',ai:'ai-models'};
const forecastSetLabels={rrfs:'RRFS / HRRR / REFS',gfs:'GFS versions',ai:'AI / GEFS guidance'};
const forecastModelLabels={rrfs:'RRFS',hrrr:'HRRR',refs_mean:'REFS mean',gfs_v16:'GFSv16',gfs_v17:'GFSv17',aigfs:'AIGFS',aigefs_mean:'AIGEFS mean',hgefs_mean:'HGEFS mean',gefs_mean:'GEFS mean'};
const allowedFields=new Set(['apcp','asnow','snow6h','snow24h','gust','gust10','mslp','mlcape','sbcape','mucape','wspd10_derived','wspd10','u10+v10','h500','t850','refc','lsr']);
let groups=[],summaries=new Map(),selectedId=null,origin='',generated='',settings=null;
let catalogs=new Map(),catalogInflight=new Map(),detailSerial=0,feedRequestSerial=0;
// Case-card expansion is presentation state, independent of selected forecast case.
let expandedCaseIds=new Set();
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
const add=(parent,child)=>{parent.appendChild(child);return child;};
const fmtTime=value=>{const ms=Date.parse(value);return Number.isFinite(ms)?new Date(ms).toISOString().slice(0,16).replace('T',' ')+' UTC':'Time unavailable';};
const fieldDisplay=field=>({apcp:'Precipitation',asnow:'Snowfall',gust:'Wind gust',gust10:'Wind gust',mslp:'MSLP',mlcape:'Mixed-layer CAPE',sbcape:'Surface-based CAPE',mucape:'Most-unstable CAPE',shear06:'0–6 km bulk shear',snod:'Snow depth',wspd10_derived:'10-m wind',wspd10:'10-m wind',refc:'Composite reflectivity',t850:'850-hPa temperature',h500:'500-hPa height'}[field]||field);
/* Presentation-only unit conversion: retain native measurements and JSON
   unchanged for reproducibility and ranking. Snowfall cm -> in; precip mm -> in. */
function formatEventMeasurement(metric){
 const value=Number(metric?.value),field=metric?.field,units=String(metric?.units||'').trim();
 let converted=value,displayUnits=units;
 if(Number.isFinite(value)){
  if(field==='lsr'&&units==='report')return 'Preliminary report (magnitude not specified)';
  if(field==='apcp'&&units.toLowerCase()==='mm') {converted=value/25.4;displayUnits='in';}
  else if((field==='asnow'||field==='snow6h'||field==='snow24h')&&units.toLowerCase()==='cm') {converted=value/2.54;displayUnits='in';}
 }
 const formatted=Number.isFinite(converted)?converted.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2}):'N/A';
 return `${formatted}${displayUnits?' '+displayUnits:''}${metric?.window_hours?' · '+metric.window_hours+' h accumulation':''}`;
}

const labels=g=>[g.title||'Weather situation',fmtTime(g.start_time),`${(g.models||[]).length} models`,`${(g.scenes||[]).length} scenes`];
function say(message){status.textContent=message;}
function normalize(raw){
 if(!raw||typeof raw!=='object'||!/^evu-event-discovery-preview-/.test(String(raw.schema||''))||!Array.isArray(raw.event_groups))
  throw Error('Expected an EVU event-discovery preview containing event_groups.');
 if(raw.event_groups.length>100)throw Error('Unexpectedly large event-group collection.');
 const observed=raw.mode==='observed_retrospective';
 const valid=[];
 for(const group of raw.event_groups){
  if(!group||typeof group!=='object'||!Array.isArray(group.scenes)||group.scenes.length>30)continue;
  const safeScenes=group.scenes.filter(scene=>{
   if(!scene||!allowedFields.has(scene.measurement?.field)||!Array.isArray(scene.source_records)||
      !scene.source_records.length||Number.isNaN(Date.parse(scene.valid_time)))return false;
   if(observed){
    return (scene.evidence_type==='analysis'||scene.evidence_type==='model_analysis'||scene.evidence_type==='local_storm_report')&&
       ['CONUS','Alaska','Puerto Rico'].includes(scene.location?.region)&&
       Array.isArray(scene.suggested_view?.center)&&scene.suggested_view.center.length===2&&
       scene.suggested_view.center.every(Number.isFinite);
   }
   return !!setIds[scene.model_set]&&Number.isInteger(scene.forecast_hour)&&scene.forecast_hour>=0&&scene.forecast_hour<=400&&
    !Number.isNaN(Date.parse(scene.init_time))&&Array.isArray(scene.suggested_view?.center)&&
    scene.suggested_view.center.length===2&&scene.suggested_view.center.every(Number.isFinite)&&
    scene.suggested_view.center[1]>=-85&&scene.suggested_view.center[1]<=85&&
    scene.suggested_view.center[0]>=-180&&scene.suggested_view.center[0]<=180&&
    scene.source_records.length<=4&&scene.source_records.every(r=>r&&/^[a-z0-9_]+$/.test(String(r.model||''))&&
     /^[a-z0-9_-]+$/.test(String(r.dataset||''))&&allowedFields.has(r.field));
  });
  // Native source records may use lower-level variable aliases and are validated when opened.
  if(!safeScenes.length)continue;
  valid.push({...group,scenes:safeScenes,observedCase:observed});
 }
 if(!valid.length&&raw.event_groups.length)throw Error('No supported scenes were found in this event catalog.');
 return valid;
}
function applyCatalog(raw,description){
 const parsed=normalize(raw);
 summaries=new Map((raw.candidate_group_summaries||[]).map(g=>[g.id,g]));
 groups=parsed.sort((a,b)=>(summaries.get(a.id)?.selection_rank||1000)-(summaries.get(b.id)?.selection_rank||1000));
 origin=description;generated=raw.generated_utc||'';
 selectedId=groups[0]?.id||null;expandedCaseIds.clear();catalogs.clear();catalogInflight.clear();
 fillCategory();renderList();renderDetail();
 say(`${groups.length} selected ${raw.mode==='observed_retrospective'?'observed cases':'forecast situations'} • ${description} • generated ${fmtTime(generated)}.${raw.mode==='observed_retrospective'?' Source-screened evidence and retained forecast links are labeled separately.':' Forecast cycles are checked before opening.'}`);
}
function fillCategory(){
 const previous=filter.value;filter.replaceChildren(new Option('All categories','all'));
 for(const category of [...new Set(groups.flatMap(g=>g.categories||[g.primary_category]))].sort())
  if(categoryNames[category])filter.add(new Option(categoryNames[category],category));
 filter.value=[...filter.options].some(x=>x.value===previous)?previous:'all';
}
function wwaStatusText(ac){
 if(!ac)return 'WWA: no alert context';
 const count=Number(ac.match_count)||0;
 if(count>0)return `${count} WWA match${count===1?'':'es'}`;
 return ac.status==='forecast_period_upcoming'?'WWA: future forecast period':
   ac.status==='no_matching_us_alerts'?'WWA: no nearby US alerts':
   ac.status==='not_checked'?'WWA: not checked':'WWA: incomplete/unavailable';
}
function safeExternalLink(value){return typeof value==='string'&&/^https:\/\/[^\s]+$/i.test(value)?value:'';}
function renderList(){
 const q=search.value.trim().toLowerCase(),cat=filter.value;
 const visible=groups.filter(g=>(cat==='all'||(g.categories||[]).includes(cat))&&
  (alertFilter.value==='all'||(alertFilter.value==='matched'?g.alert_context?.match_count>0:
    alertFilter.value==='none'?g.alert_context?.status==='no_matching_us_alerts':!g.alert_context||g.alert_context.status==='not_checked'))&&
  (!q||[g.title,...(g.models||[]),g.primary_category,g.location?.region,...(g.alert_context?.matches||[]).map(x=>x.event||'')].join(' ').toLowerCase().includes(q)));
 const previousScroll=list.scrollTop;
 list.replaceChildren();
 if(!visible.length)add(list,el('p','weather-events-empty',groups.length?'No situations match these filters.':'No significant observed cases are currently listed for the selected period.'));
 visible.forEach(g=>{
  const card=add(list,el('div','weather-event-card'));
  card.classList.toggle('is-active',g.id===selectedId);
  const top=add(card,el('div','weather-event-card-top'));
  const pick=add(top,el('button','weather-event-choice'));
  pick.type='button';pick.setAttribute('aria-pressed',String(g.id===selectedId));
  add(pick,el('strong','',g.title));
  add(pick,el('small','',fmtTime(g.start_time)));
  pick.addEventListener('click',()=>{selectedId=g.id;renderList();renderDetail();});
  const more=add(top,el('button','weather-event-expand'));
  more.type='button';more.setAttribute('aria-expanded',String(expandedCaseIds.has(g.id)));
  more.setAttribute('aria-label',`${expandedCaseIds.has(g.id)?'Collapse':'Expand'} details for ${g.title}`);
  more.textContent=expandedCaseIds.has(g.id)?'▴':'▾';
  const ac=g.alert_context;
  const wwa=add(card,el('div','weather-event-card-wwa'));
  add(wwa,el('span','weather-event-alert-badge',wwaStatusText(ac)));
  const matches=(Array.isArray(ac?.matches)?ac.matches:[])
    .filter(x=>x&&typeof x.event==='string');
  const unique=[];const seen=new Set();
  for(const match of matches){
   const url=safeExternalLink(match.link);const key=(match.event||'')+'|'+url;
   if(seen.has(key))continue;
   seen.add(key);unique.push({name:match.event,url});
  }
  const primary=unique.find(x=>x.url);
  if(primary){
   const anchor=add(wwa,el('a','weather-event-wwa-link',primary.name));
   anchor.href=primary.url;anchor.target='_blank';anchor.rel='noopener noreferrer';
   anchor.title='Open archived '+primary.name+' record';
  }else if(unique.length){
   add(wwa,el('span','weather-event-wwa-name',unique[0].name));
  }
  const hidden=add(card,el('div','weather-event-card-details'));
  hidden.hidden=!expandedCaseIds.has(g.id);
  const models=g.observedCase?[...new Set((g.scenes||[]).map(observedSourceFamily))]:(g.models||[]);
  add(hidden,el('small','',`${models.length} evidence sources · ${(g.scenes||[]).length} analysis/report records · ${(g.forecast_context||[]).length} forecast links`));
  if(models.length)add(hidden,el('small','',models.join(' · ')));
  if(unique.length>1){
   const links=add(hidden,el('div','weather-event-wwa-more'));
   for(const match of unique){
    if(match===primary)continue;
    if(match.url){
     const a=add(links,el('a','weather-event-wwa-link',match.name));
     a.href=match.url;a.target='_blank';a.rel='noopener noreferrer';
    }else add(links,el('span','weather-event-wwa-name',match.name));
   }
  }
  more.addEventListener('click',()=>{
   const show=hidden.hidden;hidden.hidden=!show;
   if(show)expandedCaseIds.add(g.id);else expandedCaseIds.delete(g.id);
   more.textContent=show?'▴':'▾';more.setAttribute('aria-expanded',String(show));
   more.setAttribute('aria-label',`${show?'Collapse':'Expand'} details for ${g.title}`);
  });
 });
 list.scrollTop=previousScroll;
}
async function loadConfig(){
 if(settings)return settings;
 const resp=await fetch(new URL('config.json',document.baseURI).href,{cache:'no-store'});
 if(!resp.ok)throw Error('Viewer configuration unavailable (HTTP '+resp.status+').');
 const cfg=await resp.json();if(!Array.isArray(cfg.sources)||!Array.isArray(cfg.modelSets))throw Error('Invalid viewer configuration.');
 settings=cfg;return cfg;
}
async function sourceCatalog(model){
 if(catalogs.has(model))return catalogs.get(model);
 if(catalogInflight.has(model))return catalogInflight.get(model);
 const pending=(async()=>{
  const cfg=await loadConfig();const source=cfg.sources.find(s=>s.id===model);
  if(!source||!source.catalogUrl)throw Error(model+' is not configured.');
  const res=await fetch(new URL(source.catalogUrl,document.baseURI).href,{cache:'no-store'});
  if(!res.ok)throw Error(model+' inventory unavailable (HTTP '+res.status+').');
  const cat=await res.json();
  if(cat.schema!=='rrfs-zarr-viewer-1'||!Array.isArray(cat.datasets))throw Error('Invalid inventory for '+model+'.');
  catalogs.set(model,cat);return cat;
 })();
 catalogInflight.set(model,pending);
 try{return await pending;}finally{catalogInflight.delete(model);}
}
function variableNames(field){
 if(field==='wspd10_derived'||field==='u10+v10')return ['u10','v10'];
 return [field];
}
function checkVariable(ds,record,scene){
 const vars=Array.isArray(ds.variables)?ds.variables:[];
 for(const name of variableNames(record.field)){
  const entry=vars.find(x=>x.name===name);
  if(!entry)return `Missing ${name} field`;
  if(!Array.isArray(entry.available_hours)||!entry.available_hours.includes(scene.forecast_hour))
   return `${name} unavailable at F${String(scene.forecast_hour).padStart(3,'0')}`;
  const start=Number(record.start_hour);
  if((record.field==='apcp'||record.field==='asnow')&&Number.isInteger(start)&&start>=0&&
    !entry.available_hours.includes(start))return `${name} unavailable at accumulation start F${String(start).padStart(3,'0')}`;
 }
 return '';
}
async function availability(scene){
 const cfg=await loadConfig();const set=cfg.modelSets.find(x=>x.id===setIds[scene.model_set]&&x.enabled!==false);
 if(!set)return 'Model set is not enabled on this viewer';
 const hourStep=Number(set.forecastHourStep)||1;
 if(scene.forecast_hour%hourStep!==0)return 'Forecast-hour cadence is not selectable in this model set';
 for(const record of scene.source_records){
  const catalog=await sourceCatalog(record.model);
  const ds=catalog.datasets.find(ds=>ds.id===record.dataset&&Date.parse(ds.init_time)===Date.parse(scene.init_time));
  if(!ds)return `${record.model} ${fmtTime(scene.init_time)} cycle is no longer published`;
  const problem=checkVariable(ds,record,scene);if(problem)return `${record.model}: ${problem}`;
 }
 return '';
}
function targetField(scene){
 const field=scene.measurement.field,accumHours=scene.measurement.window_hours;
 if(field==='apcp')return accumHours===6?'apcp6h':'apcp';
 if(field==='asnow')return accumHours===6?'snow6h':'asnow';
 if(field==='wspd10_derived')return 'wspd10';
 if(field==='h500')return 'absv500';
 return field;
}
function sceneUrl(scene){
 const url=new URL(window.location.href),p=url.searchParams;
 for(const key of ['shade','snow','bearing','pitch','event','event_scene'])p.delete(key);
 p.set('set',setIds[scene.model_set]);p.set('run',new Date(scene.init_time).toISOString());
 p.set('fhr',String(scene.forecast_hour));p.set('field',targetField(scene));p.set('map','lambert');
 p.set('event_scene','1');
 if(scene.measurement.field==='h500')p.set('shade','h500');
 const [lon,lat]=scene.suggested_view.center;
 p.set('lat',String(lat));p.set('lon',String(lon));p.set('zoom',String(scene.model_set==='rrfs'?4.2:3.7));
 return url.href;
}
function renderAlerts(parent,context){
 const panel=add(parent,el('section','weather-events-alert-context'));
 add(panel,el('h4','','Watches, warnings & advisories'));
 if(!context){add(panel,el('p','','No alert enrichment in this feed. Historical WWA matching has not been performed.'));return;}
 const count=Number(context.match_count)||0;
 const detailText=count>0?`${count} matching alert records near sampled locations and times`:
  context.status==='forecast_period_upcoming'?'Forecast period is upcoming; new alerts may be issued later.':
  context.status==='no_matching_us_alerts'?'No matching US alert records at the sampled locations/times.':
  context.status==='not_checked'?'Alert matching was not run for this feed.':
  'Alert source incomplete or unavailable; absence of alerts cannot be inferred.';
 add(panel,el('p','',detailText));
 const alerts=Array.isArray(context.matches)?context.matches.slice(0,8):[];
 for(const entry of alerts){
   if(!entry||typeof entry.event!=='string')continue;
   const row=add(panel,el('div','weather-event-alert-row'));
   const title=el('strong','',entry.event);
   const href=typeof entry.link==='string'?entry.link:'';
   if(/^https:\/\//.test(href)){
     const a=add(row,el('a'));a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.appendChild(title);
   }else row.appendChild(title);
   const when=entry.issued?`Issued ${fmtTime(entry.issued)}`:'';
   add(row,el('small','',`${entry.source||'Archived alert'} · ${when} · ${entry.location_match==='county_or_zone_context'?'county/zone context':'storm-based point/buffer'}`));
 }
 add(panel,el('small','weather-event-alert-disclaimer',
   'Alert records indicate a forecast hazard response, not verified damage or observed impacts. US historical records are incomplete outside covered areas; county/zone matches may cover a larger area than the event point.'));
}
// Group *all* observations from the same producer, even across different
// products, accumulations, categories or discontinuous valid times. The
// underlying JSON is not modified; measurements remain individually inspectable.
function observedSourceFamily(scene){
 const model=String(scene?.model||scene?.source_records?.[0]?.dataset||'').toLowerCase();
 if(scene?.evidence_type==='local_storm_report'||model==='lsr')return 'Local storm reports';
 if(model.startsWith('ccpa'))return 'CCPA';
 if(model.startsWith('stageiv')||model.startsWith('stage_iv')||model.startsWith('stage-iv'))return 'Stage IV';
 if(model.startsWith('mrms'))return 'MRMS';
 if(model.startsWith('nohrsc'))return 'NOHRSC';
 if(model.startsWith('rtma'))return 'RTMA';
 if(model.startsWith('urma'))return 'URMA';
 if(model.startsWith('rap'))return 'RAP';
 if(model==='gfs_v16')return 'GFSv16 F000';
 if(model.startsWith('glm'))return 'GLM';
 return model.toUpperCase()||'Other observations';
}
function groupObservedScenes(scenes){
 const result=[],lookup=new Map();
 for(const scene of scenes||[]){
  const key=observedSourceFamily(scene);
  if(!lookup.has(key)){
   const entry=[];lookup.set(key,entry);result.push(entry);
  }
  lookup.get(key).push(scene);
 }
 for(const entry of result)entry.sort((a,b)=>Date.parse(a.valid_time)-Date.parse(b.valid_time));
 return result;
}
function productLabel(scene){
 const measurement=scene.measurement||{};
 const source=String(scene.model||'').replaceAll('_',' ').toUpperCase();
 const value=measurement.field==='lsr'?'Report':fieldDisplay(measurement.field);
 return `${source}${measurement.window_hours?` (${measurement.window_hours} h)`:''} · ${value}`;
}
function renderObservedScenes(parent,scenes){
 const grouped=groupObservedScenes(scenes);
 const heading=add(parent,el('h4','','Event-detection evidence: observations and model analyses'));
 heading.classList.add('weather-events-subheading');
 const rows=add(parent,el('div','weather-events-scenes'));
 for(const entries of grouped){
  const first=entries[0],last=entries[entries.length-1],source=observedSourceFamily(first);
  const group=add(rows,el('details','weather-source-group'));
  const head=add(group,el('summary','weather-source-summary'));
  const description=add(head,el('div','weather-source-summary-text'));
  add(description,el('strong','',source));
  const n=entries.length;
  const sampled=n===1?`Sampled ${fmtTime(first.valid_time)}`:
   `Sampled ${fmtTime(first.valid_time)} – ${fmtTime(last.valid_time)}`;
  add(description,el('small','',`${n} observation${n===1?'':'s'} · ${sampled}`));
  const families=[...new Set(entries.map(scene=>String(scene.model||'').toUpperCase()))];
  if(families.length>1)add(description,el('small','',`Products: ${families.join(' · ')}`));
  if(entries.some(scene=>scene.evidence_type==='model_analysis'))add(description,el('small','', 'F000 model initialization analysis · not independent observed verification'));
  else if(entries.some(scene=>String(scene.model||'').startsWith('rap')))add(description,el('small','', 'RAP model-based gridded analysis'));
  const body=add(group,el('div','weather-source-details'));
  for(const scene of entries){
   const item=add(body,el('div','weather-source-entry'));
   const line=add(item,el('div','weather-source-entry-main'));
   add(line,el('strong','',productLabel(scene)));
   add(line,el('span','',`${fmtTime(scene.valid_time)} · ${formatEventMeasurement(scene.measurement||{})}`));
   const region=scene.location?.region||'';
   const sr=scene.source_records?.[0];
   if(region)add(item,el('small','',region));
   const note=String(scene.evidence_provenance||'').trim();
   if(note&&entries.length===1)add(item,el('small','',note));
   const remark=String(scene.report?.remarks||'').trim();
   if(remark)add(item,el('small','',remark.slice(0,450)));
   if((scene.model==='lsr'||scene.evidence_type==='local_storm_report')&&sr?.store&&safeExternalLink(sr.store)){
    const a=add(item,el('a','weather-source-report-link','Report archive'));
    a.href=sr.store;a.target='_blank';a.rel='noopener noreferrer';
   }
  }
 }
}
function renderDetail(){
 const ticket=++detailSerial,group=groups.find(g=>g.id===selectedId);
 detail.replaceChildren();if(!group){add(detail,el('p','weather-events-empty','Choose a situation to see its scenes.'));return;}
 add(detail,el('h3','',group.title));
 const meta=add(detail,el('p','weather-events-detail-meta'));
 meta.textContent=`${group.location?.region||'Selected area'} · ${fmtTime(group.start_time)} – ${fmtTime(group.end_time)}`;
 const models=add(detail,el('p','weather-events-models'));
 models.textContent=group.observedCase?[...new Set(group.scenes.map(observedSourceFamily))].join(' · '):(group.models||[]).join(' · ');
 add(detail,el('p','weather-events-caveat',group.observedCase?'Retrospective case identified from gridded observations, model-based analyses (including RAP and GFSv16 F000), and/or preliminary reports. Analyses are diagnostic evidence, not verified impacts. Retained evidence may outlive its underlying data store.':'Experimental forecast detection; no verified impacts are implied. Scenes may have expired under normal retention.'));
 renderAlerts(detail,group.alert_context);
 if(group.observedCase)renderObservedScenes(detail,group.scenes);
 else{
  const rows=add(detail,el('div','weather-events-scenes'));
  group.scenes.forEach(scene=>{
   const row=add(rows,el('section','weather-scene'));
   const label=add(row,el('div','weather-scene-label'));
   add(label,el('strong','',scene.title||fieldDisplay(scene.measurement.field)));
   add(label,el('small','',`${scene.model} · F${String(scene.forecast_hour).padStart(3,'0')} · ${fmtTime(scene.valid_time)}`));
   add(label,el('small','',formatEventMeasurement(scene.measurement||{})));
   addForecastAction(row,label,scene,ticket);
  });
 }
 if(group.observedCase){
  const forecasts=(group.forecast_context||[]).filter(scene=>scene&&setIds[scene.model_set]&&allowedFields.has(scene.measurement?.field)&&
    !(scene.model==='gfs_v16'&&scene.forecast_hour===0));
  if(forecasts.length){
   const forecastPanel=add(detail,el('details','weather-forecast-disclosure'));
   add(forecastPanel,el('summary','',`Retained model forecast context · ${forecasts.length} links`));
   add(forecastPanel,el('p','weather-events-caveat','These links show existing guidance near observed case times, whether or not a model predicted a strong event. A supporting field (such as 850-hPa temperature) is not an event-specific forecast, and this is not a skill assessment.'));
   for(const modelSet of ['rrfs','gfs','ai']){
    const matches=forecasts.filter(scene=>scene.model_set===modelSet);
    if(!matches.length)continue;
    add(forecastPanel,el('h5','',forecastSetLabels[modelSet]));
    const forecastRows=add(forecastPanel,el('div','weather-events-scenes'));
    matches.forEach(scene=>{
     const row=add(forecastRows,el('section','weather-scene'));
     const label=add(row,el('div','weather-scene-label'));
     add(label,el('strong','',`${forecastModelLabels[scene.model]||scene.model} · ${fieldDisplay(scene.measurement.field)}`));
     add(label,el('small','',`Initialized ${fmtTime(scene.init_time)} · F${String(scene.forecast_hour).padStart(3,'0')} · valid ${fmtTime(scene.valid_time)}`));
     if(scene.observed_reference_time){
      const offset=Number(scene.context_time_offset_minutes);
      const timeText=Number.isFinite(offset)?(offset===0?'Exact valid-hour match':`Nearest output: ${Math.abs(offset)} min ${offset>0?'after':'before'} the observation`):'Closest retained forecast output';
      add(label,el('small','',`${timeText} · reference ${fmtTime(scene.observed_reference_time)}`));
     }
     if(scene.context_kind==='supporting')add(label,el('small','weather-events-caveat','Supporting meteorological field, not a direct forecast of this hazard.'));
     addForecastAction(row,label,scene,ticket);
    });
   }
  }else add(detail,el('p','weather-events-caveat','No compatible retained forecast field/cycle was found within three hours of the case observations. This does not mean the guidance was never issued. Observed evidence remains available.'));
 }

}
function addForecastAction(row,label,scene,ticket){
 const action=add(row,el('button','weather-scene-open','Checking…'));action.type='button';action.disabled=true;
 Promise.resolve().then(()=>availability(scene)).then(reason=>{
  if(detailSerial!==ticket)return;
  if(reason){action.textContent='Unavailable';action.title=reason;add(label,el('small','weather-scene-error',reason));}
  else{action.textContent='Open scene';action.disabled=false;
   action.title='Open the retained model forecast at its stated initialization and valid time';
   action.addEventListener('click',()=>{window.location.assign(sceneUrl(scene));});}
 }).catch(err=>{
  if(detailSerial!==ticket)return;action.textContent='Unavailable';action.title=err.message;
  add(label,el('small','weather-scene-error',err.message));
 });

}
function resetFeedView(message){
 groups=[];summaries=new Map();selectedId=null;origin='';generated='';
 catalogs.clear();catalogInflight.clear();++detailSerial;
 filter.replaceChildren(new Option('All categories','all'));
 list.replaceChildren();detail.replaceChildren();
 add(detail,el('p','weather-events-empty',message));
}
function open(){
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
 loadFeed(); // Always read the latest published feed when opened.
}
async function loadFeed(){
 const request=++feedRequestSerial; // A later reload wins over any slower request.
 resetFeedView('Loading current published Weather Events…');
 say('Loading current published Weather Events…');
 try{
  const url=new URL('data/weather_events.json',document.baseURI);
  url.searchParams.set('_',String(Date.now()));
  const res=await fetch(url.href,{cache:'no-store'});
  if(request!==feedRequestSerial)return;
  if(!res.ok)throw Error(`HTTP ${res.status}`);
  const raw=await res.json();
  if(request!==feedRequestSerial)return;
  applyCatalog(raw,'current published feed');
 }catch(err){
  if(request!==feedRequestSerial)return;
  resetFeedView('The current published feed could not be loaded. Check data/weather_events.json and its publication permissions.');
  say('Live Weather Events unavailable: '+err.message+' — use Reload published feed to try again.');
 }
}
button.addEventListener('click',open);
$('weatherEventsClose').addEventListener('click',()=>dialog.close());
$('weatherEventsRefresh').addEventListener('click',loadFeed);
filter.addEventListener('change',renderList);alertFilter.addEventListener('change',renderList);search.addEventListener('input',renderList);
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
window.EVUWeatherEvents={normalize,sceneUrl,targetField,groupObservedScenes};
})();
