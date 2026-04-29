"use strict";
// V.I.C. --> esercizio fetch post 22-04-2026
Object.defineProperty(exports, "__esModule", { value: true });
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
const erroreServerBox = document.getElementById("erroreServerBox");
const riprovaCentroBtn = document.getElementById("riprovaCentroBtn");
// questi sono i dati che uso in tutta l'app
let tuttiPost = [];
let tuttiUtenti = [];
// pagina corrente (paginazione)
let pagina = 1;
// testo ricerca attuale
let testoRicercaAttuale = "";
// risultati filtrati della ricerca (può essere null)
let ultimiRisultatiRicerca = null;
// qui si vede 
// → in TS dico ESPLICITAMENTE che tipo sono gli array
// → in JS non esiste questa sicurezza
// <T> = generico
// significa: "questa funzione può restituire QUALSIASI tipo"
async function api(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Errore nella richiesta");
    }
    return res.json();
}
//Funzionme di attesa per simulare server lento
function attendi(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Funzione per evidenziace il testo cercato
function evidenziaTesto(testo, query) {
    if (!query.trim())
        return testo;
    const parole = query.trim().split(/\s+/).filter(p => p.length > 0);
    let testoRisultante = testo;
    parole.forEach(parola => {
        const regex = new RegExp(`(${parola})`, "gi");
        testoRisultante = testoRisultante.replace(regex, "<mark>$1</mark>");
    });
    return testoRisultante;
}
//questa funzione parte appena si apre la pagina
async function caricaDatiIniziali() {
    // feedback utente (loading)
    messaggio.textContent = "⏳ Caricamento post...";
    messaggio.className = "loader";
    try {
        // FETCH DATI (qui uso TS con tipi precisi)
        tuttiPost = await api("https://jsonplaceholder.typicode.com/posts");
        tuttiUtenti = await api("https://jsonplaceholder.typicode.com/users");
        // riempio filtro utenti
        riempiFiltroUtenti();
        // mostro lista iniziale post
        mostraListaPost();
        // pulizia messaggio
        messaggio.textContent = "";
        messaggio.className = "";
    }
    catch (errore) {
        // gestione errore fetch
        messaggio.textContent = "Errore durante il caricamento dei dati.";
        messaggio.className = "errore";
        console.log(errore);
    }
}
// prendo utenti e li metto nella select
function riempiFiltroUtenti() {
    tuttiUtenti.forEach((utente) => {
        const option = document.createElement("option");
        option.value = String(utente.id);
        option.textContent = utente.name;
        filtroUtente.appendChild(option);
    });
}
//qua trovo il nome utente con l'id
// input: userId
// output: nome utente
function trovaNomeUtente(userId) {
    const utente = tuttiUtenti.find(u => u.id === userId);
    return utente ? utente.name : "Utente sconosciuto";
}
// qui combino:
// - filtro utente
// - ricerca
function ottieniPostFiltrati() {
    const userIdSelezionato = filtroUtente.value;
    let postFiltrati = tuttiPost;
    // filtro per utente
    if (userIdSelezionato) {
        postFiltrati = postFiltrati.filter(post => post.userId === Number(userIdSelezionato));
    }
    // se esiste ricerca attiva la applico
    if (ultimiRisultatiRicerca !== null) {
        postFiltrati = ultimiRisultatiRicerca.filter(post => {
            if (!userIdSelezionato)
                return true;
            return post.userId === Number(userIdSelezionato);
        });
    }
    return postFiltrati;
}
//lista dei post
// costruisco UI dinamica (card)
function mostraListaPost() {
    const quantiPerPagina = Number(perPagina.value);
    const postFiltrati = ottieniPostFiltrati();
    let totalePagine = Math.ceil(postFiltrati.length / quantiPerPagina);
    if (totalePagine === 0)
        totalePagine = 1;
    if (pagina > totalePagine) {
        pagina = totalePagine;
    }
    const inizio = (pagina - 1) * quantiPerPagina;
    const fine = inizio + quantiPerPagina;
    const postDaMostrare = postFiltrati.slice(inizio, fine);
    listaPost.innerHTML = "";
    postDaMostrare.forEach((post) => {
        const card = document.createElement("div");
        card.className = "post-card";
        const titolo = document.createElement("h3");
        titolo.innerHTML = evidenziaTesto(post.title, testoRicercaAttuale);
        const autore = document.createElement("p");
        autore.innerHTML = `<strong>Utente:</strong> ${trovaNomeUtente(post.userId)}`;
        const bodyBreve = document.createElement("p");
        const anteprima = post.body.slice(0, 60);
        bodyBreve.innerHTML =
            `<strong>Anteprima:</strong> ${evidenziaTesto(anteprima, testoRicercaAttuale)}...`;
        // click su card → apro dettaglio
        card.addEventListener("click", () => {
            document.querySelectorAll(".post-card")
                .forEach(el => el.classList.remove("post-attivo"));
            card.classList.add("post-attivo");
            mostraDettaglioPost(post.id);
            dettaglioPost.scrollIntoView({ behavior: "smooth" });
        });
        card.appendChild(titolo);
        card.appendChild(autore);
        card.appendChild(bodyBreve);
        listaPost.appendChild(card);
    });
    // gestione paginazione
    const paginazione = document.querySelector(".paginazione");
    if (postFiltrati.length === 0) {
        paginazione.style.display = "none";
    }
    else {
        paginazione.style.display = "flex";
        paginaCorrente.textContent =
            `Pagina ${pagina} di ${totalePagine}`;
        prevBtn.style.display = pagina === 1 ? "none" : "inline-block";
        nextBtn.style.display = pagina === totalePagine ? "none" : "inline-block";
    }
}
// fetch + render dettagli + commenti
async function mostraDettaglioPost(postId) {
    try {
        dettaglioPost.innerHTML = "<p>⏳ Caricamento...</p>";
        const post = await api(`https://jsonplaceholder.typicode.com/posts/${postId}`);
        const commenti = await api(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
        let html = "";
        html += "<div class='box-post'>";
        html += `<h3>${evidenziaTesto(post.title, testoRicercaAttuale)}</h3>`;
        html += `<p><strong>Utente:</strong> ${trovaNomeUtente(post.userId)}</p>`;
        html += `<p>${evidenziaTesto(post.body, testoRicercaAttuale)}</p>`;
        html += "</div>";
        html += "<div id='boxCommenti'>";
        commenti.forEach((c) => {
            html += `<p><strong>${evidenziaTesto(c.name, testoRicercaAttuale)}</strong></p>`;
            html += `<p>${c.email}</p>`;
            html += `<p>${evidenziaTesto(c.body, testoRicercaAttuale)}</p>`;
        });
        html += "</div>";
        dettaglioPost.innerHTML = html;
    }
    catch (errore) {
        dettaglioPost.innerHTML = "<p>Errore nel caricamento del dettaglio.</p>";
        console.log(errore);
    }
}
//validazione
function validaRicerca(testo) {
    if (!testo.trim())
        return "Il campo di ricerca è obbligatorio.";
    if (testo.trim().length < 3)
        return "Minimo 3 caratteri.";
    return true;
}
// ricerca del post
async function eseguiRicerca() {
    const testo = barraRicerca.value.trim();
    const validazione = validaRicerca(testo);
    if (validazione !== true) {
        messaggio.textContent = validazione;
        ultimiRisultatiRicerca = null;
        mostraListaPost();
        return;
    }
    testoRicercaAttuale = testo;
    const tempo = Math.floor(Math.random() * 3000) + 1000;
    await attendi(tempo);
    ultimiRisultatiRicerca = tuttiPost.filter(post => {
        const parole = testo.toLowerCase().split(" ").filter(Boolean);
        return parole.every(p => post.title.toLowerCase().includes(p) ||
            post.body.toLowerCase().includes(p));
    });
    pagina = 1;
    mostraListaPost();
}
//                EVENT LISTENERS
// Filtro Utente
filtroUtente.addEventListener("change", () => {
    pagina = 1;
    mostraListaPost();
});
// Post per Pagina
perPagina.addEventListener("change", () => {
    pagina = 1;
    mostraListaPost();
});
// Ricerca
cercaBtn.addEventListener("click", eseguiRicerca);
barraRicerca.addEventListener("keypress", (e) => {
    if (e.key === "Enter")
        eseguiRicerca();
});
// Paginazione
prevBtn.addEventListener("click", () => {
    if (pagina > 1) {
        pagina--;
        mostraListaPost();
    }
});
nextBtn.addEventListener("click", () => {
    pagina++;
    mostraListaPost();
});
// Riprova
riprovaCentroBtn.addEventListener("click", caricaDatiIniziali);
// avvio
caricaDatiIniziali();
//# sourceMappingURL=Typescript.js.map