/* ===================================================== 

   FELDJÄGER ULTIMATE MAXPLUS 

   Hauptsystem – Anmeldung, Dashboard und Module 

===================================================== */ 

 

const SUPABASE_URL = "https://vpxgjzbptfnsrzrnxndo.supabase.co"; 

const SUPABASE_KEY = "sb_publishable_bo68zX2qVANCUemJOD977Q_I_2dSNF-"; 

 

const db = window.supabase.createClient( 

  SUPABASE_URL, 

  SUPABASE_KEY 

); 

 

let currentUser = null; 

let currentProfile = null; 

let currentView = "overview"; 

 

/* ===================================================== 

   HILFSFUNKTIONEN 

===================================================== */ 

 

const $ = (id) => document.getElementById(id); 

 

function escapeHTML(value) { 

  return String(value ?? "").replace(/[&<>"']/g, char => ({ 

    "&": "&amp;", 

    "<": "&lt;", 

    ">": "&gt;", 

    '"': "&quot;", 

    "'": "&#039;" 

  })[char]); 

} 

 

function roleName(role) { 

  const roles = { 

    admin: "Divisionsleitung", 

    deputy: "Stellvertretung", 

    personalabteilung: "Personalabteilung", 

    gruppenfuehrer: "Gruppenführer", 

    streifenfuehrer: "Streifenführer", 

    member: "Mitglied" 

  }; 

 

  return roles[role] || role || "Mitglied"; 

} 

 

function isLeadership() { 

  return ["admin", "deputy"].includes(currentProfile?.role); 

} 

 

function canManagePersonnel() { 

  return [ 

    "admin", 

    "deputy", 

    "personalabteilung" 

  ].includes(currentProfile?.role); 

} 

 

function canViewPersonnelFiles() { 

  return canManagePersonnel(); 

} 

 

function showMessage(message, error = false) { 

  const box = $("authMessage"); 

 

  if (!box) return; 

 

  box.textContent = message; 

  box.style.color = error ? "#ff7777" : "#f28c28"; 

} 

 

function setContent(title, html) { 

  if ($("viewTitle")) $("viewTitle").textContent = title; 

  if ($("viewContent")) $("viewContent").innerHTML = html; 

} 

 

function formatDate(value) { 

  if (!value) return "–"; 

 

  return new Date(value).toLocaleDateString("de-DE"); 

} 

 

/* ===================================================== 

   ANMELDUNG 

===================================================== */ 

 

async function login(event) { 

  event.preventDefault(); 

 

  const email = $("email")?.value.trim(); 

  const password = $("password")?.value; 

 

  if (!email || !password) { 

    showMessage("Bitte E-Mail und Passwort eingeben.", true); 

    return; 

  } 

 

  const button = $("loginButton"); 

 

  if (button) { 

    button.disabled = true; 

    button.textContent = "Anmeldung läuft …"; 

  } 

 

  const { data, error } = await db.auth.signInWithPassword({ 

    email, 

    password 

  }); 

 

  if (button) { 

    button.disabled = false; 

    button.textContent = "Anmelden"; 

  } 

 

  if (error) { 

    showMessage("Anmeldung fehlgeschlagen: " + error.message, true); 

    return; 

  } 

 

  await syncSession(data.session); 

} 

 

async function logout() { 

  await db.auth.signOut(); 

 

  currentUser = null; 

  currentProfile = null; 

 

  showLogin(); 

} 

 

function showLogin() { 

  if ($("loginBox")) $("loginBox").style.display = "block"; 

  if ($("caseApp")) $("caseApp").style.display = "none"; 

} 

 

function showDashboard() { 

  if ($("loginBox")) $("loginBox").style.display = "none"; 

  if ($("caseApp")) $("caseApp").style.display = "block"; 

} 

 

/* ===================================================== 

   BENUTZERPROFIL UND SITZUNG 

===================================================== */ 

 

async function syncSession(session) { 

  if (!session?.user) { 

    showLogin(); 

    return; 

  } 

 

  currentUser = session.user; 

 

  const { data: profile, error } = await db 

    .from("profiles") 

    .select("*") 

    .eq("id", currentUser.id) 

    .single(); 

 

  if (error || !profile) { 

    showMessage( 

      "Dein Benutzerprofil wurde nicht gefunden. Bitte die Leitung informieren.", 

      true 

    ); 

 

    await db.auth.signOut(); 

    showLogin(); 

    return; 

  } 

 

  currentProfile = profile; 

 

  showDashboard(); 

 

  const displayName = 

    profile.display_name || 

    profile.username || 

    currentUser.email; 

 

  if ($("currentUserName")) { 

    $("currentUserName").textContent = displayName; 

  } 

 

  if ($("currentUserRole")) { 

    $("currentUserRole").textContent = roleName(profile.role); 

  } 

 

  if ($("userAvatar")) { 

    $("userAvatar").textContent = 

      displayName.charAt(0).toUpperCase(); 

  } 

 

  await loadView("overview"); 

} 

 

