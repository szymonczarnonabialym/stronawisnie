/* Public shop offer. All displayed content is inserted as text, never HTML. */
document.addEventListener('DOMContentLoaded', () => {
  const labels={available:'Dostępne',soon:'Wkrótce',sold_out:'Wyprzedane',season_over:'Sezon zakończony'};
  const fruitNames={sweet:'Czereśnie',sour:'Wiśnie'};
  const money=n=>new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2}).format(n)+' zł/kg';
  const form=document.getElementById('orderForm'),fields=document.getElementById('offer-order-fields'),status=document.getElementById('offer-status');
  let current=[],loaded=false,running=false;
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
  function render(data){
    const items=data.items;
    // Reject incomplete or unexpected responses rather than display misleading prices.
    if(!Array.isArray(items)||items.length>40||typeof data.message!=='string'||!items.every(i=>typeof i.id==='string'&&typeof i.name==='string'&&i.name.length<=80&&Object.hasOwn(fruitNames,i.fruit)&&Object.hasOwn(labels,i.status)&&(i.pricePerKg===null||(Number.isFinite(i.pricePerKg)&&i.pricePerKg>0))&&(i.status!=='available'||i.pricePerKg!==null)))throw new Error('Invalid offer');
    const selected=new Set([...form.querySelectorAll('[name="Odmiana"]:checked')].map(i=>i.dataset.offerId));
    const chosenFruits=new Set([...form.querySelectorAll('[name="Owoc"]:checked')].map(i=>i.value));
    const fruits=document.getElementById('offer-fruits'),varieties=document.getElementById('offer-varieties');fruits.replaceChildren();varieties.replaceChildren();
    for(const fruit of ['sour','sweet']){
      const group=items.filter(i=>i.fruit===fruit),available=group.filter(i=>i.status==='available');
      const groupLabel=node('label',undefined,'fruit-option'+(available.length?'':' fruit-disabled'));
      const input=node('input');input.type='checkbox';input.name='Owoc';input.value=fruitNames[fruit];input.disabled=!available.length;input.checked=available.length>0&&(chosenFruits.has(input.value)||!loaded);
      const card=node('span',undefined,'fruit-card');card.append(node('span','🍒','fruit-emoji'),node('span',fruitNames[fruit],'fruit-name'),node('span',available.length?`od ${money(Math.min(...available.map(i=>i.pricePerKg)))}`:'Aktualnie niedostępne','fruit-price-tag'));groupLabel.append(input,card);fruits.append(groupLabel);
      const grid=document.getElementById('offer-'+fruit);grid.replaceChildren();
      if(!group.length)grid.append(node('p','Obecnie brak oferty tego gatunku.'));
      for(const item of group){
        const active=item.status==='available';
        const article=node('div',undefined,'variety-card reveal visible'+(active?' variety-card-available':''));
        article.append(node('div',active?money(item.pricePerKg):labels[item.status],'variety-price-badge'),node('div','🍒','variety-emoji'),node('h5',item.name),node('p',labels[item.status]));grid.append(article);
        const label=node('label',undefined,'variety-chip'+(active?'':' variety-disabled')),box=node('input');box.type='checkbox';box.name='Odmiana';box.dataset.offerId=item.id;box.value=`${fruitNames[fruit]} ${item.name}${active?' — '+money(item.pricePerKg):''}`;box.disabled=!active;box.checked=active&&selected.has(item.id);
        box.addEventListener('change',()=>{if(box.checked)input.checked=true});input.addEventListener('change',()=>{if(!input.checked)box.checked=false});
        label.append(box,node('span',`${item.name} · ${active?money(item.pricePerKg):labels[item.status]}`));varieties.append(label);
      }
      document.querySelectorAll(`[data-offer-summary="${fruit}"]`).forEach(el=>{el.textContent=available.length?`Dostępne odmiany: ${available.map(i=>i.name).join(', ')}. Cena od ${money(Math.min(...available.map(i=>i.pricePerKg)))}.`:'Obecnie brak dostępnych owoców tego gatunku.'});
    }
    current=items;loaded=true;const available=items.some(i=>i.status==='available');fields.disabled=!available;
    status.textContent=(data.message?data.message+' ':'')+(available?'Wybierz owoce i złóż zamówienie.':'Sprzedaż online jest obecnie wstrzymana. Zapytaj o kolejny zbiór: 574 340 571.');
    const count=document.getElementById('offer-count');if(count)count.textContent=String(items.length);
  }
  function unavailable(){loaded=false;current=[];fields.disabled=true;status.textContent='Nie udało się sprawdzić aktualnej oferty. Zadzwoń: 574 340 571.';document.getElementById('offer-fruits').replaceChildren();document.getElementById('offer-varieties').replaceChildren();for(const fruit of ['sour','sweet']){document.getElementById('offer-'+fruit).replaceChildren(node('p','Aktualną ofertę potwierdzisz telefonicznie: 574 340 571.'));document.querySelectorAll(`[data-offer-summary="${fruit}"]`).forEach(el=>{el.textContent='Ceny i dostępność potwierdzamy telefonicznie.'})}}
  async function refresh(){
    if(running)return false;running=true;try{const r=await fetch('/api/public/offer',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Offer unavailable');render(await r.json());return true}catch{unavailable();return false}finally{running=false}
  }
  form.addEventListener('submit',e=>{
    if(!loaded||!current.some(i=>i.status==='available')){e.preventDefault();return}
    if(!form.querySelector('[name="Owoc"]:checked')){e.preventDefault();status.textContent='Wybierz co najmniej jeden dostępny gatunek owoców.';return}
    // Revalidate just before handing the existing order form to Formsubmit.
    e.preventDefault();fields.disabled=true;
    const before=JSON.stringify(current);
    void refresh().then(refreshed=>{
      if(!refreshed||!loaded||JSON.stringify(current)!==before){fields.disabled=!loaded;status.textContent='Oferta uległa zmianie lub jest niedostępna. Sprawdź wybór i wyślij zamówienie ponownie.';return}
      fields.disabled=false;
      HTMLFormElement.prototype.submit.call(form);
    });
  });
  void refresh();setInterval(()=>{if(!document.hidden)void refresh()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
});
