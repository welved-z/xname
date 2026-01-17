// app.js - application logic (vanilla JS) using exported Firebase instances
import { auth, provider, db, storage } from './firebase.js';
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import {
  collection, doc, getDoc, setDoc, query, where, onSnapshot, getDocs,
  addDoc, orderBy, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

/* UI refs (sama seperti sebelumnya) */
const loginView = document.getElementById('loginView');
const appRoot = document.getElementById('app');

const googleSignInBtn = document.getElementById('googleSignInBtn');
const avatarBtn = document.getElementById('avatarBtn');
const avatarMenu = document.getElementById('avatarMenu');
const avatarImg = document.getElementById('avatarImg');
const logoutBtn = document.getElementById('logoutBtn');
const openProfileBtn = document.getElementById('openProfileBtn');

const views = {
  dashboard: document.getElementById('dashboardView'),
  jurnal: document.getElementById('jurnalView'),
  absensi: document.getElementById('absensiView'),
};

const navBtns = document.querySelectorAll('.navBtn');

const matangCount = document.getElementById('matangCount');
const prokerCount = document.getElementById('prokerCount');
const listContainer = document.getElementById('listContainer');
const emptyState = document.getElementById('emptyState');
const listInfo = document.getElementById('listInfo');

const openNewEntry = document.getElementById('openNewEntry');
const entryForm = document.getElementById('entryForm');
const selectProker = document.getElementById('selectProker');
const selectKader = document.getElementById('selectKader');
const tagsInput = document.getElementById('tagsInput');
const jurnalList = document.getElementById('jurnalList');
const attachmentInput = document.getElementById('attachment');

const profileModal = document.getElementById('profileModal');
const profileName = document.getElementById('profileName');
const profilePosition = document.getElementById('profilePosition');
const profileClass = document.getElementById('profileClass');
const profileAvatar = document.getElementById('profileAvatar');
const profileEntries = document.getElementById('profileEntries');
const closeProfile = document.getElementById('closeProfile');

let currentUser = null;
let usersCache = {};

/* Auth */
googleSignInBtn.addEventListener('click', async () => {
  try { await signInWithPopup(auth, provider); }
  catch (e) { alert('Gagal login: ' + e.message); }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

/* avatar dropdown */
avatarBtn.addEventListener('click', () => avatarMenu.classList.toggle('hidden'));

/* nav switching */
document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', (e) => showView(e.currentTarget.getAttribute('data-view')));
});

/* profile modal */
openProfileBtn.addEventListener('click', async () => { avatarMenu.classList.add('hidden'); await openProfileModal(); });
closeProfile.addEventListener('click', () => profileModal.classList.add('hidden'));

/* on auth change */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loginView.classList.add('hidden');
    appRoot.classList.remove('hidden');
    avatarImg.src = user.photoURL || 'assets/avatar-placeholder.png';
    profileAvatar.src = user.photoURL || 'assets/avatar-placeholder.png';
    await ensureUserDoc(user);        // now sets doc id = uid
    initRealtime();
    showView('dashboard');
  } else {
    currentUser = null;
    appRoot.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
});

/* Ensure users doc with id = uid (production-friendly) */
async function ensureUserDoc(user) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || '',
        username: user.email || '',
        role: 'admin',               // default for first users — adjust later
        position: 'Penilai Utama',
        class: '',
        avatarUrl: user.photoURL || '',
        cohort: 27,
        createdAt: serverTimestamp()
      }, { merge: true });
    } else {
      usersCache[user.uid] = snap.data();
    }
  } catch (e) {
    console.error('ensureUserDoc error', e);
  }
}

/* Realtime listeners */
let entriesUnsub = null;
let usersUnsub = null;
let prokersUnsub = null;

function initRealtime() {
  const usersCol = collection(db, 'users');
  usersUnsub = onSnapshot(usersCol, snapshot => {
    usersCache = {};
    snapshot.forEach(d => {
      const data = d.data();
      const uid = data.uid || d.id;
      usersCache[uid] = data;
    });
    renderList();
    populateKaderSelect();
  });

  const prokersCol = collection(db, 'prokers');
  prokersUnsub = onSnapshot(prokersCol, snap => {
    selectProker.innerHTML = '<option value="">Pilih Proker...</option>';
    snap.forEach(d => {
      const data = d.data();
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = data.title || '—';
      selectProker.appendChild(opt);
    });
    prokerCount.textContent = snap.size;
  });

  const entriesCol = collection(db, 'entries');
  const q = query(entriesCol, orderBy('date','desc'));
  entriesUnsub = onSnapshot(q, snap => {
    jurnalList.innerHTML = '';
    if (snap.empty) {
      jurnalList.innerHTML = '<div class="text-sm text-muted">Belum ada catatan.</div>';
    } else {
      snap.forEach(d => {
        const ed = d.data();
        const wrapper = document.createElement('div');
        wrapper.className = 'card p-3';
        const authorName = usersCache[ed.authorId]?.name || 'Pengurus';
        const kaderName = usersCache[ed.userId]?.name || 'Kader';
        const attHtml = (ed.attachments && ed.attachments.length) ? `<div class="mt-2"><img src="${ed.attachments[0]}" alt="lampiran" style="max-width:220px;border-radius:8px" /></div>` : '';
        wrapper.innerHTML = `
          <div>
            <div class="text-sm font-semibold">${kaderName} <span class="text-xs text-muted">— ${ed.tags?.join(', ') || ''}</span></div>
            <div class="text-xs text-muted italic mt-1">${(ed.narrative || '').slice(0,180)}</div>
            ${attHtml}
            <div class="text-xs text-muted mt-2">Oleh: ${authorName} • ${new Date(ed.date?.seconds * 1000 || Date.now()).toLocaleString()}</div>
          </div>
        `;
        jurnalList.appendChild(wrapper);
      });
    }
    renderList(snap);
  });
}