/* ===================================================== 

   NAVIGATION 

===================================================== */ 

 

const views = { 

  overview: "Dashboard", 

  personnel: "Personalverwaltung", 

  promotions: "Beförderungen", 

  evaluations: "Bewertungen", 

  approvals: "Genehmigungen", 

  messages: "Nachrichtensystem", 

  calendar: "Dienstkalender", 

  tasks: "Aufgaben und Erinnerungen", 

  files: "Personalakten", 

  archive: "Digitales Archiv", 

  org: "Organigramm", 

  audit: "Änderungsprotokoll", 

  accounts: "Benutzerverwaltung" 

}; 

 

async function loadView(view) { 

  currentView = view; 

 

  document.querySelectorAll("[data-view]").forEach(button => { 

    button.classList.toggle( 

      "active", 

      button.dataset.view === view 

    ); 

  }); 

 

  switch (view) { 

    case "overview": 

      return renderOverview(); 

 

    case "personnel": 

      return renderPersonnel(); 

 

    case "promotions": 

      return renderPromotions(); 

 

    case "evaluations": 

      return renderEvaluations(); 

 

    case "approvals": 

      return renderApprovals(); 

 

    case "messages": 

      return renderMessages(); 

 

    case "calendar": 

      return renderCalendar(); 

 

    case "tasks": 

      return renderTasks(); 

 

    case "files": 

      return renderFiles(); 

 

    case "archive": 

      return renderArchive(); 

 

    case "org": 

      return renderOrganisation(); 

 

    case "audit": 

      return renderAudit(); 

 

    case "accounts": 

      return renderAccounts(); 

 

    default: 

      return renderOverview(); 

  } 

} 

 

/* ===================================================== 

   DASHBOARD 

===================================================== */ 

 

async function renderOverview() { 

  setContent("Führungsübersicht", ` 

    <div class="welcome-panel"> 

      <h2>Willkommen, ${escapeHTML( 

        currentProfile.display_name || "Nele" 

      )}!</h2> 

      <p>Feldjäger Ultimate Maxplus – interner Führungsbereich.</p> 

    </div> 

 

    <div class="dashboard-grid"> 

      ${Object.entries(views).filter(([key]) => key !== "overview") 

        .map(([key, title]) => ` 

          <button class="module-card" data-open-view="${key}"> 

            <h3>${escapeHTML(title)}</h3> 

            <span>Bereich öffnen →</span> 

          </button> 

        `).join("")} 

    </div> 

  `); 

 

  document.querySelectorAll("[data-open-view]").forEach(button => { 

    button.addEventListener("click", () => { 

      loadView(button.dataset.openView); 

    }); 

  }); 

} 

 

/* ===================================================== 

   PERSONALVERWALTUNG 

===================================================== */ 

 

async function renderPersonnel() { 

  if (!canManagePersonnel()) { 

    setContent("Personalverwaltung", ` 

      <p>Du hast keinen Zugriff auf diesen Bereich.</p> 

    `); 

    return; 

  } 

 

  setContent("Personalverwaltung", "<p>Personal wird geladen …</p>"); 

 

  const { data, error } = await db 

    .from("profiles") 

    .select("*") 

    .order("display_name"); 

 

  if (error) { 

    setContent("Personalverwaltung", ` 

      <p>Fehler beim Laden: ${escapeHTML(error.message)}</p> 

    `); 

    return; 

  } 

 

  setContent("Personalverwaltung", ` 

    <div class="section-heading"> 

      <div> 

        <h2>Personalübersicht</h2> 

        <p>Mitglieder und interne Benutzerkonten.</p> 

      </div> 

      <span>${data.length} Personen</span> 

    </div> 

 

    <div class="table-wrap"> 

      <table> 

        <thead> 

          <tr> 

            <th>Name</th> 

            <th>Benutzername</th> 

            <th>Rolle</th> 

          </tr> 

        </thead> 

        <tbody> 

          ${data.map(person => ` 

            <tr> 

              <td>${escapeHTML(person.display_name || "Unbekannt")}</td> 

              <td>${escapeHTML(person.username || "–")}</td> 

              <td>${escapeHTML(roleName(person.role))}</td> 

            </tr> 

          `).join("")} 

        </tbody> 

      </table> 

    </div> 

  `); 

} 

 

