import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// 1. Add getFirestore import
import { getFirestore, collection, doc, onSnapshot, query, orderBy, limit, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDBVBv3jFPwlI5L6YnVbJmkWvhx25Ib05k",
    authDomain: "dormnearme.firebaseapp.com",
    projectId: "dormnearme",
    storageBucket: "dormnearme.firebasestorage.app",
    messagingSenderId: "985820537146",
    appId: "1:985820537146:web:e4693e0871a08b61b23003",
    measurementId: "G-8TKBSLP5K3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// 2. Initialize Firestore DB instance
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
    return signInWithPopup(auth, provider);
}

// Bell for dorm owners. Uses the same Google account and Firestore as existing pages.
// Notifications live under userNotifications/{uid}/items/{notificationId}.
let stopOwnerNotifications = null;
let ownerBellRoot = null;
let closeOwnerBellHandlers = null;

const ownerBellStyle = `
#dnm-owner-bell{position:relative;display:flex;align-items:center;margin:0 12px 0 0;z-index:200;flex-shrink:0}
#dnm-owner-bell *{box-sizing:border-box}
#dnm-owner-bell .dnm-bell-button{position:relative;width:39px;height:39px;border:1px solid #e2e8f0;background:#fff;color:#6d28d9;border-radius:50%;display:grid;place-items:center;cursor:pointer;padding:0}
#dnm-owner-bell .dnm-bell-button:hover,#dnm-owner-bell .dnm-bell-button:focus-visible{background:#f5f3ff;outline:2px solid transparent;box-shadow:0 0 0 2px #ddd6fe}
#dnm-owner-bell .dnm-bell-unread{position:absolute;top:-5px;right:-7px;min-width:18px;height:18px;padding:0 4px;border-radius:99px;background:#ef4444;color:#fff;font:600 10px/18px Kanit,sans-serif;text-align:center}
#dnm-owner-bell .dnm-bell-panel{position:absolute;top:calc(100% + 12px);right:0;width:min(345px,calc(100vw - 24px));max-height:min(460px,calc(100vh - 115px));overflow:auto;background:#fff;border:1px solid #e9e5f4;border-radius:14px;box-shadow:0 14px 40px rgba(30,41,59,.19);color:#1e293b;text-align:left}
#dnm-owner-bell .dnm-bell-panel[hidden],#dnm-owner-bell .dnm-bell-unread[hidden]{display:none!important}
#dnm-owner-bell .dnm-bell-head{padding:14px 16px;border-bottom:1px solid #f1f0f5;font:600 15px Kanit,sans-serif}
#dnm-owner-bell .dnm-bell-hint{color:#64748b;font:400 12px/1.55 Kanit,sans-serif;padding:18px 14px;text-align:center}
#dnm-owner-bell .dnm-bell-row{display:block;width:100%;border:0;border-bottom:1px solid #f1f0f5;background:#fff;text-align:left;padding:12px 15px;cursor:pointer;font:400 13px Kanit,sans-serif;color:#1e293b}
#dnm-owner-bell .dnm-bell-row:last-child{border-bottom:0}
#dnm-owner-bell .dnm-bell-row.unread{background:#faf7ff}
#dnm-owner-bell .dnm-bell-row:hover,#dnm-owner-bell .dnm-bell-row:focus-visible{background:#f3f0ff}
#dnm-owner-bell .dnm-bell-row-title{display:block;font-weight:600;color:#5b21b6;margin-bottom:4px;line-height:1.45}
#dnm-owner-bell .dnm-bell-row-desc{display:block;color:#475569;line-height:1.55;overflow-wrap:anywhere}
#dnm-owner-bell .dnm-bell-row-date{display:block;margin-top:5px;color:#94a3b8;font-size:11px}
@media(max-width:640px){#dnm-owner-bell .dnm-bell-panel{position:fixed;top:74px;right:12px;max-height:65vh}}
`;

function detachOwnerBell() {
    if (stopOwnerNotifications) { stopOwnerNotifications(); stopOwnerNotifications = null; }
    if (closeOwnerBellHandlers) { closeOwnerBellHandlers(); closeOwnerBellHandlers = null; }
    if (ownerBellRoot) { ownerBellRoot.remove(); ownerBellRoot = null; }
}

