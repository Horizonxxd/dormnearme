// visitor-tracker.js — นับผู้เข้าชมรายวัน (หนึ่งเบราว์เซอร์ต่อวันโดยประมาณ)
// ใช้: ใส่ <script type="module" src="visitor-tracker.js"></script> ในทุกหน้าที่ต้องการนับ (เช่น index.html)
// เก็บที่ Firestore: dailyVisitors/YYYY-MM-DD  { visitors: จำนวน }  (เวลาไทย)

import { app } from './auth.js';
import { getFirestore, doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
 
(async () => {
  try {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()); // YYYY-MM-DD
    if (localStorage.getItem('vt_last') === key) return; // นับแล้ววันนี้
    await setDoc(doc(getFirestore(app), 'dailyVisitors', key), { visitors: increment(1) }, { merge: true });
    localStorage.setItem('vt_last', key);
  } catch (e) { console.warn('visitor-tracker:', e.code || e.message); }
})();
 