/* ===================================================== 

   BEFÖRDERUNGEN 

===================================================== */ 

 

async function renderPromotions() { 

  setContent("Beförderungssystem", ` 

    <div class="module-intro"> 

      <h2>Beförderungsvorschläge</h2> 

      <p>Vorschläge vorbereiten und zur Entscheidung vorlegen.</p> 

    </div> 

 

    <form id="promotionForm" class="system-form"> 

      <label>Name des Mitglieds</label> 

      <input name="member_name" required> 

 

      <label>Aktueller Dienstgrad</label> 

      <input name="current_rank" required> 

 

      <label>Vorgeschlagener Dienstgrad</label> 

      <input name="proposed_rank" required> 

 

      <label>Begründung</label> 

      <textarea name="reason" required></textarea> 

 

      <button type="submit">Vorschlag einreichen</button> 

    </form> 

 

    <div id="promotionResult"></div> 

  `); 

 

  $("promotionForm").addEventListener("submit", async event => { 

    event.preventDefault(); 

 

    const form = new FormData(event.target); 

 

    const { error } = await db.from("promotions").insert({ 

      member_name: form.get("member_name"), 

      current_rank: form.get("current_rank"), 

      proposed_rank: form.get("proposed_rank"), 

      reason: form.get("reason"), 

      status: "Offen", 

      created_by: currentUser.id 

    }); 

 

    if (error) { 

      $("promotionResult").textContent = 

        "Fehler: " + error.message; 

      return; 

    } 

 

    $("promotionResult").textContent = 

      "Beförderungsvorschlag wurde eingereicht."; 

 

    event.target.reset(); 

  }); 

} 

 

/* ===================================================== 

   BEWERTUNGEN 

===================================================== */ 

 

async function renderEvaluations() { 

  const allowed = [ 

    "admin", 

    "deputy", 

    "personalabteilung", 

    "gruppenfuehrer", 

    "streifenfuehrer" 

  ]; 

 

  if (!allowed.includes(currentProfile.role)) { 

    setContent("Bewertungen", "<p>Kein Zugriff auf diesen Bereich.</p>"); 

    return; 

  } 

 

  setContent("Mitarbeiterbewertungen", ` 

    <h2>Neue Bewertung erstellen</h2> 

 

    <form id="evaluationForm" class="system-form"> 

      <label>Name des Mitglieds</label> 

      <input name="member_name" required> 

 

      <label>Bewertung</label> 

      <select name="rating" required> 

        <option value="">Bitte auswählen</option> 

        <option value="Sehr gut">Sehr gut</option> 

        <option value="Gut">Gut</option> 

        <option value="Ausreichend">Ausreichend</option> 

        <option value="Verbesserungsbedarf">Verbesserungsbedarf</option> 

      </select> 

 

      <label>Bemerkungen</label> 

      <textarea name="notes" required></textarea> 

 

      <button type="submit">Bewertung speichern</button> 

    </form> 

 

    <div id="evaluationResult"></div> 

  `); 

 

  $("evaluationForm").addEventListener("submit", async event => { 

    event.preventDefault(); 

 

    const form = new FormData(event.target); 

 

    const { error } = await db.from("evaluations").insert({ 

      member_name: form.get("member_name"), 

      rating: form.get("rating"), 

      notes: form.get("notes"), 

      created_by: currentUser.id 

    }); 

 

    $("evaluationResult").textContent = error 

      ? "Fehler: " + error.message 

      : "Bewertung wurde gespeichert."; 

 

    if (!error) event.target.reset(); 

  }); 

} 

 

/* ===================================================== 

   GENEHMIGUNGEN 

===================================================== */ 

 

