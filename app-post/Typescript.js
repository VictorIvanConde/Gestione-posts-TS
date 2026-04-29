// V.I.C. --> esercizio fetch post 22-04-2026
"use strict";
// Selezione elementi del DOM con tipizzazione specifica
const filtroUtente = document.getElementById("filtroUtente");
const perPagina = document.getElementById("perPagina");
const messaggio = document.getElementById("messaggio");
const listaPost = document.getElementById("listaPost");
const dettaglioPost = document.getElementById("dettaglioPost");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const paginaCorrente = document.getElementById("paginaCorrente");
const barraRicerca = document.getElementById("barraRicerca");
const cercaBtn = document.getElementById("cercaBtn");
const riprovaCentroBtn = document.getElementById("riprovaCentroBtn");
// Variabili di stato dell'applicazione
let tuttiPost = [];
let tuttiUtenti = [];
let pagina = 1;
let testoRicercaAttuale = "";
let ultimiRisultatiRicerca = null;
let ricercaInCorso = false;
let idPostAperto = null;
// Funzione generica per le chiamate API
async function api(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Errore nella richiesta");
    }
    return res.json();
}
// Funzione di attesa per simulazioni
function attendi(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/** Evidenzia */
function evidenziaTesto(testo, query) {
    if (!testo)
        return "";
    if (!query || !query.trim())
        return testo;
    const queryProtetta = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parole = queryProtetta.trim().split(/\s+/).filter((p) => p.length > 0);
    let testoRisultante = testo;
    parole.forEach((parola) => {
        const regex = new RegExp(`(${parola})`, "gi");
        testoRisultante = testoRisultante.replace(regex, '<span class="highlight">$1</span>');
    });
    return testoRisultante;
}
// Avvio dell'applicazione
async function caricaDatiIniziali() {
    messaggio.textContent = "⏳ Caricamento dati...";
    messaggio.className = "loader";
    try {
        // Fetch parallela di post e utenti
        [tuttiPost, tuttiUtenti] = await Promise.all([
            api("https://jsonplaceholder.typicode.com/posts"),
            api("https://jsonplaceholder.typicode.com/users")
        ]);
        riempiFiltroUtenti();
        mostraListaPost();
        messaggio.textContent = "";
        messaggio.className = "";
    }
    catch (errore) {
        messaggio.textContent = "Errore durante il caricamento dei dati.";
        messaggio.className = "errore";
        console.error(errore);
    }
}
// Popolamento select utenti
function riempiFiltroUtenti() {
    tuttiUtenti.forEach((utente) => {
        const option = document.createElement("option");
        option.value = String(utente.id);
        option.textContent = utente.name;
        filtroUtente.appendChild(option);
    });
}
// Helper per trovare il nome dell'utente
function trovaNomeUtente(userId) {
    const utente = tuttiUtenti.find(u => u.id === userId);
    return utente ? utente.name : "Utente sconosciuto";
}
// Filtra i post in base alla ricerca e all'utente selezionato
function ottieniPostFiltrati() {
    const userIdSelezionato = filtroUtente.value;
    let postFiltrati = (ultimiRisultatiRicerca !== null) ? ultimiRisultatiRicerca : tuttiPost;
    if (userIdSelezionato) {
        postFiltrati = postFiltrati.filter(post => post.userId === Number(userIdSelezionato));
    }
    return postFiltrati;
}
// Renderizzazione della lista post
function mostraListaPost() {
    const quantiPerPagina = Number(perPagina.value);
    const postFiltrati = ottieniPostFiltrati();
    let totalePagine = Math.ceil(postFiltrati.length / quantiPerPagina) || 1;
    if (pagina > totalePagine)
        pagina = totalePagine;
    const inizio = (pagina - 1) * quantiPerPagina;
    const fine = inizio + quantiPerPagina;
    const postDaMostrare = postFiltrati.slice(inizio, fine);
    listaPost.innerHTML = "";
    postDaMostrare.forEach((post) => {
        const card = document.createElement("div");
        card.className = "post-card";
        if (idPostAperto === post.id)
            card.classList.add("post-attivo");
        card.innerHTML = `
            <h3>${evidenziaTesto(post.title, testoRicercaAttuale)}</h3>
            <p><strong>Utente:</strong> ${trovaNomeUtente(post.userId)}</p>
            <p><strong>Anteprima:</strong> ${evidenziaTesto(post.body.slice(0, 60), testoRicercaAttuale)}...</p>
        `;
        card.addEventListener("click", () => {
            document.querySelectorAll(".post-card").forEach(el => el.classList.remove("post-attivo"));
            card.classList.add("post-attivo");
            idPostAperto = post.id;
            mostraDettaglioPost(post.id);
            dettaglioPost.scrollIntoView({ behavior: "smooth" });
        });
        listaPost.appendChild(card);
    });
    aggiornaUIComponenti(postFiltrati.length, totalePagine);
}
// Aggiorna contatore pagine e stato bottoni
function aggiornaUIComponenti(totalePost, totalePagine) {
    const paginazione = document.querySelector(".paginazione");
    if (!paginazione)
        return;
    if (totalePost === 0) {
        paginazione.style.display = "none";
    }
    else {
        paginazione.style.display = "flex";
        paginaCorrente.textContent = `Pagina ${pagina} di ${totalePagine}`;
        prevBtn.disabled = (pagina === 1);
        nextBtn.disabled = (pagina === totalePagine);
    }
}
// Renderizzazione dettaglio post e commenti (colonna destra)
async function mostraDettaglioPost(postId) {
    try {
        dettaglioPost.innerHTML = "<p>⏳ Caricamento dettaglio...</p>";
        const [post, commenti] = await Promise.all([
            api(`https://jsonplaceholder.typicode.com/posts/${postId}`),
            api(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`)
        ]);
        let html = `
            <div class='box-post'>
                <h3>${evidenziaTesto(post.title, testoRicercaAttuale)}</h3>
                <p><strong>Utente:</strong> ${trovaNomeUtente(post.userId)}</p>
                <p>${evidenziaTesto(post.body, testoRicercaAttuale)}</p>
                <button id="btnToggleCommenti" class="btn-commenti" title="Mostra commenti"></button>
            </div>
            <div id='boxCommenti' class='box-commenti' style='display: none;'>
                <h4>Commenti (${commenti.length})</h4>
                <div class='lista-commenti'>
                    ${commenti.map(c => `
                        <div class='commento'>
                            <p><strong>${evidenziaTesto(c.name, testoRicercaAttuale)}</strong></p>
                            <p><small>${c.email}</small></p>
                            <p>${evidenziaTesto(c.body, testoRicercaAttuale)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        dettaglioPost.innerHTML = html;
        const btn = document.getElementById("btnToggleCommenti");
        const box = document.getElementById("boxCommenti");
        if (btn && box) {
            btn.addEventListener("click", () => {
                const isNascosto = box.style.display === "none";
                box.style.display = isNascosto ? "block" : "none";
                btn.classList.toggle("aperto");
            });
        }
    }
    catch (errore) {
        dettaglioPost.innerHTML = "<p class='errore'>Errore nel caricamento del dettaglio.</p>";
        console.error(errore);
    }
}
// Logica di ricerca asincrona
async function eseguiRicerca() {
    if (ricercaInCorso)
        return;
    const testo = barraRicerca.value.trim();
    try {
        ricercaInCorso = true;
        testoRicercaAttuale = testo;
        messaggio.textContent = "🔍 Ricerca in corso...";
        await attendi(400); // Simulazione latenza
        if (!testo) {
            ultimiRisultatiRicerca = null;
        }
        else {
            const parole = testo.toLowerCase().split(" ").filter(Boolean);
            ultimiRisultatiRicerca = tuttiPost.filter((post) => parole.every(p => post.title.toLowerCase().includes(p) || post.body.toLowerCase().includes(p)));
        }
        pagina = 1;
        mostraListaPost();
        // Se c'è un post aperto, lo aggiorniamo in tempo reale per evidenziare i nuovi termini
        if (idPostAperto !== null) {
            mostraDettaglioPost(idPostAperto);
        }
        messaggio.textContent = "";
    }
    finally {
        ricercaInCorso = false;
    }
}
// Gestione paginazione
const cambiaPagina = (delta) => {
    pagina += delta;
    mostraListaPost();
};
// Event Listeners
filtroUtente.addEventListener("change", () => { pagina = 1; mostraListaPost(); });
perPagina.addEventListener("change", () => { pagina = 1; mostraListaPost(); });
cercaBtn.addEventListener("click", () => eseguiRicerca());
barraRicerca.addEventListener("keypress", (e) => {
    if (e.key === "Enter")
        eseguiRicerca();
});
prevBtn.addEventListener("click", () => cambiaPagina(-1));
nextBtn.addEventListener("click", () => cambiaPagina(1));
riprovaCentroBtn.addEventListener("click", () => caricaDatiIniziali());
// Inizializzazione
caricaDatiIniziali();
//# sourceMappingURL=Typescript.js.map