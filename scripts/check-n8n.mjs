// Read-only connectivity probe. Does not authenticate and does not prove the endpoint is production-safe.
const url = process.env.SEMESTER_WEBHOOK_URL;
const sisId = process.argv[2] ?? '104404156';
if (!url) {console.error('Set SEMESTER_WEBHOOK_URL in your shell. Do not put credentials in URLs.');process.exit(1);}
if (!/^\d{6,12}$/.test(sisId)) {console.error('Invalid SIS ID');process.exit(1);}
const target=new URL(url);
target.searchParams.set('sis_id',sisId);
try {
 const res=await fetch(target,{signal:AbortSignal.timeout(12000)});
 const text=await res.text();
 console.log('HTTP',res.status,'Content-Type',res.headers.get('content-type'));
 if (!res.ok) throw Error('n8n returned non-2xx response');
 const d=JSON.parse(text);
 if (d.success!==true || String(d.student?.sisId)!==sisId || !Array.isArray(d.semesters)) throw Error('Invalid response contract or SIS mismatch');
 if (!['DEMO_SYNTHETIC','QWICKLY_INTAKE_VERIFIED'].includes(d.source)) throw Error('Unknown source');
 if (d.isSynthetic!==(d.source==='DEMO_SYNTHETIC')) throw Error('Source flag mismatch');
 for(const s of d.semesters) if(!(s.percentage===null || (typeof s.percentage==='number' && Number.isFinite(s.percentage) && s.percentage>=0 && s.percentage<=100))) throw Error('Invalid percentage');
 console.log('Contract OK:',d.semesters.length,'semester(s), source:',d.source,'isSynthetic:',d.isSynthetic);
} catch(e){console.error('Probe failed:',e.message);process.exit(1);}