async function renderApprovals() { 

  if (!isLeadership()) { 

    setContent("Genehmigungen", ` 

      <p>Die endgültige Genehmigung ist ausschließlich der Divisionsleitung und Stellvertretung vorbehalten.</p> 

    `); 

    return; 

  } 

 

  setContent("Genehmigungen", ` 

    <h2>Offene Entscheidungen</h2> 

    <p>Hier werden eingereichte Vorschläge und Anträge bearbeitet.</p> 

    <div id="approvalList">Genehmigungen werden geladen …</div> 

  `); 

 

  const { data, error } = await db 

    .from("promotions") 

    .select("*") 

    .eq("status", "Offen") 

    .order("created_at", { ascending: false }); 

 

  if (error) { 

    $("approvalList").textContent = error.message; 

    return; 

  } 

 

  $("approvalList").innerHTML = data.length 

    ? data.map(item => ` 

      <article class="record-card"> 

        <h3>${escapeHTML(item.member_name)}</h3> 

        <p>${escapeHTML(item.current_rank || "")} 

        → ${escapeHTML(item.proposed_rank || "")}</p> 

        <p>${escapeHTML(item.reason || "")}</p> 

        <button data-approve="${item.id}">Genehmigen</button> 

        <button data-reject="${item.id}">Ablehnen</button> 

      </article> 

    `).join("") 

    : "<p>Keine offenen Vorschläge.</p>"; 

 

  document.querySelectorAll("[data-approve]").forEach(button => { 

    button.addEventListener("click", () => 

      decidePromotion(button.dataset.approve, "Genehmigt") 

    ); 

  }); 

 

  document.querySelectorAll("[data-reject]").forEach(button => { 

    button.addEventListener("click", () => 

      decidePromotion(button.dataset.reject, "Abgelehnt") 

    ); 

  }); 

} 

 

async function decidePromotion(id, status) { 

  const { error } = await db 

    .from("promotions") 

    .update({ status }) 

    .eq("id", id); 

 

  if (error) { 

    alert("Fehler: " + error.message); 

    return; 

  } 

 

  await renderApprovals(); 

} 

 

/* ===================================================== 

   NACHRICHTENSYSTEM 

===================================================== */ 

 

async function renderMessages() { 

  setContent("Nachrichtensystem", ` 

    <h2>Interne Nachrichten</h2> 

 

    <form id="messageForm" class="system-form"> 

      <label>Betreff</label> 

      <input name="subject" required> 

 

      <label>Nachricht</label> 

      <textarea name="message" required></textarea> 

 

      <button type="submit">Nachricht veröffentlichen</button> 

    </form> 

 

    <div id="messageList">Nachrichten werden geladen …</div> 

  `); 

 

  const { data, error } = await db 

    .from("messages") 

    .select("*") 

    .order("created_at", { ascending: false }); 

 

  if (error) { 

    $("messageList").textContent = error.message; 

  } else { 

    $("messageList").innerHTML = data.map(message => ` 

      <article class="record-card"> 

        <h3>${escapeHTML(message.subject)}</h3> 

        <p>${escapeHTML(message.message)}</p> 

        <small>${formatDate(message.created_at)}</small> 

      </article> 

    `).join("") || "<p>Noch keine Nachrichten.</p>"; 

  } 

 

  $("messageForm").addEventListener("submit", async event => { 

    event.preventDefault(); 

 

    const form = new FormData(event.target); 

 

    const { error } = await db.from("messages").insert({ 

      subject: form.get("subject"), 

      message: form.get("message"), 

      created_by: currentUser.id 

    }); 

 

    if (error) { 

      alert("Fehler: " + error.message); 

      return; 

    } 

 

    await renderMessages(); 

  }); 

} 

 

/* ===================================================== 

   KALENDER 

===================================================== */ 

 

async function renderCalendar() { 

  setContent("Dienstkalender", ` 

    <h2>Termine und Dienste</h2> 

 

    <form id="calendarForm" class="system-form"> 

      <label>Termin</label> 

      <input name="title" required> 

 

      <label>Datum</label> 

      <input type="date" name="event_date" required> 

 

      <label>Beschreibung</label> 

      <textarea name="description"></textarea> 

 

      <button type="submit">Termin eintragen</button> 

    </form> 

 

    <div id="calendarList">Termine werden geladen …</div> 

  `); 

 

  const { data, error } = await db 

    .from("calendar_events") 

    .select("*") 

    .order("event_date"); 

 

  if (error) { 

    $("calendarList").textContent = error.message; 

  } else { 

    $("calendarList").innerHTML = data.map(item => ` 

      <article class="record-card"> 

        <h3>${escapeHTML(item.title)}</h3> 

        <p>${formatDate(item.event_date)}</p> 

        <p>${escapeHTML(item.description || "")}</p> 

      </article> 

    `).join("") || "<p>Keine Termine eingetragen.</p>"; 

  } 

 

  $("calendarForm").addEventListener("submit", async event => { 

    event.preventDefault(); 

 

    const form = new FormData(event.target); 

 

    const { error } = await db.from("calendar_events").insert({ 

      title: form.get("title"), 

      event_date: form.get("event_date"), 

      description: form.get("description"), 

      created_by: currentUser.id 

    }); 

 

    if (error) { 

      alert(error.message); 

      return; 

    } 

 

    await renderCalendar(); 

  }); 

} 

 

