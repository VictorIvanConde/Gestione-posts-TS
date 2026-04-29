// V.I.C. --> esercizio fetch post 22-04-2026


// definisco la struttura dei dati che ricevi dalle mie api
// questo evita errori tipo "undefined", "string dove serve number", ecc.


// POST = struttura fissa dei dati ricevuti dall'API
type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
};

// USER = utenti dell'API
type User = {
    id: number;
    name: string;
};

// COMMENTI = dati collegati ai post
type Commento = {
    postId: number;
    id: number;
    name: string;
    email: string;
    body: string;
};


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

const erroreServerBox = document.getElementById("erroreServerBox") as HTMLElement;
const riprovaCentroBtn = document.getElementById("riprovaCentroBtn") as HTMLButtonElement;


// questi sono i dati che uso in tutta l'app

let tuttiPost: Post[] = [];
let tuttiUtenti: User[] = [];

// pagina corrente (paginazione)
let pagina: number = 1;

// testo ricerca attuale
let testoRicercaAttuale: string = "";

// risultati filtrati della ricerca (può essere null)
let ultimiRisultatiRicerca: Post[] | null = null;


// qui si vede 
// → in TS dico ESPLICITAMENTE che tipo sono gli array
// → in JS non esiste questa sicurezza

// <T> = generico
// significa: "questa funzione può restituire QUALSIASI tipo"

async function api<T>(url: string): Promise<T> {

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Errore nella richiesta");
    }

    return res.json();
}


//Funzionme di attesa per simulare server lento

function attendi(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Funzione per evidenziace il testo cercato
function evidenziaTesto(testo: string, query: string): string {
    if (!query.trim()) return testo;
    const parole = query.trim().split(/\s+/).filter(p => p.length > 0);
    let testoRisultante = testo;

    parole.forEach(parola => {
        const regex = new RegExp(`(${parola})`, "gi");
        testoRisultante = testoRisultante.replace(regex, "<mark>$1</mark>");
    });

    return testoRisultante;
}

//questa funzione parte appena si apre la pagina

async function caricaDatiIniziali(): Promise<void> {

    // feedback utente (loading)
    messaggio.textContent = "⏳ Caricamento post...";
    messaggio.className = "loader";

    try {

        // FETCH DATI (qui uso TS con tipi precisi)
        tuttiPost = await api<Post[]>("https://jsonplaceholder.typicode.com/posts");
        tuttiUtenti = await api<User[]>("https://jsonplaceholder.typicode.com/users");

        // riempio filtro utenti
        riempiFiltroUtenti();

        // mostro lista iniziale post
        mostraListaPost();

        // pulizia messaggio
        messaggio.textContent = "";
        messaggio.className = "";

    } catch (errore) {

        // gestione errore fetch
        messaggio.textContent = "Errore durante il caricamento dei dati.";
        messaggio.className = "errore";

        console.log(errore);
    }
}


// prendo utenti e li metto nella select

function riempiFiltroUtenti(): void {

    tuttiUtenti.forEach((utente: User) => {

        const option = document.createElement("option");

        option.value = String(utente.id);
        option.textContent = utente.name;

        filtroUtente.appendChild(option);
    });
}

//qua trovo il nome utente con l'id
// input: userId
// output: nome utente

function trovaNomeUtente(userId: number): string {

    const utente = tuttiUtenti.find(u => u.id === userId);

    return utente ? utente.name : "Utente sconosciuto";
}

// qui combino:
// - filtro utente
// - ricerca

function ottieniPostFiltrati(): Post[] {

    const userIdSelezionato = filtroUtente.value;

    let postFiltrati: Post[] = tuttiPost;

    // filtro per utente
    if (userIdSelezionato) {
        postFiltrati = postFiltrati.filter(
            post => post.userId === Number(userIdSelezionato)
        );
    }

    // se esiste ricerca attiva la applico
    if (ultimiRisultatiRicerca !== null) {

        postFiltrati = ultimiRisultatiRicerca.filter(post => {

            if (!userIdSelezionato) return true;

            return post.userId === Number(userIdSelezionato);
        });
    }

    return postFiltrati;
}

//lista dei post
// costruisco UI dinamica (card)

function mostraListaPost(): void {

    const quantiPerPagina = Number(perPagina.value);

    const postFiltrati = ottieniPostFiltrati();

    let totalePagine = Math.ceil(postFiltrati.length / quantiPerPagina);

    if (totalePagine === 0) totalePagine = 1;

    if (pagina > totalePagine) {
        pagina = totalePagine;
    }

    const inizio = (pagina - 1) * quantiPerPagina;
    const fine = inizio + quantiPerPagina;

    const postDaMostrare = postFiltrati.slice(inizio, fine);

    listaPost.innerHTML = "";

    postDaMostrare.forEach((post: Post) => {

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
    const paginazione = document.querySelector(".paginazione") as HTMLElement;

    if (postFiltrati.length === 0) {
        paginazione.style.display = "none";
    } else {
        paginazione.style.display = "flex";

        paginaCorrente.textContent =
            `Pagina ${pagina} di ${totalePagine}`;

        prevBtn.style.display = pagina === 1 ? "none" : "inline-block";
        nextBtn.style.display = pagina === totalePagine ? "none" : "inline-block";
    }
}

// fetch + render dettagli + commenti

async function mostraDettaglioPost(postId: number): Promise<void> {

    try {
        dettaglioPost.innerHTML = "<p>⏳ Caricamento...</p>";

        const post = await api<Post>(
            `https://jsonplaceholder.typicode.com/posts/${postId}`
        );

        const commenti = await api<Commento[]>(
            `https://jsonplaceholder.typicode.com/comments?postId=${postId}`
        );

        let html = "";

        html += "<div class='box-post'>";
        html += `<h3>${evidenziaTesto(post.title, testoRicercaAttuale)}</h3>`;
        html += `<p><strong>Utente:</strong> ${trovaNomeUtente(post.userId)}</p>`;
        html += `<p>${evidenziaTesto(post.body, testoRicercaAttuale)}</p>`;
        html += "</div>";

        html += "<div id='boxCommenti'>";

        commenti.forEach((c: Commento) => {

            html += `<p><strong>${evidenziaTesto(c.name, testoRicercaAttuale)}</strong></p>`;
            html += `<p>${c.email}</p>`;
            html += `<p>${evidenziaTesto(c.body, testoRicercaAttuale)}</p>`;
        });

        html += "</div>";

        dettaglioPost.innerHTML = html;

    } catch (errore) {
        dettaglioPost.innerHTML = "<p>Errore nel caricamento del dettaglio.</p>";
        console.log(errore);
    }
}

//validazione

function validaRicerca(testo: string): string | true {

    if (!testo.trim()) return "Il campo di ricerca è obbligatorio.";

    if (testo.trim().length < 3) return "Minimo 3 caratteri.";

    return true;
}

// ricerca del post

async function eseguiRicerca(): Promise<void> {

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

        return parole.every(p =>
            post.title.toLowerCase().includes(p) ||
            post.body.toLowerCase().includes(p)
        );
    });

    pagina = 1;
    mostraListaPost();
}

// =====================================================
//                EVENT LISTENERS
// =====================================================

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
    if (e.key === "Enter") eseguiRicerca();
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