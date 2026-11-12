// Keep unrelated cards, list rows, inputs and the model canvas attached.
const cardKey=node=>[...node.classList].find(c=>c.endsWith('-card')&&c!=='family-card');
const itemKey=node=>node.querySelector('[data-item]')?.dataset.item;
function rememberRows(card){for(const row of card.querySelectorAll('.family-item'))row._renderedMarkup=row.outerHTML;}
function refreshList(before,next){
 for(const selector of ['.family-card-top','.list-storage-status','.family-card-foot']){const old=before.querySelector(selector),value=next.querySelector(selector);if(old&&value&&old.innerHTML!==value.innerHTML)old.innerHTML=value.innerHTML;}
 const count=before.querySelector('[data-list-all]'),nextCount=next.querySelector('[data-list-all]');if(count&&nextCount){count.textContent=nextCount.textContent;count.setAttribute('aria-label',nextCount.getAttribute('aria-label'));}
 const list=before.querySelector('.family-list'),incoming=next.querySelector('.family-list'),rows=new Map([...list.children].map(row=>[itemKey(row),row])),desired=[];
 for(const row of incoming.children){const old=rows.get(itemKey(row)),signature=row.outerHTML;row._renderedMarkup=signature;desired.push(old?._renderedMarkup===signature?old:row);}
 for(const row of [...list.children])if(!desired.includes(row))row.remove();
 for(const [index,row]of desired.entries())if(list.children[index]!==row)list.insertBefore(row,list.children[index]||null);
}
export function refreshDashboard(host,markup){
 const template=document.createElement('template');template.innerHTML=markup;
 const incoming=template.content,oldGrid=host.querySelector('.family-grid'),newGrid=incoming.querySelector('.family-grid');
 if(oldGrid&&newGrid){
  const old=new Map([...oldGrid.children].map(node=>[cardKey(node),node]));
  for(const node of [...newGrid.children]){const before=old.get(cardKey(node)),signature=node.outerHTML;if(before?._renderedMarkup===signature)continue;
   if(before&&node.matches('.tasks-card,.shopping-card')){refreshList(before,node);before._renderedMarkup=signature;continue;}
   if(before&&node.matches('.weather-card,.calendar-card')){before.replaceChildren(...node.childNodes);before._renderedMarkup=signature;continue;}
   node._renderedMarkup=signature;rememberRows(node);if(before)before.replaceWith(node);else oldGrid.append(node);
  }
 }else for(const node of newGrid?.children||[]){node._renderedMarkup=node.outerHTML;rememberRows(node);}
 const candidates=[...host.children],desired=[];
 for(const node of [...incoming.children])desired.push(node===newGrid&&oldGrid?oldGrid:candidates.find(old=>old.outerHTML===node.outerHTML)||node);
 for(const old of candidates)if(!desired.includes(old))old.remove();
 for(const [index,node]of desired.entries())if(host.children[index]!==node)host.insertBefore(node,host.children[index]||null);
}