/* ===================================================== 

   AUFGABEN 

===================================================== */ 

 

async function renderTasks() { 

  setContent("Aufgaben und Erinnerungen", ` 

    <h2>Aufgabenverwaltung</h2> 

 

    <form id="taskForm" class="system-form"> 

      <label>Aufgabe</label> 

      <input name="title" required> 

 

      <label>Frist</label> 

      <input type="date" name="due_date"> 

 

      <label>Beschreibung</label> 

      <textarea name="description"></textarea> 

 

      <button type="submit">Aufgabe erstellen</button> 

    </form> 

 

    <div id="taskList">Aufgaben werden geladen …</div> 

  `); 

 

  const { data, error } = await db 

    .from("tasks") 

    .select("*") 

    .order("created_at", { ascending: false }); 

 

  if (error) { 

    $("taskList").textContent = error.message; 

  } else { 

    $("taskList").innerHTML = data.map(task => ` 

      <article class="record-card"> 

        <h3>${escapeHTML(task.title)}</h3> 

        <p>${escapeHTML(task.description || "")}</p> 

        <p>Frist: ${formatDate(task.due_date)}</p> 

        <p>Status: ${escapeHTML(task.status || "Offen")}</p> 

      </article> 

    `).join("") || "<p>Keine Aufgaben vorhanden.</p>"; 

  } 

 

  $("taskForm").addEventListener("submit", async event => { 

    event.preventDefault(); 

 

    const form = new FormData(event.target); 

 

    const { error } = await db.from("tasks").insert({ 

      title: form.get("title"), 

      due_date: form.get("due_date") || null, 

      description: form.get("description"), 

      status: "Offen", 

      created_by: currentUser.id 

    }); 

 

    if (error) { 

      alert(error.message); 

      return; 

    } 

 

    await renderTasks(); 

  }); 

} 

 

/* ===================================================== 

   PERSONALAKTEN 

===================================================== */ 

 

async function renderFiles() { 

  if (!canViewPersonnelFiles()) { 

    setContent("Personalakten", ` 

      <p>Der Zugriff auf vollständige Personalakten ist auf die Personalabteilung, Nele und Luca beschränkt.</p> 

    `); 

    return; 

  } 

 

  setContent("Personalakten", ` 

    <h2>Digitale Personalakten</h2> 

 

    <form id="fileForm" class="system-form"> 

      <label>Aktennummer</label> 

      <input name="aktennummer" required> 

 

      <label>Kategorie</label> 

      <select name="kategorie" required> 

        <option value="Vorfall">Vorfall</option> 

        <option value="Beschwerde">Beschwerde</option> 

        <option value="Abwesenheit">Abwesenheit</option> 

        <option value="Dienstnachweis">Dienstnachweis</option> 

        <option value="Sonstiges">Sonstiges</option> 

      </select> 

 

      <label>Betreff</label> 

      <input name="betreff" required> 

 

      <label>Beschreibung</label> 

      <textarea name="beschreibung" required></textarea> 

 

      <button type="submit">Akte erstellen</button> 

    </form> 

 

    <div id="fileList">Akten werden geladen …</div> 

  `); 

 

  const { data, error } = await db 

    .from("akten") 

    .select("*") 

    .order("erstellt_am", { ascending: false }); 

 

  if (error) { 

    $("fileList").textContent = error.message; 

  } else { 

    $("fileList").innerHTML = data.map(file => ` 

      <article class="record-card"> 

        <h3>${escapeHTML(file.aktennummer)} – ${escapeHTML(file.betreff)}</h3> 

        <p>${escapeHTML(file.kategorie)} · ${escapeHTML(file.status)}</p> 

        <p>${escapeHTML(file.beschreibung)}</p> 

        <small>${formatDate(file.erstellt_am)}</small> 

      </article> 

    `).join("") || "<p>Noch keine Akten vorhanden.</p>"; 

  } 

 

  $("fileForm").addEventListener("submit", async event => { 

    event.preventDefault(); 

 

    const form = new FormData(event.target); 

 

    const { error } = await db.from("akten").insert({ 

      aktennummer: form.get("aktennummer"), 

      kategorie: form.get("kategorie"), 

      betreff: form.get("betreff"), 

      beschreibung: form.get("beschreibung"), 

      status: "Offen", 

      erstellt_von: currentUser.id 

    }); 

 

    if (error) { 

      alert("Fehler: " + error.message); 

      return; 

    } 

 

    await renderFiles(); 

  }); 

} 

 

