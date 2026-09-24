import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const loginBox = document.getElementById("loginBox");
const bugsBox = document.getElementById("bugsBox");
const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginStatus = document.getElementById("loginStatus");
const bugsList = document.getElementById("bugsList");
const logoutBtn = document.getElementById("logoutBtn");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Вход...";
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
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
      docs.forEach((doc) => {
        const bug = doc.data();
        const article = document.createElement("article");
        article.className = "bug-card";
        article.innerHTML =
          "<div class='bug-card-top'><strong>🐛 Баг-репорт</strong><time>" + formatDate(bug.createdAt) + "</time></div>" +
          "<p><b>📱 Устройство:</b> " + escapeHtml(bug.device || "Не указано") + "</p>" +
          "<p><b>🤖 Android:</b> " + escapeHtml(bug.android || "Не указано") + "</p>" +
          "<p><b>🐛 Описание:</b><br>" + escapeHtml(bug.description || "Не указано").replace(/\n/g, "<br>") + "</p>" +
          "<p><b>🔁 Как повторить:</b><br>" + escapeHtml(bug.steps || "Не указано").replace(/\n/g, "<br>") + "</p>";
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

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBox.hidden = true;
    bugsBox.hidden = false;
    loadBugs();
  } else {
    loginBox.hidden = false;
    bugsBox.hidden = true;
  }
});
