// Synthetic rates in DataHub's public response shape. These are NOT Dinel's live rates.
export function tariffFixture(url){
 const filter=JSON.parse(new URL(url).searchParams.get('filter')),row=(note,code,gln,prices,extra={})=>({Note:note,ChargeTypeCode:code,GLN_Number:gln,ChargeType:'D03',ValidFrom:'2026-01-01T00:00:00',ValidTo:'2027-01-01T00:00:00',...Object.fromEntries(prices.map((p,i)=>['Price'+(i+1),p])),...extra});
 const records=filter.Note?[row('Elafgift','tax','system',[.008]),row('Systemtarif','system','system',[.05]),row('Transmissions nettarif','transmission','system',[.057])]:filter.ChargeTypeCode.map(code=>row('Nettarif C',code,filter.GLN_Number[0],Array.from({length:24},(_,h)=>h<6?.06:h>=17&&h<21?.59:.197)));
 return {total:records.length,records};
}