/* ===================================================== 

   DIGITALES ARCHIV 

===================================================== */ 

 

async function renderArchive() { 

  setContent("Digitales Archiv", ` 

    <h2>Archivübersicht</h2> 

    <p>Das Aktenregister enthält die angelegten Vorgänge.</p> 

    <button id="openFiles">Aktenregister öffnen</button> 

    <div id="archiveInfo"></div> 

  `); 

 

  $("openFiles").addEventListener("click", () => loadView("files")); 

} 

 

/* ===================================================== 

   ORGANIGRAMM 

===================================================== */ 

 

async function renderOrganisation() { 

  setContent("Digitales Organigramm", ` 

    <div class="org-chart"> 

      <article class="org-card"> 

        <h3>Divisionsleitung</h3> 

        <p>Nele</p> 

      </article> 

 

      <div class="org-line"></div> 

 

      <article class="org-card"> 

        <h3>Stellvertretung</h3> 

        <p>Luca</p> 

      </article> 

 

      <div class="org-line"></div> 

 

      <article class="org-card"> 

        <h3>Gruppenführung</h3> 

        <p>TRX</p> 

      </article> 

 

      <div class="org-line"></div> 

 

      <article class="org-card"> 

        <h3>Personalabteilung</h3> 

        <p>Interner Verwaltungsbereich</p> 

      </article> 

    </div> 

  `); 

} 

 

/* ===================================================== 

   ÄNDERUNGSPROTOKOLL 

===================================================== */ 

 

async function renderAudit() { 

  if (!canManagePersonnel()) { 

    setContent("Änderungsprotokoll", "<p>Kein Zugriff.</p>"); 

    return; 

  } 

 

  setContent("Änderungsprotokoll", ` 

    <h2>Systemprotokoll</h2> 

    <p>Das Protokoll wird nach Einrichtung der Datenbanktabelle angezeigt.</p> 

  `); 

} 

 

/* ===================================================== 

   BENUTZERVERWALTUNG 

===================================================== */ 

 

async function renderAccounts() { 

  if (!canManagePersonnel()) { 

    setContent("Benutzerverwaltung", "<p>Kein Zugriff.</p>"); 

    return; 

  } 

 

  const { data, error } = await db 

    .from("profiles") 

    .select("*") 

    .order("display_name"); 

 

  if (error) { 

    setContent("Benutzerverwaltung", ` 

      <p>${escapeHTML(error.message)}</p> 

    `); 

    return; 

  } 

 

  setContent("Benutzerverwaltung", ` 

    <h2>Benutzerkonten</h2> 

    <p>Rollen und Berechtigungen der vorhandenen Profile.</p> 

 

    <div class="table-wrap"> 

      <table> 

        <thead> 

          <tr> 

            <th>Name</th> 

            <th>Rolle</th> 

          </tr> 

        </thead> 

        <tbody> 

          ${data.map(person => ` 

            <tr> 

              <td>${escapeHTML(person.display_name || person.username || "–")}</td> 

              <td>${escapeHTML(roleName(person.role))}</td> 

            </tr> 

          `).join("")} 

        </tbody> 

      </table> 

    </div> 

  `); 

} 

 

/* ===================================================== 

   START UND EVENT LISTENER 

===================================================== */ 

 

function setupDashboard() { 

  document.querySelectorAll("[data-view]").forEach(button => { 

    button.addEventListener("click", () => { 

      loadView(button.dataset.view); 

    }); 

  }); 

 

  if ($("logoutBtn")) { 

    $("logoutBtn").addEventListener("click", logout); 

  } 

 

  if ($("loginForm")) { 

    $("loginForm").addEventListener("submit", login); 

  } 

} 

 

async function startWebsite() { 

  setupDashboard(); 

 

  showLogin(); 

 

  const { data, error } = await db.auth.getSession(); 

 

  if (error) { 

    showMessage("Sitzungsfehler: " + error.message, true); 

    return; 

  } 

 

  if (data.session) { 

    await syncSession(data.session); 

  } 

} 

 

db.auth.onAuthStateChange((_event, session) => { 

  if (!session) { 

    currentUser = null; 

    currentProfile = null; 

    showLogin(); 

  } 

}); 

 

startWebsite(); 
