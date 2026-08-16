import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// Make sure to import your initialized 'db' here
import { db } from "./firebase-config.js"; 

// Attach to the window object so it can be called from inline HTML attributes
window.goToDormDetails = async function(dormId) {
  try {
    const dormRef = doc(db, "listings", dormId);
    
    // Wait for the click to log successfully
    await updateDoc(dormRef, {
      clicks: increment(1)
    });
  } catch (error) {
    console.error("Error logging click:", error);
  } finally {
    // ALWAYS redirect the user, even if the database write fails
    // This prevents the user from being stuck on a broken page
    window.location.href = `details.html?id=${dormId}`;
  }
};