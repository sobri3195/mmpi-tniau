import type { AssessmentResult } from '../../types';
import { Button, Card, Select } from '../ui';
import { useState } from 'react';
import { buildArchiveBundle, exportArchiveBundle } from '../../utils/archiveExport';
const download=(name:string,content:string)=>{const b=new Blob([content],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);};
export const ArchiveExportPanel=({results}:{results:AssessmentResult[]})=>{const [id,setId]=useState(results[0]?.id||''); return <Card><h2 className="text-2xl font-black">Ekspor arsip peserta/gelombang</h2><div className="mt-4 flex flex-wrap gap-3"><Select value={id} onChange={(e)=>setId(e.target.value)}>{results.map((r)=><option key={r.id} value={r.id}>{r.identity.name} - {r.id}</option>)}</Select><Button onClick={()=>download('archive-result.json',exportArchiveBundle(buildArchiveBundle('single_result',[id])))}>Export per peserta</Button><Button variant="secondary" onClick={()=>download('archive-batch.json',exportArchiveBundle(buildArchiveBundle('batch',[])))}>Export gelombang/semua</Button></div></Card>}
