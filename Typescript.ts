// V.I.C. --> esercizio fetch post 22-04-2026
"use strict";

// Definizione interfacce per i dati dell'API
interface Post {
    userId: number;
    id: number;
    title: string;
    body: string;
}

interface Utente {
    id: number;
    name: string;
    username: string;
    email: string;
}

interface Commento {
    postId: number;
    id: number;
    name: string;
    email: string;
    body: string;
}

// Selezione elementi del DOM con tipizzazione specifica
const filtroUtente = document.getElementById("filtroUtente") as HTMLSelectElement;
const perPagina = document.getElementById("perPagina") as HTMLSelectElement;
const messaggio = document.getElementById("messaggio") as HTMLElement;
const listaPost = document.getElementById("listaPost") as HTMLElement;
const dettaglioPost = document.getElementById("dettaglioPost") as HTMLElement;
const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement;
const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement;
const paginaCorrente = document.getElementById("paginaCorrente") as HTMLElement;
const barraRicerca = document.getElementById("barraRicerca") as HTMLInputElement;
const cercaBtn = document.getElementById("cercaBtn") as HTMLButtonElement;
const riprovaCentroBtn = document.getElementById("riprovaCentroBtn") as HTMLButtonElement;

// Variabili di stato dell'applicazione
let tuttiPost: Post[] = [];
let tuttiUtenti: Utente[] = [];
let pagina: number = 1;
let testoRicercaAttuale: string = "";
let ultimiRisultatiRicerca: Post[] | null = null;
let ricercaInCorso: boolean = false;
let idPostAperto: number | null = null;

// Funzione generica per le chiamate API
async function api<T>(url: string): Promise<T> {
    const res: Response = await fetch(url);
    if (!res.ok) {
        throw new Error("Errore nella richiesta");
    }
    return res.json();
}

