import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Central Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDBVBv3jFPwlI5L6YnVbJmkWvhx25Ib05k",
    authDomain: "dormnearme.firebaseapp.com",
    projectId: "dormnearme",
    storageBucket: "dormnearme.firebasestorage.app",
    messagingSenderId: "985820537146",
    appId: "1:985820537146:web:e4693e0871a08b61b23003",
    measurementId: "G-8TKBSLP5K3"
};

// 2. Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 3. New Exportable Login Function
export async function loginWithGoogle() {
    return signInWithPopup(auth, provider);
}

// 4. Global Auth Logic (for Navbars)
export function initAuth() {
    const loginBtn = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');

    if (loginBtn) loginBtn.onclick = () => loginWithGoogle();
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

    // List of allowed administrators
    const adminEmails = ["seannakhonboy@gmail.com", "zainlawilmail@gmail.com"];

    onAuthStateChanged(auth, (user) => {
        const navLinks = document.querySelector('.nav-links'); // The container for your menu items

        if (user) {
            // 1. Standard User UI
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userPhoto) userPhoto.src = user.photoURL;

            // 2. ADMIN CHECK: Updated to check if the user is in the admin array
            if (adminEmails.includes(user.email)) {
                // Check if it's already there so we don't add it twice
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
            // 3. Logged Out State
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');

            // 4. CLEANUP: Remove Admin link if logging out
            const adminLink = document.getElementById('admin-nav-link');
            if (adminLink) adminLink.remove();
        }
    });
}

// 5. Export everything clearly
export { auth, app, provider };