// ========================================== 

// FELDJÄGER ULTIMATE MAXPLUS 

// Anmeldung und Sitzungsverwaltung 

// ========================================== 

 

const SUPABASE_URL = "https://vpxgjzbptfnsrzrnxndo.supabase.co"; 

const SUPABASE_ANON_KEY = "sb_publishable_bo68zX2qVANCUemJOD977Q_I_2dSNF-"; 

 

const db = window.supabase.createClient( 

  SUPABASE_URL, 

  SUPABASE_ANON_KEY 

); 

 

// HTML-Elemente 

const loginForm = document.getElementById("loginForm"); 

const loginBox = document.getElementById("loginBox"); 

const emailInput = document.getElementById("email"); 

const passwordInput = document.getElementById("password"); 

const authMessage = document.getElementById("authMessage"); 

const caseApp = document.getElementById("caseApp"); 

const logoutBtn = document.getElementById("logoutBtn"); 

const caseRows = document.getElementById("caseRows"); 

 

// Rollenbezeichnungen 

const ROLE_NAMES = { 

  admin: "Divisionsleitung", 

  deputy: "Stellvertretung", 

  personnel: "Personalabteilung", 

  leader: "Führungskraft", 

  member: "Mitglied" 

}; 

 

// Nachricht anzeigen 

function showMessage(message, isError = false) { 

  if (!authMessage) return; 

 

  authMessage.textContent = message; 

  authMessage.style.color = isError ? "#ff7777" : "#ffad52"; 

} 

 

// Dashboard anzeigen oder verbergen 

function showDashboard(profile) { 

  if (loginBox) loginBox.hidden = true; 

  if (caseApp) caseApp.hidden = false; 

 

  if (!profile) return; 

 

  const dashboardHeader = document.querySelector(".dashboard-header"); 

 

  if (dashboardHeader) { 

    let profileInfo = document.getElementById("profileInfo"); 

 

    if (!profileInfo) { 

      profileInfo = document.createElement("p"); 

      profileInfo.id = "profileInfo"; 

      dashboardHeader.appendChild(profileInfo); 

    } 

 

    const name = profile.display_name || profile.username || "Mitglied"; 

    const role = ROLE_NAMES[profile.role] || "Unbekannte Rolle"; 

 

    profileInfo.textContent = `Angemeldet als: ${name} · ${role}`; 

  } 

 

  if (caseRows) { 

    caseRows.textContent = 

      "Die Aktenmodule werden nach Einrichtung der Datenbankrechte aktiviert."; 

  } 

} 

 

// Login anzeigen 

function showLogin() { 

  if (loginBox) loginBox.hidden = false; 

  if (caseApp) caseApp.hidden = true; 

} 

 

// Benutzerprofil laden 

async function loadProfile(userId) { 

  const { data, error } = await db 

    .from("profiles") 

    .select("id, display_name, username, role") 

    .eq("id", userId) 

    .maybeSingle(); 

 

  if (error) { 

    console.error("Profilfehler:", error); 

    throw new Error("Dein Benutzerprofil konnte nicht geladen werden."); 

  } 

 

  if (!data) { 

    throw new Error( 

      "Für dieses Konto wurde noch kein Benutzerprofil eingerichtet." 

    ); 

  } 

 

  return data; 

} 

 

// Aktuelle Sitzung verarbeiten 

async function syncSession(session) { 

  if (!session) { 

    showLogin(); 

    return; 

  } 

 

  try { 

    const profile = await loadProfile(session.user.id); 

    showDashboard(profile); 

  } catch (error) { 

    showLogin(); 

    showMessage(error.message, true); 

  } 

} 

 

// ANMELDUNG 

if (loginForm) { 

  loginForm.addEventListener("submit", async (event) => { 

    event.preventDefault(); 

 

    const email = emailInput.value.trim(); 

    const password = passwordInput.value; 

 

    showMessage("Anmeldung läuft ..."); 

 

    const { data, error } = await db.auth.signInWithPassword({ 

      email, 

      password 

    }); 

 

    if (error) { 

      showMessage("Anmeldung fehlgeschlagen: " + error.message, true); 

      return; 

    } 

 

    try { 

      await syncSession(data.session); 

      passwordInput.value = ""; 

    } catch (error) { 

      showMessage(error.message, true); 

    } 

  }); 

} 

 

// ABMELDUNG 

if (logoutBtn) { 

  logoutBtn.addEventListener("click", async () => { 

    showMessage("Abmeldung läuft ..."); 

 

    const { error } = await db.auth.signOut(); 

 

    if (error) { 

      showMessage("Abmeldung fehlgeschlagen: " + error.message, true); 

      return; 

    } 

 

    showLogin(); 

    showMessage("Du wurdest erfolgreich abgemeldet."); 

  }); 

} 

 

// ÄNDERUNGEN DER ANMELDUNG ERKENNEN 

db.auth.onAuthStateChange((event, session) => { 

  if (event === "SIGNED_IN" || 

      event === "SIGNED_OUT" || 

      event === "TOKEN_REFRESHED") { 

    Promise.resolve().then(() => syncSession(session)); 

  } 

}); 

 

// WEBSITE STARTEN 

async function startWebsite() { 

  showLogin(); 

 

  const { data, error } = await db.auth.getSession(); 

 

  if (error) { 

    showMessage("Sitzung konnte nicht geprüft werden.", true); 

    console.error(error); 

    return; 

  } 

 

  await syncSession(data.session); 

} 

 

startWebsite(); 

 

console.log("Feldjäger Ultimate Maxplus gestartet.");
