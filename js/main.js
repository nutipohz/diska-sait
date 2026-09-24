import { auth, db } from "../firebase.js";
import { addDoc, collection, serverTimestamp, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

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

const bugForm=document.getElementById('bugReportForm');
if(bugForm){
  const bugDevice=document.getElementById('bugDevice');
  const bugAndroid=document.getElementById('bugAndroid');
  const bugStatus=document.getElementById('bugStatus');
  const bugSubmit=document.getElementById('bugSubmit');

  const ua=navigator.userAgent||'';
  const deviceList=document.getElementById('androidDeviceList');
  const deviceHint=document.getElementById('bugDeviceHint');
  const compatibleDevices=new Set();

  if(deviceList){
    const csvUrl='https://raw.githubusercontent.com/unitycoder/AndroidDeviceList/master/devices.csv';

    const parseCsv=csv=>{
      const rows=[];
      let row=[],cell='',quoted=false;
      for(let i=0;i<csv.length;i++){
        const ch=csv[i], next=csv[i+1];
        if(ch==='"'){
          if(quoted && next==='"'){cell+='"';i++;}
          else quoted=!quoted;
        }else if(ch===',' && !quoted){row.push(cell.trim());cell='';}
        else if((ch==='\n'||ch==='\r') && !quoted){
          if(ch==='\r'&&next==='\n')i++;
          row.push(cell.trim());cell='';
          if(row.some(Boolean))rows.push(row);
          row=[];
        }else cell+=ch;
      }
      if(cell||row.length){row.push(cell.trim());rows.push(row);}
      return rows;
    };

    fetch(csvUrl,{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()})
      .then(csv=>{
        const rows=parseCsv(csv);
        const header=rows.shift().map(x=>x.toLowerCase());
        const idx=name=>header.findIndex(x=>x.includes(name.toLowerCase()));
        const iManufacturer=idx('manufacturer');
        const iModel=idx('model name');
        const iCode=idx('model code');
        const iRam=idx('ram');
        const iForm=idx('form factor');
        const iAbis=idx('abis');
        const iSdk=idx('android sdk');
        const iGles=idx('opengl es');

        const fragment=document.createDocumentFragment();
        const seen=new Set();

        const nums=text=>(text.match(/\d+(?:\.\d+)?/g)||[]).map(Number);

        rows.forEach(row=>{
          const manufacturer=(row[iManufacturer]||'').trim();
          const model=(row[iModel]||'').trim();
          const code=(row[iCode]||'').trim();
          const form=(row[iForm]||'').toLowerCase();
          const ram=nums(row[iRam]||'');
          const sdk=nums(row[iSdk]||'');
          const gles=nums(row[iGles]||'');
          const abis=(row[iAbis]||'').toLowerCase();

          if(!manufacturer||!model)return;
          if(!form.includes('phone')&&!form.includes('mobile'))return;
          if(!ram.some(v=>v>=3072))return;
          if(!sdk.some(v=>v>=24))return;
          if(!/(armeabi-v7a|arm64-v8a|armeabi)/.test(abis))return;
          if(!gles.some(v=>v>=3.0))return;

          const label=manufacturer+' '+model;
          const key=(label+' '+code).toLowerCase();
          if(seen.has(key))return;
          seen.add(key);
          compatibleDevices.add(label.toLowerCase());

          const option=document.createElement('option');
          option.value=label;
          option.label='Android 7.0+ · 3 ГБ+ · OpenGL ES 3.0+';
          fragment.appendChild(option);
        });

        deviceList.replaceChildren(fragment);
        if(deviceHint)deviceHint.textContent='Выберите модель из базы совместимых Android-устройств.';
      })
      .catch(err=>{
        console.error('Не удалось загрузить базу Android-устройств:',err);
        if(deviceHint)deviceHint.textContent='Не удалось загрузить базу устройств. Обновите страницу.';
      });
  }

  bugForm.addEventListener('submit',async e=>{
    e.preventDefault();
    bugStatus.textContent='Отправка...';
    bugStatus.className='bug-status';
    bugSubmit.disabled=true;

    if(!auth.currentUser){
      bugStatus.textContent='Сначала войдите или создайте аккаунт ниже.';
      bugStatus.className='bug-status error';
      bugSubmit.disabled=false;
      return;
    }

    const payload={
      device:bugDevice.value.trim(),
      android:bugAndroid.value.trim(),
      description:document.getElementById('bugDescription').value.trim(),
      steps:document.getElementById('bugSteps').value.trim()
    };

    try{
      await addDoc(collection(db,'bugs'),{
        device:payload.device,
        android:payload.android,
        description:payload.description,
        steps:payload.steps,
        createdAt:serverTimestamp(),
        userId:auth.currentUser.uid
      });
      bugStatus.textContent='Баг-репорт отправлен!';
      bugStatus.className='bug-status success';
      bugForm.reset();
      if(bugAndroid){
        const match=ua.match(/Android\s([0-9.]+)/i);
        if(match)bugAndroid.value='Android '+match[1];
      }
    }catch(err){
      console.error(err);
      bugStatus.textContent='Ошибка: '+(err.message||'неизвестная ошибка');
      bugStatus.className='bug-status error';
    }finally{
      bugSubmit.disabled=false;
    }
  });
}


function escapeHtml(value){
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}


const publicAuthForm=document.getElementById('publicAuthForm');
if(publicAuthForm){
  const publicEmail=document.getElementById('publicEmail');
  const publicPassword=document.getElementById('publicPassword');
  const publicAuthStatus=document.getElementById('publicAuthStatus');
  const publicLogin=document.getElementById('publicLogin');
  const publicRegister=document.getElementById('publicRegister');
  const publicLogout=document.getElementById('publicLogout');
  const myBugsBox=document.getElementById('myBugsBox');
  const myBugsList=document.getElementById('myBugsList');
  let stopMyBugs=null;

  const statusText={not_reviewed:'Не рассмотрено',reviewed:'Рассмотрено',rejected:'Отклонено',accepted:'Принято'};

  function renderMyBugs(snapshot){
    const docs=snapshot.docs.slice().sort((a,b)=>{
      const ta=a.data().createdAt?.toMillis?.()||0, tb=b.data().createdAt?.toMillis?.()||0;
      return tb-ta;
    });
    if(!docs.length){myBugsList.innerHTML='<p>Вы ещё не отправляли баг-репорты.</p>';return;}
    myBugsList.innerHTML='';
    docs.forEach(doc=>{
      const bug=doc.data();
      const article=document.createElement('article');
      article.className='bug-card';
      article.innerHTML='<div class="bug-card-top"><strong>🐛 Баг-репорт</strong><b>'+escapeHtml(statusText[bug.status]||'Не рассмотрено')+'</b></div>'+\
        '<p><b>📱 Устройство:</b> '+escapeHtml(bug.device||'Не указано')+'</p>'+\
        '<p><b>🤖 Android:</b> '+escapeHtml(bug.android||'Не указано')+'</p>'+\
        '<p><b>🐛 Описание:</b><br>'+escapeHtml(bug.description||'Не указано').replace(/\\n/g,'<br>')+'</p>';
      myBugsList.appendChild(article);
    });
  }

  function watchMyBugs(user){
    if(stopMyBugs)stopMyBugs();
    stopMyBugs=onSnapshot(query(collection(db,'bugs'),where('userId','==',user.uid)),renderMyBugs,error=>{
      console.error(error); myBugsList.innerHTML='<p class="error">Не удалось загрузить статусы: '+escapeHtml(error.message||'ошибка Firestore')+'</p>';
    });
  }

  publicLogin.onclick=async(e)=>{ e.preventDefault();
    publicAuthStatus.textContent='Вход...';
    publicLogin.disabled=true;
    try{await signInWithEmailAndPassword(auth,publicEmail.value.trim(),publicPassword.value);publicAuthStatus.textContent='';}
    catch(err){publicAuthStatus.textContent='Ошибка входа: '+(err.message||'проверьте почту и пароль');}
    finally{publicLogin.disabled=false;}
  };
  publicRegister.onclick=async(e)=>{ e.preventDefault();
    publicAuthStatus.textContent='Создание аккаунта...';
    publicRegister.disabled=true;
    try{await createUserWithEmailAndPassword(auth,publicEmail.value.trim(),publicPassword.value);publicAuthStatus.textContent='Аккаунт создан!';}
    catch(err){publicAuthStatus.textContent='Ошибка регистрации: '+(err.message||'не удалось создать аккаунт');}
    finally{publicRegister.disabled=false;}
  };
  publicLogout.onclick=(e)=>{ e.preventDefault(); signOut(auth); };

  onAuthStateChanged(auth,user=>{
    if(user){
      publicLogin.hidden=true; publicRegister.hidden=true; publicLogout.hidden=false;
      publicEmail.disabled=true; publicPassword.disabled=true;
      publicAuthStatus.textContent='Вы вошли как '+(user.email||'пользователь');
      myBugsBox.hidden=false; watchMyBugs(user);
    }else{
      publicLogin.hidden=false; publicRegister.hidden=false; publicLogout.hidden=true;
      publicEmail.disabled=false; publicPassword.disabled=false;
      myBugsBox.hidden=true; publicAuthStatus.textContent='';
      if(stopMyBugs)stopMyBugs();
    }
  });
}
