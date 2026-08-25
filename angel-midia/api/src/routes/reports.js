import { requireAdmin } from '../auth.js';
export default async function reportRoutes(app){
  app.get('/api/admin/reports',{preHandler:requireAdmin},async(request)=>{
    const days=Math.min(90,Math.max(1,Number(request.query?.days)||30));
    const {rows}=await app.db.query(`select pe.occurred_at,pe.event_type,d.name as device_name,ma.display_name as media_name,pe.detail from playback_events pe join devices d on d.id=pe.device_id left join media_assets ma on ma.id=pe.asset_id where pe.occurred_at>=now()-($1::text||' days')::interval order by pe.occurred_at desc limit 2000`,[days]);
    return {periodDays:days,totals:rows.reduce((a,e)=>(a[e.event_type]=(a[e.event_type]||0)+1,a),{}),events:rows};
  });
}