function mountOwnerBell(user) {
    detachOwnerBell();
    if (!user) return;
    const slot = document.getElementById('auth-section') || document.querySelector('nav');
    if (!slot) return;
    if (!document.getElementById('dnm-bell-style')) {
        const style = document.createElement('style');
        style.id = 'dnm-bell-style';
        style.textContent = ownerBellStyle;
        document.head.appendChild(style);
    }

    const root = document.createElement('div');
    root.id = 'dnm-owner-bell';
    root.style.marginLeft = slot.id === 'auth-section' ? '' : 'auto';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'dnm-bell-button';
    toggle.title = 'การแจ้งเตือนของฉัน';
    toggle.setAttribute('aria-label', 'ดูการแจ้งเตือนของฉัน');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
    const badge = document.createElement('span');
    badge.className = 'dnm-bell-unread';
    badge.hidden = true;
    toggle.appendChild(badge);

    const panel = document.createElement('div');
    panel.className = 'dnm-bell-panel';
    panel.id = 'dnm-owner-bell-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'รายการแจ้งเตือน');
    panel.hidden = true;
    toggle.setAttribute('aria-controls', panel.id);

    const header = document.createElement('div');
    header.className = 'dnm-bell-head';
    header.textContent = 'การแจ้งเตือนของฉัน';
    const list = document.createElement('div');
    panel.append(header, list);
    root.append(toggle, panel);
    slot.insertBefore(root, slot.firstChild);
    ownerBellRoot = root;

    function showMessage(message) {
        list.replaceChildren();
        const hint = document.createElement('div');
        hint.className = 'dnm-bell-hint';
        hint.textContent = message;
        list.appendChild(hint);
    }
    function closePanel() {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        toggle.setAttribute('aria-expanded', String(!panel.hidden));
    });
    const outside = event => { if (!root.contains(event.target)) closePanel(); };
    const onKey = event => { if (event.key === 'Escape') closePanel(); };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', onKey);
    closeOwnerBellHandlers = () => {
        document.removeEventListener('click', outside);
        document.removeEventListener('keydown', onKey);
    };
    showMessage('กำลังโหลดการแจ้งเตือน...');

    const notifications = collection(db, 'userNotifications', user.uid, 'items');
    stopOwnerNotifications = onSnapshot(
        query(notifications, orderBy('createdAt', 'desc'), limit(50)),
        snapshot => {
            if (ownerBellRoot !== root) return;
            list.replaceChildren();
            const unreadCount = snapshot.docs.filter(entry => entry.data().read !== true).length;
            badge.hidden = unreadCount === 0;
            badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
            if (snapshot.empty) { showMessage('ยังไม่มีการแจ้งเตือน'); return; }

            for (const entry of snapshot.docs) {
                const notice = entry.data();
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'dnm-bell-row' + (notice.read === true ? '' : ' unread');
                const title = document.createElement('span');
                title.className = 'dnm-bell-row-title';
                title.textContent = notice.type === 'dorm_approved' ? '✓ หอพักได้รับการอนุมัติแล้ว' : 'แจ้งเตือนใหม่';
                const description = document.createElement('span');
                description.className = 'dnm-bell-row-desc';
                description.textContent = notice.type === 'dorm_approved'
                    ? `“${String(notice.dormName || 'หอพักของคุณ')}” ได้เผยแพร่บน Dorm Near Me แล้ว แตะเพื่อดูรายละเอียด`
                    : 'แตะเพื่ออ่านการแจ้งเตือน';
                row.append(title, description);
                const date = notice.createdAt?.toDate?.();
                if (date instanceof Date && !Number.isNaN(date.getTime())) {
                    const time = document.createElement('span');
                    time.className = 'dnm-bell-row-date';
                    time.textContent = new Intl.DateTimeFormat('th-TH', {dateStyle:'medium',timeStyle:'short'}).format(date);
                    row.appendChild(time);
                }
                row.addEventListener('click', async () => {
                    row.disabled = true;
                    if (notice.read !== true) {
                        try { await updateDoc(doc(db, 'userNotifications', user.uid, 'items', entry.id), {read:true}); }
                        catch (err) { console.warn('Cannot mark notification as read:', err); }
                    }
                    const dormId = typeof notice.dormId === 'string' ? notice.dormId.trim() : '';
                    if (dormId) window.location.assign('details.html?id=' + encodeURIComponent(dormId));
                    else { row.disabled = false; closePanel(); }
                });
                list.appendChild(row);
            }
        },
        err => {
            console.warn('Notifications cannot be loaded:', err);
            if (ownerBellRoot === root) showMessage('อ่านการแจ้งเตือนไม่ได้ กรุณาตรวจสอบ Firestore Rules');
        }
    );
}

export function initAuth() {
    const loginBtn = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');

    if (loginBtn) loginBtn.onclick = () => loginWithGoogle();
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

    const adminEmails = ["seannakhonboy@gmail.com", "zainlawilmail@gmail.com"];

    onAuthStateChanged(auth, (user) => {
        mountOwnerBell(user);
        const navLinks = document.querySelector('.nav-links');

        if (user) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userPhoto) userPhoto.src = user.photoURL;

            if (adminEmails.includes(user.email)) {
                if (!document.getElementById('admin-nav-link')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = "admin.html";
                    adminLink.className = "nav-item";
                    adminLink.id = "admin-nav-link";
                    adminLink.innerText = "Admin";
                    
                    if (navLinks) navLinks.appendChild(adminLink);
                }
            }
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');

            const adminLink = document.getElementById('admin-nav-link');
            if (adminLink) adminLink.remove();
        }
    });
}

// 3. Export db along with auth, app, and provider
export { auth, app, provider, db };
