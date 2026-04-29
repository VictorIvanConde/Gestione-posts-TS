// V.I.C. --> esercizio fetch post 22-04-2026

let filtroUtente = document.getElementById("filtroUtente");
let perPagina = document.getElementById("perPagina");
let messaggio = document.getElementById("messaggio");
let listaPost = document.getElementById("listaPost");
let dettaglioPost = document.getElementById("dettaglioPost");
let prevBtn = document.getElementById("prevBtn");
let nextBtn = document.getElementById("nextBtn");
let paginaCorrente = document.getElementById("paginaCorrente");

let barraRicerca = document.getElementById("barraRicerca");
let cercaBtn = document.getElementById("cercaBtn");

let erroreServerBox = document.getElementById("erroreServerBox");
let riprovaCentroBtn = document.getElementById("riprovaCentroBtn");

let tuttiPost = [];
let tuttiUtenti = [];
let pagina = 1;

let testoRicercaAttuale = "";
let ultimiRisultatiRicerca = null;

// wrapper leggero fetch
async function api(url) {
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Errore nella richiesta");
    }

    return res.json();
}

// sleep per simulare back-end
function attendi(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

// carico post e utenti
async function caricaDatiIniziali() {
    messaggio.textContent = "⏳ Caricamento post...";
    messaggio.className = "loader";

    try {
        tuttiPost = await api("https://jsonplaceholder.typicode.com/posts");
        tuttiUtenti = await api("https://jsonplaceholder.typicode.com/users");

        riempiFiltroUtenti();
        mostraListaPost();

        messaggio.textContent = "";
        messaggio.className = "";
    } catch (errore) {
        messaggio.textContent = "Errore durante il caricamento dei dati.";
        messaggio.className = "errore";
        console.log(errore);
    }
}

// riempio select utenti
function riempiFiltroUtenti() {
    tuttiUtenti.forEach(function (utente) {
        let option = document.createElement("option");
        option.value = utente.id;
        option.textContent = utente.name;
        filtroUtente.appendChild(option);
    });
}

// restituisce il nome utente partendo da userId
function trovaNomeUtente(userId) {
    let utente = tuttiUtenti.find(function (u) {
        return u.id === userId;
    });

    if (utente) {
        return utente.name;
    }

    return "Utente sconosciuto";
}

// ottiene i post da mostrare in base a filtro utente e ricerca
function ottieniPostFiltrati() {
    let userIdSelezionato = filtroUtente.value;
    let postFiltrati = tuttiPost;

    if (userIdSelezionato) {
        postFiltrati = postFiltrati.filter(function (post) {
            return post.userId === Number(userIdSelezionato);
        });
    }

    if (ultimiRisultatiRicerca !== null) {
        postFiltrati = ultimiRisultatiRicerca.filter(function (postRicerca) {
            if (!userIdSelezionato) {
                return true;
            }

            return postRicerca.userId === Number(userIdSelezionato);
        });
    }

    return postFiltrati;
}

// filtro + paginazione
function mostraListaPost() {
    let quantiPerPagina = Number(perPagina.value);
    let postFiltrati = ottieniPostFiltrati();

    let totalePagine = Math.ceil(postFiltrati.length / quantiPerPagina);

    if (totalePagine === 0) {
        totalePagine = 1;
    }

    if (pagina > totalePagine) {
        pagina = totalePagine;
    }

    let inizio = (pagina - 1) * quantiPerPagina;
    let fine = inizio + quantiPerPagina;

    let postDaMostrare = postFiltrati.slice(inizio, fine);

    listaPost.innerHTML = "";

    if (postDaMostrare.length === 0) {
        listaPost.innerHTML = "";
    }

    postDaMostrare.forEach(function (post) {
        let card = document.createElement("div");
        card.className = "post-card";

        let titolo = document.createElement("h3");
        titolo.innerHTML = evidenziaTesto(post.title, testoRicercaAttuale);

        let autore = document.createElement("p");
        autore.innerHTML = "<strong>Utente:</strong> " + trovaNomeUtente(post.userId);

        let bodyBreve = document.createElement("p");
        let anteprima = post.body.slice(0, 60);
        bodyBreve.innerHTML = "<strong>Anteprima:</strong> " + evidenziaTesto(anteprima, testoRicercaAttuale) + "...";

        card.appendChild(titolo);
        card.appendChild(autore);
        card.appendChild(bodyBreve);

        card.addEventListener("click", function () {
            let tutti = document.querySelectorAll(".post-card");
            tutti.forEach(function (el) {
                el.classList.remove("post-attivo");
            });

            card.classList.add("post-attivo");

            mostraDettaglioPost(post.id);

            dettaglioPost.scrollIntoView({
                behavior: "smooth"
            });
        });

        listaPost.appendChild(card);
    });
    let paginazione = document.querySelector(".paginazione");

    if (postFiltrati.length === 0) {
        paginazione.style.display = "none";
    } else {
        paginazione.style.display = "flex";
        paginaCorrente.textContent = "Pagina " + pagina + " di " + totalePagine;

        prevBtn.style.display = pagina === 1 ? "none" : "inline-block";
        nextBtn.style.display = pagina === totalePagine ? "none" : "inline-block";
    }
}

// dettaglio post + commenti
async function mostraDettaglioPost(postId) {
    try {
        dettaglioPost.innerHTML = "<p>⏳ Caricamento...</p>";

        let post = await api("https://jsonplaceholder.typicode.com/posts/" + postId);
        let commenti = await api("https://jsonplaceholder.typicode.com/comments?postId=" + postId);

        let html = "";

        // box del post
        html += "<div class='box-post'>";
        html += "<h3>" + evidenziaTesto(post.title, testoRicercaAttuale) + "</h3>";
        html += "<p><strong>Utente:</strong> " + trovaNomeUtente(post.userId) + "</p>";
        html += "<p><strong>Body completo:</strong></p>";
        html += "<p>" + evidenziaTesto(post.body, testoRicercaAttuale) + "</p>";
        html += "<button id='toggleCommenti' class='btn-commenti' aria-label='Mostra commenti'></button>";
        html += "</div>";

        // box commenti nascosto
        html += "<div id='boxCommenti' class='box-commenti' style='display:none;'>";
        html += "<h3>Commenti (" + commenti.length + ")</h3>";
        html += "<div class='lista-commenti'>";

        commenti.forEach(function (commento) {
            html += "<div class='commento'>";
            html += "<p><strong>" + evidenziaTesto(commento.name, testoRicercaAttuale) + "</strong></p>";
            html += "<p><strong>Email:</strong> " + commento.email + "</p>";
            html += "<p>" + evidenziaTesto(commento.body, testoRicercaAttuale) + "</p>";
            html += "</div>";
        });

        html += "</div>";
        html += "</div>";

        dettaglioPost.innerHTML = html;

        let btn = document.getElementById("toggleCommenti");
        let box = document.getElementById("boxCommenti");

        btn.addEventListener("click", function () {
            let aperto = box.style.display === "block";

            box.style.display = aperto ? "none" : "block";

            btn.classList.toggle("aperto", !aperto);
        });

    } catch (errore) {
        dettaglioPost.innerHTML = "<p>Errore nel caricamento del dettaglio.</p>";
        console.log(errore);
    }
}



// validazione ricerca
function validaRicerca(testo) {
    if (!testo.trim()) {
        return "Il campo di ricerca è obbligatorio.";
    }

    if (testo.trim().length < 3) {
        return "La ricerca deve contenere almeno 3 caratteri.";
    }

    return true;
}

// ricerca asincrona simulata
async function eseguiRicerca() {
    let testo = barraRicerca.value.trim();
    let validazione = validaRicerca(testo);
    erroreServerBox.style.display = "none";
    document.querySelector(".paginazione").style.display = "flex";
    document.querySelector(".colonna-destra").style.display = "block";

    if (validazione !== true) {
        messaggio.textContent = validazione;
        messaggio.className = "errore";
        ultimiRisultatiRicerca = null;
        mostraListaPost();
        return;
    }

    testoRicercaAttuale = testo;

    try {
        let tempoAttesa = Math.floor(Math.random() * 3001) + 1000;
        messaggio.textContent = "⏳ Ricerca in corso...";
        messaggio.className = "loader";
        document.querySelector(".paginazione").style.display = "none";
        await attendi(tempoAttesa);

        let erroreServer = Math.floor(Math.random() * 10) + 1;

        if (erroreServer === 1) {
            throw new Error("Errore temporaneo del server.");
        }

        ultimiRisultatiRicerca = tuttiPost.filter(function (post) {
            let titolo = post.title.toLowerCase();
            let body = post.body.toLowerCase();
            let testoMinuscolo = testo.toLowerCase();

            let parole = testoMinuscolo.split(" ").filter(function (parola) {
                return parola !== "";
            });

            return parole.every(function (parola) {
                return titolo.includes(parola) || body.includes(parola);
            });
        });

        pagina = 1;
        mostraListaPost();

        if (ottieniPostFiltrati().length === 0) {
            messaggio.textContent = "Nessun risultato trovato.";
            messaggio.className = "errore";

            dettaglioPost.innerHTML = "<p>Nessun post da visualizzare.</p>";
        } else {
            messaggio.textContent = "Ricerca completata.";
            messaggio.className = "successo";
        }
    } catch (errore) {
        listaPost.innerHTML = "";
        dettaglioPost.innerHTML = "";

        document.querySelector(".paginazione").style.display = "none";
        document.querySelector(".colonna-destra").style.display = "none";

        messaggio.textContent = "";
        messaggio.className = "";

        erroreServerBox.style.display = "block";

        console.log(errore);
    }
}

function resetRicerca() {
    dettaglioPost.innerHTML = "<p>Seleziona un post per vedere il dettaglio completo.</p>";
    testoRicercaAttuale = "";
    ultimiRisultatiRicerca = null;
    messaggio.textContent = "";
    messaggio.className = "";
    erroreServerBox.style.display = "none";
    pagina = 1;

    mostraListaPost();

}

// cambio filtro utente
filtroUtente.addEventListener("change", function () {
    pagina = 1;
    mostraListaPost();
});

// cambio numero risultati
perPagina.addEventListener("change", function () {
    pagina = 1;
    mostraListaPost();
});

// pulsante cerca
cercaBtn.addEventListener("click", function () {
    eseguiRicerca();
});

// invio con enter nella barra
barraRicerca.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        eseguiRicerca();
    }
});

// se svuoto la barra, torno alla lista normale
barraRicerca.addEventListener("input", function () {
    if (barraRicerca.value.trim() === "") {
        resetRicerca();
    }
});

// paginazione
prevBtn.addEventListener("click", function () {
    if (pagina > 1) {
        pagina--;
        mostraListaPost();
    }
});

nextBtn.addEventListener("click", function () {
    let quantiPerPagina = Number(perPagina.value);
    let postFiltrati = ottieniPostFiltrati();
    let totalePagine = Math.ceil(postFiltrati.length / quantiPerPagina);

    if (pagina < totalePagine) {
        pagina++;
        mostraListaPost();
    }
});

function evidenziaTesto(testo, ricerca) {
    if (!ricerca) return testo;

    let parole = ricerca.toLowerCase().split(" ").filter(p => p !== "");

    parole.forEach(function (parola) {
        let regex = new RegExp("(" + parola + ")", "gi");
        testo = testo.replace(regex, "<span class='highlight'>$1</span>");
    });

    return testo;
}

// pulsante riprova centrale
riprovaCentroBtn.addEventListener("click", function () {
    eseguiRicerca();
});

// avvio
caricaDatiIniziali();