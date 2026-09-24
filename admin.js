import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc as firestoreDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const loginBox = document.getElementById("loginBox");
const bugsBox = document.getElementById("bugsBox");
const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginStatus = document.getElementById("loginStatus");
const bugsList = document.getElementById("bugsList");
const logoutBtn = document.getElementById("logoutBtn");
const ADMIN_UID = "uCk9dm2IGRULahkfcc9JpCX0Hwq1";

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Вход...";
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    if (userCredential.user.uid !== ADMIN_UID) {
      await signOut(auth);
      loginStatus.textContent = "Этот аккаунт не имеет доступа к админке.";
      return;
    }
    loginStatus.textContent = "";
  } catch (error) {
    console.error(error);
    loginStatus.textContent = "Неверная почта или пароль.";
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

function formatDate(value) {
  if (!value) return "Дата не указана";
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "Дата не указана" : date.toLocaleString("ru-RU");
}

let stopBugsListener = null;

function loadBugs() {
  bugsList.innerHTML = "<p>Загрузка...</p>";
  if (stopBugsListener) stopBugsListener();

  stopBugsListener = onSnapshot(
    collection(db, "bugs"),
    (snapshot) => {
      const docs = snapshot.docs.slice().sort((a, b) => {
        const ta = a.data().createdAt?.toMillis?.() || 0;
        const tb = b.data().createdAt?.toMillis?.() || 0;
        return tb - ta;
      });

      if (!docs.length) {
        bugsList.innerHTML = "<p>Баг-репортов пока нет.</p>";
        return;
      }

      bugsList.innerHTML = "";
      docs.forEach((bugDoc) => {
        const bug = bugDoc.data();
        const article = document.createElement("article");
        article.className = "bug-card";
        article.innerHTML =
          "<div class='bug-card-top'><strong>🐛 Баг-репорт</strong><time>" + formatDate(bug.createdAt) + "</time></div>" +
          "<p><b>📱 Устройство:</b> " + escapeHtml(bug.device || "Не указано") + "</p>" +
          "<p><b>🤖 Android:</b> " + escapeHtml(bug.android || "Не указано") + "</p>" +
          "<p><b>🐛 Описание:</b><br>" + escapeHtml(bug.description || "Не указано").replace(/\n/g, "<br>") + "</p>" +
          "<p><b>🔁 Как повторить:</b><br>" + escapeHtml(bug.steps || "Не указано").replace(/\n/g, "<br>") + "</p>" +
          "<p><b>📌 Статус:</b> <span class='bug-status-label'>" + escapeHtml({not_reviewed:'Не рассмотрено',reviewed:'Рассмотрено',rejected:'Отклонено',accepted:'Принято'}[bug.status] || 'Не рассмотрено') + "</span></p>" +
          "<label>Изменить статус<select class='bug-status-select'>" +
          "<option value='not_reviewed'>Не рассмотрено</option><option value='reviewed'>Рассмотрено</option><option value='rejected'>Отклонено</option><option value='accepted'>Принято</option>" +
          "</select></label>";
        const select=article.querySelector('.bug-status-select');
        select.value=bug.status||'not_reviewed';
        select.addEventListener('change',async()=>{try{await updateDoc(firestoreDoc(db,'bugs',bugDoc.id),{status:select.value});}catch(error){console.error(error);alert('Не удалось изменить статус: '+(error.message||'ошибка Firestore'));select.value=bug.status||'not_reviewed';}});
        bugsList.appendChild(article);
      });
    },
    (error) => {
      console.error("Firestore listener error:", error);
      bugsList.innerHTML = "<p class='error'>Ошибка Firestore: " + escapeHtml(error.message || "неизвестная ошибка") + "</p>";
    }
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (user.uid !== ADMIN_UID) {
      await signOut(auth);
      loginBox.hidden = false;
      bugsBox.hidden = true;
      loginStatus.textContent = "Этот аккаунт не имеет доступа к админке.";
      return;
    }
    loginBox.hidden = true;
    bugsBox.hidden = false;
    loadBugs();
  } else {
    loginBox.hidden = false;
    bugsBox.hidden = true;
  }
});