/* UI helpers */
function showView(name) {
  document.querySelectorAll('.navBtn').forEach(n => n.classList.remove('active'));
  document.querySelectorAll(`[data-view="${name}"]`).forEach(n => n.classList.add('active'));
  for (const [k, el] of Object.entries(views)) {
    if (k === name) el.classList.remove('hidden'); else el.classList.add('hidden');
  }
}

function renderList(entriesSnapshot) {
  const usersArr = Object.values(usersCache).filter(u => (u.role || 'kader') === 'kader');
  const total = usersArr.length;
  listInfo.textContent = `Menampilkan ${Math.min(total,3)} dari ${total} kader`;
  listContainer.innerHTML = '';
  if (usersArr.length === 0) {
    emptyState.textContent = 'Belum ada data kader.';
    listContainer.appendChild(emptyState);
    return;
  }

  usersArr.slice(0, 20).forEach(u => {
    const card = document.createElement('div');
    card.className = 'card p-3 mb-3';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-bold">${u.name}</div>
          <div class="text-xs text-muted">Angkatan ${u.cohort || '—'} • ${u.class || ''}</div>
        </div>
        <div class="text-right">
          <div class="text-sm text-muted">${(u.position || '')}</div>
          <div class="mt-2"><a href="#" class="text-primary text-sm detailLink" data-uid="${u.uid || ''}">Detail</a></div>
        </div>
      </div>
    `;
    listContainer.appendChild(card);
  });

  const matang = usersArr.filter(u => u.status === 'matang').length;
  matangCount.textContent = matang || Math.min(15, usersArr.length);
}

function populateKaderSelect() {
  selectKader.innerHTML = '<option value="">Pilih Kader...</option>';
  Object.values(usersCache).filter(u => (u.role || 'kader') === 'kader').forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.uid || u.id || '';
    opt.textContent = u.name;
    selectKader.appendChild(opt);
  });
}

/* Entry form handling with attachment upload */
entryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prokerId = selectProker.value;
  const userId = selectKader.value;
  const narrative = document.getElementById('narrative').value.trim();
  const tags = tagsInput.value.split(',').map(s => s.trim()).filter(Boolean);
  const file = attachmentInput.files?.[0] || null;

  if (!prokerId || !userId || !narrative) {
    alert('Lengkapi Proker, Kader, dan Observasi.');
    return;
  }

  try {
    const docRef = await addDoc(collection(db, 'entries'), {
      prokerId, userId, authorId: currentUser.uid, date: serverTimestamp(),
      narrative, tags, skills: tags, attachments: []
    });

    if (file) {
      const path = `attachments/${docRef.id}/${Date.now()}_${file.name}`;
      const r = storageRef(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      await updateDoc(doc(db, 'entries', docRef.id), { attachments: [url] });
    }

    entryForm.reset();
    alert('Catatan tersimpan.');
  } catch (err) {
    console.error(err);
    alert('Gagal menyimpan: ' + err.message);
  }
});

document.getElementById('clearEntry').addEventListener('click', () => entryForm.reset());
openNewEntry.addEventListener('click', () => showView('jurnal'));

/* Profile modal */
async function openProfileModal() {
  profileEntries.innerHTML = 'Memuat...';
  const u = usersCache[currentUser.uid] || null;
  profileName.textContent = u?.name || currentUser.displayName || 'Pengurus';
  profilePosition.textContent = u?.position || 'Penilai';
  profileClass.textContent = u?.class || '-';
  profileAvatar.src = u?.avatarUrl || currentUser.photoURL || 'assets/avatar-placeholder.png';

  const eCol = collection(db, 'entries');
  const q = query(eCol, where('authorId','==', currentUser.uid), orderBy('date','desc'));
  const snap = await getDocs(q);
  if (snap.empty) profileEntries.textContent = 'Belum ada penilaian yang Anda buat.';
  else {
    profileEntries.innerHTML = '';
    snap.forEach(d => {
      const ed = d.data();
      const el = document.createElement('div');
      el.className = 'text-sm p-2';
      el.innerHTML = `<div class="font-semibold">${(usersCache[ed.userId]?.name)||'Kader'}</div>
        <div class="text-xs text-muted">${(ed.narrative||'').slice(0,120)}</div>`;
      profileEntries.appendChild(el);
    });
  }
  profileModal.classList.remove('hidden');
}

/* cleanup */
window.addEventListener('beforeunload', () => {
  if (typeof usersUnsub === 'function') usersUnsub();
  if (typeof entriesUnsub === 'function') entriesUnsub();
  if (typeof prokersUnsub === 'function') prokersUnsub();
});

console.log('App initialized (client).');
