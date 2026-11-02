// ========================================== 

// FELDJÄGER WEBSITE – SCRIPT.JS 

// Divi-Leitung: NELE 

// ========================================== 

 

// SUPABASE EINSTELLUNGEN 

const SUPABASE_URL = "https://vpxgjzbptfnsrzrnxndo.supabase.co"; 

const SUPABASE_ANON_KEY = "sb_publishable_bo68zX2qVANCUemJOD977Q_I_2dSNF-"; 

 

// Verbindung zur Datenbank 

const db = window.supabase.createClient( 

    SUPABASE_URL, 

    SUPABASE_ANON_KEY 

); 

 

// HTML Elemente 

const loginForm = document.getElementById("loginForm"); 

const emailInput = document.getElementById("email"); 

const passwordInput = document.getElementById("password"); 

const authMessage = document.getElementById("authMessage"); 

const caseApp = document.getElementById("caseApp"); 

const logoutBtn = document.getElementById("logoutBtn"); 

const caseRows = document.getElementById("caseRows"); 

 

// ========================================== 

// ANMELDUNG 

// ========================================== 

 

if (loginForm) { 

    loginForm.addEventListener("submit", async (event) => { 

        event.preventDefault(); 

 

        authMessage.textContent = "Anmeldung läuft..."; 

 

        const { data, error } = await db.auth.signInWithPassword({ 

            email: emailInput.value.trim(), 

            password: passwordInput.value 

        }); 

 

        if (error) { 

            authMessage.textContent = 

                "Anmeldung fehlgeschlagen: " + error.message; 

            return; 

        } 

 

        authMessage.textContent = "Erfolgreich angemeldet!"; 

        await checkSession(); 

    }); 

} 

 

// ========================================== 

// SITZUNG ÜBERPRÜFEN 

// ========================================== 

 

async function checkSession() { 

    const { data, error } = await db.auth.getSession(); 

 

    if (error) { 

        console.error(error); 

        return; 

    } 

 

    const session = data.session; 

 

    if (session) { 

        if (caseApp) caseApp.style.display = "block"; 

        if (loginForm) loginForm.style.display = "none"; 

 

        await loadCases(); 

    } else { 

        if (caseApp) caseApp.style.display = "none"; 

        if (loginForm) loginForm.style.display = "block"; 

    } 

} 

 

// ========================================== 

// ABMELDUNG 

// ========================================== 

 

if (logoutBtn) { 

    logoutBtn.addEventListener("click", async () => { 

        const { error } = await db.auth.signOut(); 

 

        if (error) { 

            alert("Abmeldung fehlgeschlagen."); 

            return; 

        } 

 

        await checkSession(); 

    }); 

} 

 

// ========================================== 

// AKTENVERWALTUNG 

// ========================================== 

 

async function loadCases() { 

    if (!caseRows) return; 

 

    caseRows.innerHTML = "<tr><td colspan='5'>Akten werden geladen...</td></tr>"; 

 

    const { data, error } = await db 

        .from("akten") 

        .select("*") 

        .order("created_at", { ascending: false }); 

 

    if (error) { 

        console.error("Aktenfehler:", error); 

        caseRows.innerHTML = 

            "<tr><td colspan='5'>Akten konnten nicht geladen werden.</td></tr>"; 

        return; 

    } 

 

    if (!data || data.length === 0) { 

        caseRows.innerHTML = 

            "<tr><td colspan='5'>Noch keine Akten vorhanden.</td></tr>"; 

        return; 

    } 

 

    caseRows.innerHTML = data.map((akte) => ` 

        <tr> 

            <td>${escapeHTML(akte.aktennummer)}</td> 

            <td>${escapeHTML(akte.kategorie)}</td> 

            <td>${escapeHTML(akte.datum)}</td> 

            <td>${escapeHTML(akte.betreff)}</td> 

            <td>${escapeHTML(akte.status)}</td> 

        </tr> 

    `).join(""); 

} 

 

// ========================================== 

// SICHERE TEXTAUSGABE 

// ========================================== 

 

function escapeHTML(value) { 

    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ 

        "&": "&amp;", 

        "<": "&lt;", 

        ">": "&gt;", 

        '"': "&quot;", 

        "'": "&#039;" 

    })[char]); 

} 

 

// ========================================== 

// AUTOMATISCHE SITZUNGSKONTROLLE 

// ========================================== 

 

db.auth.onAuthStateChange((event, session) => { 

    if (event === "SIGNED_OUT") { 

        checkSession(); 

    } 

 

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") { 

        checkSession(); 

    } 

}); 

 

// ========================================== 

// WEBSITE STARTEN 

// ========================================== 

 

checkSession(); 

 

console.log("Feldjäger-Website erfolgreich gestartet."); 

console.log("Divi-Leitung: NELE"); 