// Funzione di attesa per simulazioni
function attendi(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Evidenzia */
function evidenziaTesto(testo: string, query: string): string {
    if (!testo) return "";
    if (!query || !query.trim()) return testo;

    const queryProtetta: string = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parole: string[] = queryProtetta.trim().split(/\s+/).filter((p: string) => p.length > 0);
    let testoRisultante: string = testo;

    parole.forEach((parola: string): void => {
        const regex: RegExp = new RegExp(`(${parola})`, "gi");
        testoRisultante = testoRisultante.replace(regex, '<span class="highlight">$1</span>');
    });

    return testoRisultante;
}

// Avvio dell'applicazione
async function caricaDatiIniziali(): Promise<void> {
    messaggio.textContent = "⏳ Caricamento dati...";
    messaggio.className = "loader";

    try {
        // Fetch parallela di post e utenti
        [tuttiPost, tuttiUtenti] = await Promise.all([
            api<Post[]>("https://jsonplaceholder.typicode.com/posts"),
            api<Utente[]>("https://jsonplaceholder.typicode.com/users")
        ]);

        riempiFiltroUtenti();
        mostraListaPost();

        messaggio.textContent = "";
        messaggio.className = "";
    } catch (errore) {
        messaggio.textContent = "Errore durante il caricamento dei dati.";
        messaggio.className = "errore";
        console.error(errore);
    }
}

// Popolamento select utenti
function riempiFiltroUtenti(): void {
    tuttiUtenti.forEach((utente: Utente): void => {
        const option: HTMLOptionElement = document.createElement("option");
        option.value = String(utente.id);
        option.textContent = utente.name;
        filtroUtente.appendChild(option);
    });
}

// Helper per trovare il nome dell'utente
function trovaNomeUtente(userId: number): string {
    const utente: Utente | undefined = tuttiUtenti.find(u => u.id === userId);
    return utente ? utente.name : "Utente sconosciuto";
}

// Filtra i post in base alla ricerca e all'utente selezionato
function ottieniPostFiltrati(): Post[] {
    const userIdSelezionato: string = filtroUtente.value;
    let postFiltrati: Post[] = (ultimiRisultatiRicerca !== null) ? ultimiRisultatiRicerca : tuttiPost;

    if (userIdSelezionato) {
        postFiltrati = postFiltrati.filter(post => post.userId === Number(userIdSelezionato));
    }
    return postFiltrati;
}

// Renderizzazione della lista post
function mostraListaPost(): void {
    const quantiPerPagina: number = Number(perPagina.value);
    const postFiltrati: Post[] = ottieniPostFiltrati();
    let totalePagine: number = Math.ceil(postFiltrati.length / quantiPerPagina) || 1;

    if (pagina > totalePagine) pagina = totalePagine;

    const inizio: number = (pagina - 1) * quantiPerPagina;
    const fine: number = inizio + quantiPerPagina;
    const postDaMostrare: Post[] = postFiltrati.slice(inizio, fine);

    listaPost.innerHTML = "";
    postDaMostrare.forEach((post: Post): void => {
        const card: HTMLDivElement = document.createElement("div");
        card.className = "post-card";
        if (idPostAperto === post.id) card.classList.add("post-attivo");

        card.innerHTML = `
            <h3>${evidenziaTesto(post.title, testoRicercaAttuale)}</h3>
            <p><strong>Utente:</strong> ${trovaNomeUtente(post.userId)}</p>
            <p><strong>Anteprima:</strong> ${evidenziaTesto(post.body.slice(0, 60), testoRicercaAttuale)}...</p>
        `;

        card.addEventListener("click", (): void => {
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
function aggiornaUIComponenti(totalePost: number, totalePagine: number): void {
    const paginazione: HTMLElement | null = document.querySelector(".paginazione");
    if (!paginazione) return;

    if (totalePost === 0) {
        paginazione.style.display = "none";
    } else {
        paginazione.style.display = "flex";
        paginaCorrente.textContent = `Pagina ${pagina} di ${totalePagine}`;
        prevBtn.disabled = (pagina === 1);
        nextBtn.disabled = (pagina === totalePagine);
    }
}

// Renderizzazione dettaglio post e commenti (colonna destra)
async function mostraDettaglioPost(postId: number): Promise<void> {
    try {
        dettaglioPost.innerHTML = "<p>⏳ Caricamento dettaglio...</p>";

        const [post, commenti] = await Promise.all([
            api<Post>(`https://jsonplaceholder.typicode.com/posts/${postId}`),
            api<Commento[]>(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`)
        ]);

        let html: string = `
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

        const btn: HTMLButtonElement | null = document.getElementById("btnToggleCommenti") as HTMLButtonElement;
        const box: HTMLElement | null = document.getElementById("boxCommenti");

        if (btn && box) {
            btn.addEventListener("click", (): void => {
                const isNascosto: boolean = box.style.display === "none";
                box.style.display = isNascosto ? "block" : "none";
                btn.classList.toggle("aperto");
            });
        }
    } catch (errore) {
        dettaglioPost.innerHTML = "<p class='errore'>Errore nel caricamento del dettaglio.</p>";
        console.error(errore);
    }
}

// Logica di ricerca asincrona
async function eseguiRicerca(): Promise<void> {
    if (ricercaInCorso) return;
    const testo: string = barraRicerca.value.trim();

    try {
        ricercaInCorso = true;
        testoRicercaAttuale = testo;
        messaggio.textContent = "🔍 Ricerca in corso...";

        await attendi(400); // Simulazione latenza

        if (!testo) {
            ultimiRisultatiRicerca = null;
        } else {
            const parole: string[] = testo.toLowerCase().split(" ").filter(Boolean);
            ultimiRisultatiRicerca = tuttiPost.filter((post: Post): boolean =>
                parole.every(p => post.title.toLowerCase().includes(p) || post.body.toLowerCase().includes(p))
            );
        }

        pagina = 1;
        mostraListaPost();

        // Se c'è un post aperto, lo aggiorniamo in tempo reale per evidenziare i nuovi termini
        if (idPostAperto !== null) {
            mostraDettaglioPost(idPostAperto);
        }

        messaggio.textContent = "";
    } finally {
        ricercaInCorso = false;
    }
}

// Gestione paginazione
const cambiaPagina = (delta: number): void => {
    pagina += delta;
    mostraListaPost();
};

// Event Listeners
filtroUtente.addEventListener("change", (): void => { pagina = 1; mostraListaPost(); });
perPagina.addEventListener("change", (): void => { pagina = 1; mostraListaPost(); });
cercaBtn.addEventListener("click", (): Promise<void> => eseguiRicerca());
barraRicerca.addEventListener("keypress", (e: KeyboardEvent): void => {
    if (e.key === "Enter") eseguiRicerca();
});
prevBtn.addEventListener("click", (): void => cambiaPagina(-1));
nextBtn.addEventListener("click", (): void => cambiaPagina(1));
riprovaCentroBtn.addEventListener("click", (): Promise<void> => caricaDatiIniziali());

// Inizializzazione
caricaDatiIniziali();