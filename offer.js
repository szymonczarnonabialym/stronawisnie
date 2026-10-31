/* Published offer only. One fruit and variety per order; no default selection. */
document.addEventListener('DOMContentLoaded', () => {
  const labels={available:'Dostępne',soon:'Wkrótce',sold_out:'Wyprzedane',season_over:'Sezon zakończony'},fruitNames={sweet:'Czereśnie',sour:'Wiśnie'};
  const priceFormat=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
  const money=n=>priceFormat.format(n)+' zł/kg';
  // General cultivar traits, not promises about a particular harvest or picking date.
  // Sources: szkółki Machaj cultivar catalog and Fruit Tech Centre's Vanda entry.
  const sweetDescriptions=new Map([
    ['vanda','Ciemnoczerwone owoce, słodkie w pełnej dojrzałości. Odmiana deserowa, do jedzenia na świeżo.'],
    ['wanda','Ciemnoczerwone owoce, słodkie w pełnej dojrzałości. Odmiana deserowa, do jedzenia na świeżo.'],
    ['vega','Jasnożółta skórka z czerwonym rumieńcem i jasny, soczysty miąższ. Na świeżo i do przetworów.'],
    ['burlat','Wczesna odmiana o purpurowoczerwonych owocach, bardzo ciemnych po dojrzeniu. Dobra do jedzenia na świeżo.'],
    ['kordia','Późna odmiana o dużych, wydłużonych owocach w kształcie serca. Skórka ciemnoczerwona z brązowym odcieniem.'],
    ['techlovan','Duże owoce z błyszczącą, ciemnoczerwoną skórką. Wyróżnia je twardy, chrupiący miąższ.']
  ]);
  function descriptionFor(item){
    if(item.fruit==='sour')return 'Na kompot, dżem i domowe przetwory.';
    const name=item.name.normalize('NFD').replace(/\p{M}/gu,'').trim().toLocaleLowerCase('pl-PL');
    return sweetDescriptions.get(name)||'Zapytaj nas o smak i cechy tej odmiany.';
  }
  const form=document.getElementById('orderForm'),fields=document.getElementById('offer-order-fields'),status=document.getElementById('offer-status'),fruits=document.getElementById('offer-fruits'),varieties=document.getElementById('offer-varieties'),hint=document.getElementById('variety-hint');
  let current=[],loaded=false,siteEnabled=true,inflight=null,submitting=false;
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
  const chosenFruit=()=>form.querySelector('[name="Owoc"]:checked')?.value;
  const chosenVariety=()=>form.querySelector('[name="Odmiana"]:checked')?.dataset.offerId;
  function syncSelectedCard(){
    const selected=chosenVariety();
    document.querySelectorAll('.offer-card').forEach(card=>card.classList.toggle('offer-card-selected',card.dataset.offerId===selected));
  }
  function chooseFromCard(id){
    const item=current.find(i=>i.id===id&&i.status==='available');
    if(!loaded||!siteEnabled||!item){status.textContent='Ta odmiana nie jest obecnie dostępna. Sprawdź aktualną ofertę.';return}
    const fruit=[...fruits.querySelectorAll('input')].find(input=>input.value===fruitNames[item.fruit]&&!input.disabled);
    if(!fruit)return;
    fruit.checked=true;
    renderVarieties(item.id);
    status.textContent=`Wybrano: ${fruitNames[item.fruit]} — ${item.name}. Podaj ilość i dane do zamówienia.`;
    form.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    document.getElementById('iloscSlider').focus({preventScroll:true});
  }
  function offerCard(item){
    const active=item.status==='available';
    const article=node('article',undefined,'offer-card'+(active?' offer-card-available':''));article.dataset.offerId=item.id;
    const top=node('div',undefined,'offer-card-top');
    top.append(node('span',fruitNames[item.fruit],'offer-card-fruit'),node('span',labels[item.status],'offer-card-status'+(active?' is-available':'')));
    const main=node('div',undefined,'offer-card-main');
    main.append(node('h5',item.name,'offer-card-name'),node('p',descriptionFor(item),'offer-card-description'));
    if(active){
      const price=node('p',undefined,'offer-card-price');price.append(node('strong',priceFormat.format(item.pricePerKg)+' zł'),node('span',' / kg'));main.append(price);
    }
    const button=node('button',undefined,'offer-card-action');button.type='button';button.disabled=!active;
    const arrow=node('span',active?'↗':'—','offer-card-arrow');arrow.setAttribute('aria-hidden','true');
    button.append(node('span',active?`Wybieram ${item.name}`:'Obecnie niedostępne'),arrow);
    button.setAttribute('aria-label',active?`Wybierz odmianę ${item.name} — ${fruitNames[item.fruit]}, ${money(item.pricePerKg)}`:`${item.name} — ${labels[item.status]}`);
    // The footer button also provides keyboard access to the clickable card.
    if(active)article.addEventListener('click',()=>chooseFromCard(item.id));
    article.append(top,main,button);return article;
  }
  function showSiteMode(data){
    siteEnabled=data.siteEnabled;
    const screen=document.getElementById('site-mode-screen');
    document.getElementById('site-content').hidden=!siteEnabled;screen.hidden=siteEnabled;
    if(!siteEnabled){
      const card=node('div',undefined,'closed-season-card');
      card.append(node('div','Czereśnie Kościan','closed-season-brand'),node('h1',`Sezon ${data.season} zakończony`),node('p','Zapraszamy w przyszłym roku!'));screen.replaceChildren(card);
      document.title=`Sezon ${data.season} zakończony — Czereśnie Kościan`;fields.disabled=true;current=[];loaded=true;window.scrollTo(0,0);
    }else{document.title='Czereśnie Kościan - Świeże Czereśnie i Wiśnie Prosto z Sadu';window.dispatchEvent(new Event('scroll'))}
  }
  function renderVarieties(selectedId){
    const fruit=chosenFruit();varieties.replaceChildren();
    hint.textContent=fruit?'Wybierz jedną odmianę. Podana ilość w kilogramach dotyczy tej odmiany.':'Najpierw wybierz gatunek owoców. Ilość w kilogramach dotyczy jednej wybranej odmiany.';
    if(!fruit){syncSelectedCard();return}
    for(const item of current.filter(i=>fruitNames[i.fruit]===fruit)){
      const active=item.status==='available',label=node('label',undefined,'variety-chip'+(active?'':' variety-disabled')),box=node('input');
      box.type='radio';box.name='Odmiana';box.required=true;box.dataset.offerId=item.id;
      box.value=`${fruitNames[item.fruit]} ${item.name}${active?' — '+money(item.pricePerKg):''}`;box.disabled=!active;box.checked=active&&item.id===selectedId;
      box.addEventListener('change',syncSelectedCard);
      label.append(box,node('span',`${item.name} · ${active?money(item.pricePerKg):labels[item.status]}`));varieties.append(label);
    }
    syncSelectedCard();
  }
  function render(data){
    if(typeof data.siteEnabled!=='boolean'||!Number.isInteger(data.season)||data.season<2020||data.season>2100)throw new Error('Invalid site mode');
    if(!data.siteEnabled){showSiteMode(data);return}
    const items=data.items;
    if(!Array.isArray(items)||items.length>40||typeof data.message!=='string'||!items.every(i=>typeof i.id==='string'&&typeof i.name==='string'&&i.name.length<=80&&Object.hasOwn(fruitNames,i.fruit)&&Object.hasOwn(labels,i.status)&&(i.pricePerKg===null||(Number.isFinite(i.pricePerKg)&&i.pricePerKg>0))&&(i.status!=='available'||i.pricePerKg!==null))||new Set(items.map(i=>i.id)).size!==items.length)throw new Error('Invalid offer');
    const selectedFruit=chosenFruit(),selectedId=chosenVariety();showSiteMode(data);
    // Preserve controls and keyboard focus for unchanged periodic responses.
    const unchanged=loaded&&JSON.stringify(items)===JSON.stringify(current);current=items;loaded=true;
    if(!unchanged){
      fruits.replaceChildren();
      for(const fruit of ['sweet','sour']){
        const group=items.filter(i=>i.fruit===fruit),available=group.filter(i=>i.status==='available'),groupLabel=node('label',undefined,'fruit-option'+(available.length?'':' fruit-disabled')),input=node('input');
        input.type='radio';input.name='Owoc';input.value=fruitNames[fruit];input.required=true;input.disabled=!available.length;input.checked=available.length>0&&selectedFruit===input.value;
        const card=node('span',undefined,'fruit-card'),name=node('span',undefined,'fruit-name'),mark=node('span','🍒','fruit-mark');mark.setAttribute('aria-hidden','true');name.append(mark,document.createTextNode(fruitNames[fruit]));card.append(name,node('span',available.length?`od ${money(Math.min(...available.map(i=>i.pricePerKg)))}`:'Aktualnie niedostępne','fruit-price-tag'));groupLabel.append(input,card);fruits.append(groupLabel);
        input.addEventListener('change',()=>renderVarieties());
        const grid=document.getElementById('offer-'+fruit);grid.replaceChildren();if(!group.length)grid.append(node('p','Obecnie brak oferty tego gatunku.'));
        for(const item of group)grid.append(offerCard(item));
        document.querySelectorAll(`[data-offer-summary="${fruit}"]`).forEach(el=>{el.textContent=available.length?`Dostępne odmiany: ${available.map(i=>i.name).join(', ')}. Cena od ${money(Math.min(...available.map(i=>i.pricePerKg)))}.`:'Obecnie brak dostępnych owoców tego gatunku.'});
      }
      renderVarieties(selectedId);
    }
    const available=items.some(i=>i.status==='available');fields.disabled=!available;
    status.textContent=(data.message?data.message+' ':'')+(available?'Wybierz gatunek i odmianę, a następnie podaj ilość.':'Sprzedaż online jest obecnie wstrzymana. Zapytaj o kolejny zbiór: 574 340 571.');
    if(selectedId&&!chosenVariety())status.textContent='Wybrana odmiana przestała być dostępna. Sprawdź ofertę i wybierz ponownie.';
  }
  function unavailable(){
    loaded=false;current=[];fields.disabled=true;status.textContent='Nie udało się sprawdzić aktualnej oferty. Zadzwoń: 574 340 571.';fruits.replaceChildren();varieties.replaceChildren();
    for(const fruit of ['sour','sweet']){document.getElementById('offer-'+fruit).replaceChildren(node('p','Aktualną ofertę potwierdzisz telefonicznie: 574 340 571.'));document.querySelectorAll(`[data-offer-summary="${fruit}"]`).forEach(el=>{el.textContent='Ceny i dostępność potwierdzamy telefonicznie.'})}
  }
  function refresh(){
    if(inflight)return inflight;
    inflight=(async()=>{try{const r=await fetch('/api/public/offer',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Offer unavailable');render(await r.json());return true}catch{unavailable();return false}finally{inflight=null}})();return inflight;
  }
  function validOrder(){
    if(!current.some(i=>i.id===chosenVariety()&&i.status==='available'&&fruitNames[i.fruit]===chosenFruit())){status.textContent='Wybierz gatunek owoców i jedną dostępną odmianę.';return false}
    const kg=Number(document.getElementById('iloscSlider').value);
    if(!Number.isInteger(kg)||kg<1||kg>50){status.textContent='Podaj ilość od 1 do 50 pełnych kilogramów.';return false}
    if(document.getElementById('radioDowoz').checked&&kg<5){status.textContent='Dowóz jest dostępny od 5 kg.';return false}
    return form.reportValidity();
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();if(submitting||!loaded||!siteEnabled||!validOrder())return;
    if(['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname)){status.textContent='To jest podgląd. Zamówienie nie zostało wysłane.';return}
    submitting=true;const before=JSON.stringify(current),submit=form.querySelector('[type="submit"]');submit.disabled=true;
    void refresh().then(refreshed=>{
      if(!refreshed||!loaded||!siteEnabled||JSON.stringify(current)!==before){status.textContent='Oferta uległa zmianie lub jest niedostępna. Sprawdź wybór i wyślij zamówienie ponownie.';return}
      if(validOrder())HTMLFormElement.prototype.submit.call(form);
    }).finally(()=>{submitting=false;submit.disabled=false});
  });
  void refresh();setInterval(()=>{if(!document.hidden)void refresh()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
});
