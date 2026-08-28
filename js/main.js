const card=document.getElementById('torchCard');
if(card){card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%')})}

const ranks=document.querySelectorAll('.rank-card');let ri=0;
function showRank(n){if(!ranks.length)return;ri=(n+ranks.length)%ranks.length;ranks.forEach((c,i)=>c.classList.toggle('active',i===ri));const count=document.getElementById('rankCount');if(count)count.textContent=(ri+1)+' / '+ranks.length}
const rankPrev=document.getElementById('rankPrev');const rankNext=document.getElementById('rankNext');
if(rankPrev)rankPrev.onclick=()=>showRank(ri-1);if(rankNext)rankNext.onclick=()=>showRank(ri+1);

const imgs=['images/screenshot1.jpg','images/screenshot2.jpg','images/screenshot3.jpg','images/screenshot4.jpg'];let gi=0;
const gimg=document.getElementById('galleryImage'),meta=document.getElementById('galleryMeta'),dots=document.querySelectorAll('.gallery-dot');
function showGallery(n){gi=(n+imgs.length)%imgs.length;if(!gimg)return;gimg.src=imgs[gi];gimg.alt='Скриншот '+(gi+1);if(meta)meta.textContent='Скриншот '+(gi+1)+' / '+imgs.length+' · нажми на изображение, чтобы увеличить';dots.forEach((d,i)=>d.classList.toggle('active',i===gi))}
const galleryPrev=document.getElementById('galleryPrev'),galleryNext=document.getElementById('galleryNext');
if(galleryPrev)galleryPrev.onclick=()=>showGallery(gi-1);if(galleryNext)galleryNext.onclick=()=>showGallery(gi+1);dots.forEach(d=>d.onclick=()=>showGallery(+d.dataset.index));

const lb=document.getElementById('lightbox'),lbi=document.getElementById('lightboxImage');
const viewport=document.getElementById('galleryViewport');
if(viewport&&lb&&lbi)viewport.onclick=()=>{lbi.src=imgs[gi];lb.classList.add('open')};
const close=document.getElementById('lightboxClose');if(close&&lb)close.onclick=()=>lb.classList.remove('open');
if(lb)lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')};
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')showGallery(gi-1);if(e.key==='ArrowRight')showGallery(gi+1);if(e.key==='Escape'&&lb)lb.classList.remove('open')});