const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text=(v,max=300)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
export function validateAdvertiser(body){
  if(!body||typeof body!=='object'||!text(body.name,160))return{ok:false};
  const photoAssetId=body.photoAssetId||null,logoAssetId=body.logoAssetId||null;
  if((photoAssetId&&!UUID.test(photoAssetId))||(logoAssetId&&!UUID.test(logoAssetId)))return{ok:false};
  const value={name:text(body.name,160),contactName:text(body.contactName??'',160),phone:text(body.phone??'',40),email:text(body.email??'',200),notes:text(body.notes??'',1000),photoAssetId,logoAssetId};
  if(body.email&&(!value.email||!/^\S+@\S+\.\S+$/.test(value.email)))return{ok:false};
  return{ok:true,value};
}
export function validateMonth(body){
  const amount=Number(body?.monthlyAmount);
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(body?.competence??'')||!Number.isFinite(amount)||amount<0||amount>1e9||!['paid','pending','late','courtesy'].includes(body?.status))return{ok:false};
  return{ok:true,value:{competence:`${body.competence}-01`,amountCents:Math.round(amount*100),status:body.status,notes:text(body.notes??'',1000)}};
}
export function validateMediaLinks(body){return Array.isArray(body?.assetIds)&&body.assetIds.length<=500&&body.assetIds.every(id=>UUID.test(id))?{ok:true,value:[...new Set(body.assetIds)]}:{ok:false};}
export function summarizeFinancial(rows){
  const advertisers=rows.map(r=>{const displays=Number(r.displays||0),amount=Number(r.monthly_amount_cents||0);return{...r,displays,monthlyAmountCents:amount,costPerDisplayCents:displays?Math.round(amount/displays):null};});
  return{advertisers,totalDisplays:advertisers.reduce((s,r)=>s+r.displays,0),totalAmountCents:advertisers.reduce((s,r)=>s+r.monthlyAmountCents,0)};
}
