tet."); /* ========================================== 

   FELDJÄGER ULTIMATE MAXPLUS 

   LOGIN + PERSONALVERWALTUNG + AKTENREGISTER 

========================================== */ 

 

const SUPABASE_URL = "https://vpxgjzbptfnsrzrnxndo.supabase.co"; 

const SUPABASE_KEY = "sb_publishable_bo68zX2qVANCUemJOD977Q_I_2dSNF-"; 

 

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

 

let currentUser = null; 

let currentProfile = null; 

let dashboardPanel = null; 

let dashboardCards = null; 

let aktenContainer = null; 

 

/* ========================================== 

   HILFSFUNKTIONEN 

========================================== */ 

 

function createElement(tag, text, className) { 

  const element = document.createElement(tag); 

 

  if (text !== undefined) element.textContent = text; 

  if (className) element.className = className; 

 

  return element; 

} 

 

function showMessage(message, isError = false) { 

  const element = document.getElementById("authMessage"); 

  if (!element) return; 

 

  element.textContent = message; 

  element.style.color = isError ? "#ff6464" : "#ffad52"; 

} 

 

function showLogin() { 

  document.getElementById("loginBox").hidden = false; 

  document.getElementById("caseApp").hidden = true; 

} 

 

function showDashboard() { 

  document.getElementById("loginBox").hidden = true; 

  document.getElementById("caseApp").hidden = false; 

 

  if (dashboardCards) dashboardCards.hidden = false; 

  if (dashboardPanel) dashboardPanel.hidden = true; 

  if (aktenContainer) aktenContainer.parentElement.hidden = false; 

} 

 

/* ========================================== 

   BENUTZER UND BERECHTIGUNGEN 

========================================== */ 

 

async function loadProfile(userId) { 

  const { data, error } = await db 

    .from("profiles") 

    .select("id, display_name, username, role, created_at") 

    .eq("id", userId) 

    .maybeSingle(); 

 

  if (error) { 

    console.error("Profil konnte nicht geladen werden:", error); 

    return null; 

  } 

 

  return data; 

} 

 

