import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// 1. Add getFirestore import
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

export function initAuth() {
    const loginBtn = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');

    if (loginBtn) loginBtn.onclick = () => loginWithGoogle();
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

    const adminEmails = ["seannakhonboy@gmail.com", "zainlawilmail@gmail.com"];

    onAuthStateChanged(auth, (user) => {
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