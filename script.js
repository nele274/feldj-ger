// ======================================== 

// FELDJÄGER ULTIMATE MAXPLUS 

// SUPABASE + LOGIN + AKTENREGISTER 

// ======================================== 

 

const SUPABASE_URL = "https://vpxgjzbptfnsrzrnxndo.supabase.co"; 

 

const SUPABASE_KEY = "sb_publishable_bo68zX2qVANCUemJOD977Q_I_2dSNF-"; 

 

const db = window.supabase.createClient( 

  SUPABASE_URL, 

  SUPABASE_KEY 

); 

 

window.db = db; 

 

let currentUser = null; 

let currentProfile = null; 

 

// ======================================== 

// MELDUNGEN 

// ======================================== 

 

function showMessage(message, isError = false) { 

  const element = document.getElementById("authMessage"); 

 

  if (!element) return; 

 

  element.textContent = message; 

  element.style.color = isError ? "#ff6464" : "#ffad52"; 

} 

 

// ======================================== 

// LOGIN ANZEIGEN 

// ======================================== 

 

function showLogin() { 

  const loginBox = document.getElementById("loginBox"); 

  const caseApp = document.getElementById("caseApp"); 

 

  if (loginBox) loginBox.hidden = false; 

  if (caseApp) caseApp.hidden = true; 

} 

 

// ======================================== 

// DASHBOARD ANZEIGEN 

// ======================================== 

 

function showDashboard() { 

  const loginBox = document.getElementById("loginBox"); 

  const caseApp = document.getElementById("caseApp"); 

 

  if (loginBox) loginBox.hidden = true; 

  if (caseApp) caseApp.hidden = false; 

} 

 

// ======================================== 

// BENUTZERPROFIL LADEN 

// ======================================== 

 

async function loadProfile(userId) { 

  const { data, error } = await db 

    .from("profiles") 

    .select("id, display_name, username, role, created_at") 

    .eq("id", userId) 

    .maybeSingle(); 

 

  if (error) { 

    console.error("Profilfehler:", error); 

    return null; 

  } 

 

  return data; 

} 

 

// ======================================== 

// ROLLEN PRÜFEN 

// ======================================== 

 

function getUserRole() { 

  return currentProfile?.role || "member"; 

} 

 

function isLeadership() { 

  return ["admin", "deputy"].includes(getUserRole()); 

} 

 

function isPersonnelDepartment() { 

  return getUserRole() === "personalabteilung"; 

} 

 

function hasPersonnelAccess() { 

  return isLeadership() || isPersonnelDepartment(); 

} 

 

// ======================================== 

// SITZUNG VERARBEITEN 

// ======================================== 

 

async function syncSession(session) { 

  if (!session) { 

    currentUser = null; 

    currentProfile = null; 

    showLogin(); 

    return; 

  } 

 

  currentUser = session.user; 

 

  currentProfile = await loadProfile(currentUser.id); 

 

  showDashboard(); 

 

  const dashboardHeader = document.querySelector( 

    ".dashboard-header" 

  ); 

 

  if (dashboardHeader) { 

    const heading = dashboardHeader.querySelector("h2"); 

 

    if (heading) { 

      const displayName = 

        currentProfile?.display_name || 

        currentProfile?.username || 

        currentUser.email; 

 

      heading.textContent = "Willkommen, " + displayName; 

    } 

  } 

 

  await loadAkten(); 

} 

 

// ======================================== 

// AKTENREGISTER LADEN 

// ======================================== 

 

async function loadAkten() { 

  const container = document.getElementById("caseRows"); 

 

  if (!container) return; 

 

  container.textContent = "Akten werden geladen ..."; 

 

  const { data, error } = await db 

    .from("akten") 

    .select("id, aktennummer, kategorie, betreff, status, erstellt_am") 

    .order("erstellt_am", { ascending: false }); 

 

  if (error) { 

    console.error("Aktenfehler:", error); 

 

    container.textContent = 

      "Akten konnten nicht geladen werden. Bitte Berechtigungen prüfen."; 

 

    return; 

  } 

 

  if (!data || data.length === 0) { 

    container.textContent = "Noch keine Akten vorhanden."; 

    return; 

  } 

 

  const table = document.createElement("table"); 

  const header = document.createElement("tr"); 

 

  [ 

    "Aktennummer", 

    "Kategorie", 

    "Betreff", 

    "Status", 

    "Erstellt am" 

  ].forEach(label => { 

    const th = document.createElement("th"); 

    th.textContent = label; 

    header.appendChild(th); 

  }); 

 

  table.appendChild(header); 

 

  data.forEach(akte => { 

    const row = document.createElement("tr"); 

 

    const values = [ 

      akte.aktennummer, 

      akte.kategorie, 

      akte.betreff, 

      akte.status, 

      akte.erstellt_am 

        ? new Date(akte.erstellt_am).toLocaleDateString("de-DE") 

        : "-" 

    ]; 

 

    values.forEach(value => { 

      const cell = document.createElement("td"); 

      cell.textContent = value ?? "-"; 

      cell.style.padding = "10px"; 

      row.appendChild(cell); 

    }); 

 

    table.appendChild(row); 

  }); 

 

  container.replaceChildren(table); 

} 

 

// ======================================== 

// ANMELDEN 

// ======================================== 

 

const loginForm = document.getElementById("loginForm"); 

 

if (loginForm) { 

  loginForm.addEventListener("submit", async event => { 

    event.preventDefault(); 

 

    const email = document.getElementById("email").value.trim(); 

    const password = document.getElementById("password").value; 

 

    showMessage("Anmeldung wird geprüft ..."); 

 

    const { data, error } = await db.auth.signInWithPassword({ 

      email, 

      password 

    }); 

 

    if (error) { 

      showMessage( 

        "Anmeldung fehlgeschlagen: " + error.message, 

        true 

      ); 

      return; 

    } 

 

    await syncSession(data.session); 

 

    showMessage("Erfolgreich angemeldet."); 

  }); 

} 

 

// ======================================== 

// ABMELDEN 

// ======================================== 

 

const logoutBtn = document.getElementById("logoutBtn"); 

 

if (logoutBtn) { 

  logoutBtn.addEventListener("click", async () => { 

    const { error } = await db.auth.signOut(); 

 

    if (error) { 

      showMessage("Abmeldung fehlgeschlagen.", true); 

      return; 

    } 

 

    currentUser = null; 

    currentProfile = null; 

 

    showLogin(); 

    showMessage("Du wurdest abgemeldet."); 

  }); 

} 

 

// ======================================== 

// WEBSITE STARTEN 

// ======================================== 

 

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