function getUserRole() { 

  return String(currentProfile?.role || "").toLowerCase(); 

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

 

/* ========================================== 

   DASHBOARD UND NAVIGATION 

========================================== */ 

 

const dashboardDescriptions = { 

  "Personalverwaltung": 

    "Mitarbeiterübersicht, Suche und Mitarbeiterprofile.", 

  "Beförderungen": 

    "Beförderungsvorschläge und Ernennungen verwalten.", 

  "Bewertungen": 

    "Mitarbeiterleistungen dokumentieren.", 

  "Genehmigungen": 

    "Anträge und Entscheidungen verwalten.", 

  "Personalabteilung": 

    "Interne Personalverwaltung und Personalaufgaben.", 

  "Digitales Archiv": 

    "Dokumente und abgeschlossene Vorgänge verwalten." 

}; 

 

function setupDashboard() { 

  dashboardCards = document.querySelector(".dashboard-cards"); 

  aktenContainer = document.getElementById("caseRows"); 

 

  if (!dashboardCards) return; 

 

  dashboardPanel = createElement("div", undefined, "card"); 

  dashboardPanel.hidden = true; 

  dashboardPanel.style.marginBottom = "30px"; 

 

  dashboardCards.after(dashboardPanel); 

 

  // Klicks werden zentral abgefangen, damit 

  // der alte Platzhalter-Code nicht dazwischenfunkt. 

 

  dashboardCards.addEventListener("click", event => { 

    const card = event.target.closest(".card"); 

    if (!card || !dashboardCards.contains(card)) return; 

 

    event.preventDefault(); 

    event.stopImmediatePropagation(); 

 

    openDashboardSection(card.querySelector("h3")?.textContent); 

  }, true); 

 

  dashboardCards.addEventListener("keydown", event => { 

    const card = event.target.closest(".card"); 

    if (!card || !dashboardCards.contains(card)) return; 

 

    if (event.key === "Enter" || event.key === " ") { 

      event.preventDefault(); 

      event.stopImmediatePropagation(); 

 

      openDashboardSection(card.querySelector("h3")?.textContent); 

    } 

  }, true); 

} 

 

function openDashboardSection(title) { 

  if (!title) return; 

 

  dashboardCards.hidden = true; 

 

  if (aktenContainer) { 

    aktenContainer.parentElement.hidden = true; 

  } 

 

  dashboardPanel.replaceChildren(); 

  dashboardPanel.hidden = false; 

 

  const heading = createElement("h2", title); 

  const description = createElement( 

    "p", 

    dashboardDescriptions[title] || "Interner Verwaltungsbereich." 

  ); 

 

  dashboardPanel.append(heading, description); 

 

  if (title === "Personalverwaltung") { 

    loadEmployees(); 

  } else if (title === "Personalabteilung") { 

    if (hasPersonnelAccess()) { 

      loadEmployees(); 

    } else { 

      dashboardPanel.append( 

        createElement("p", "Du hast keinen Zugriff auf diesen Bereich.") 

      ); 

    } 

  } else { 

    dashboardPanel.append( 

      createElement("p", "Dieser Bereich wird als Nächstes ausgebaut.") 

    ); 

  } 

 

  const backButton = createElement( 

    "button", 

    "Zurück zum Dashboard", 

    "button" 

  ); 

 

  backButton.type = "button"; 

  backButton.addEventListener("click", showDashboard); 

 

  dashboardPanel.append(backButton); 

} 

 

/* ========================================== 

   MITARBEITERVERWALTUNG 

========================================== */ 

 

async function loadEmployees() { 

  if (!dashboardPanel) return; 

 

  dashboardPanel.append( 

    createElement("p", "Mitarbeiter werden geladen ...") 

  ); 

 

  if (!hasPersonnelAccess()) { 

    dashboardPanel.append( 

      createElement("p", "Für diese Übersicht fehlen deine Berechtigungen.") 

    ); 

    return; 

  } 

 

  const { data, error } = await db 

    .from("profiles") 

    .select("id, display_name, username, role, created_at") 

    .order("display_name", { ascending: true }); 

 

  // Ladehinweis entfernen 

  const loadingText = Array.from(dashboardPanel.children).find( 

    element => element.textContent === "Mitarbeiter werden geladen ..." 

  ); 

 

  if (loadingText) loadingText.remove(); 

 

  if (error) { 

    console.error("Mitarbeiter konnten nicht geladen werden:", error); 

 

    dashboardPanel.append( 

      createElement( 

        "p", 

        "Die Mitarbeiterliste konnte nicht geladen werden. Bitte die Supabase-RLS-Berechtigungen für profiles prüfen." 

      ) 

    ); 

    return; 

  } 

 

  if (!data || data.length === 0) { 

    dashboardPanel.append( 

      createElement("p", "Es wurden noch keine Mitarbeiter gefunden.") 

    ); 

    return; 

  } 

 

  const search = document.createElement("input"); 

  search.type = "search"; 

  search.placeholder = "Mitarbeiter suchen ..."; 

  search.setAttribute("aria-label", "Mitarbeiter suchen"); 

  search.style.margin = "20px 0"; 

 

  const employeeList = createElement("div", undefined, "cards"); 

 

  function renderEmployees(searchTerm = "") { 

    employeeList.replaceChildren(); 

 

    const filtered = data.filter(employee => { 

      const searchable = [ 

        employee.display_name, 

        employee.username, 

        employee.role 

      ].join(" ").toLowerCase(); 

 

      return searchable.includes(searchTerm.toLowerCase()); 

    }); 

 

    if (filtered.length === 0) { 

      employeeList.append( 

        createElement("p", "Keine passenden Mitarbeiter gefunden.") 

      ); 

      return; 

    } 

 

    filtered.forEach(employee => { 

      const card = createElement("article", undefined, "card"); 

 

      card.append( 

        createElement( 

          "h3", 

          employee.display_name || employee.username || "Unbekannt" 

        ), 

        createElement("p", "Benutzername: " + (employee.username || "-")), 

        createElement("p", "Rolle: " + (employee.role || "member")) 

      ); 

 

      const openButton = createElement("button", "Profil öffnen", "button"); 

      openButton.type = "button"; 

 

      openButton.addEventListener("click", () => { 

        openEmployeeProfile(employee); 

      }); 

 

      card.append(openButton); 

      employeeList.append(card); 

    }); 

  } 

 

  search.addEventListener("input", () => { 

    renderEmployees(search.value); 

  }); 

 

  renderEmployees(); 

 

  dashboardPanel.append( 

    createElement("h3", "Mitarbeiterübersicht"), 

    createElement("p", "Gefundene Mitarbeiter: " + data.length), 

    search, 

    employeeList 

  ); 

} 

 

/* ========================================== 

   MITARBEITERPROFIL 

========================================== */ 

 

function openEmployeeProfile(employee) { 

  dashboardPanel.replaceChildren(); 

 

  const name = 

    employee.display_name || employee.username || "Unbekannt"; 

 

  dashboardPanel.append( 

    createElement("h2", name), 

    createElement("p", "Benutzername: " + (employee.username || "-")), 

    createElement("p", "Rolle: " + (employee.role || "member")), 

    createElement( 

      "p", 

      "Registriert: " + 

        (employee.created_at 

          ? new Date(employee.created_at).toLocaleDateString("de-DE") 

          : "-") 

    ) 

  ); 

 

  dashboardPanel.append( 

    createElement( 

      "p", 

      "Weitere Personal- und Dienstgraddaten werden ergänzt, sobald die entsprechenden Datenbankfelder vorhanden sind." 

    ) 

  ); 

 

  const backButton = createElement("button", "Zurück zur Mitarbeiterliste", "button"); 

  backButton.type = "button"; 

 

  backButton.addEventListener("click", () => { 

    dashboardPanel.replaceChildren( 

      createElement("h2", "Personalverwaltung") 

    ); 

    loadEmployees(); 

  }); 

 

  dashboardPanel.append(backButton); 

} 

 

/* ========================================== 

   AKTENREGISTER 

========================================== */ 

 

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

    container.textContent = "Akten konnten nicht geladen werden."; 

    return; 

  } 

 

  if (!data || data.length === 0) { 

    container.textContent = "Noch keine Akten vorhanden."; 

    return; 

  } 

 

  const table = document.createElement("table"); 

  table.style.width = "100%"; 

  table.style.borderCollapse = "collapse"; 

 

  const header = document.createElement("tr"); 

 

  [ 

    "Aktennummer", 

    "Kategorie", 

    "Betreff", 

    "Status", 

    "Erstellt am" 

  ].forEach(label => { 

    const cell = createElement("th", label); 

    cell.style.padding = "10px"; 

    cell.style.textAlign = "left"; 

    header.append(cell); 

  }); 

 

  table.append(header); 

 

  data.forEach(akte => { 

    const row = document.createElement("tr"); 

 

    [ 

      akte.aktennummer, 

      akte.kategorie, 

      akte.betreff, 

      akte.status, 

      akte.erstellt_am 

        ? new Date(akte.erstellt_am).toLocaleDateString("de-DE") 

        : "-" 

    ].forEach(value => { 

      const cell = createElement("td", value ?? "-"); 

      cell.style.padding = "10px"; 

      cell.style.borderTop = "1px solid #30383f"; 

      row.append(cell); 

    }); 

 

    table.append(row); 

  }); 

 

  container.replaceChildren(table); 

} 

 

/* ========================================== 

   SITZUNG VERARBEITEN 

========================================== */ 

 

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

 

  const heading = document.querySelector(".dashboard-header h2"); 

 

  if (heading) { 

    const name = 

      currentProfile?.display_name || 

      currentProfile?.username || 

      currentUser.email; 

 

    heading.textContent = "Willkommen, " + name; 

  } 

 

  await loadAkten(); 

} 

 

/* ========================================== 

   LOGIN 

========================================== */ 

 

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

      showMessage("Anmeldung fehlgeschlagen: " + error.message, true); 

      return; 

    } 

 

    await syncSession(data.session); 

    showMessage("Erfolgreich angemeldet."); 

  }); 

} 

 

/* ========================================== 

   ABMELDEN 

========================================== */ 

 

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

 

/* ========================================== 

   START 

========================================== */ 

 

async function startWebsite() { 

  setupDashboard(); 

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

 

console.log("Feldjäger Ultimate Maxplus gestar 
