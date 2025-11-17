// Deklaracija konstanti za igru
const ŠIRINA_CANVASA = 800;
const VISINA_CANVASA = 600;
const BROJ_REDOVA_CIGLI = 5;
const BROJ_STUPACA_CIGLI = 10;
const ŠIRINA_CIGLE = 50;
const VISINA_CIGLE = 15;
const HORIZONTALNI_RAZMAK_CIGLI = 30;
const VERTIKALNI_RAZMAK_CIGLI = 15;
const GORNJA_MARGINA_CIGLI = 50;
const ŠIRINA_PALICE = 100;
const VISINA_PALICE = 15;
const VELIČINA_LOPTICE = 10;
const BRZINA_LOPTICE = 5;
const BRZINA_PALICE = 8;

// Razine ubrzanja kod sudara sa kutovima cigli
const RAZINE_UBRZANJA = [
    { ubrzanje: 1.4, trajanje: 4000 },  // Prvi kut
    { ubrzanje: 1.6, trajanje: 6000 },  // Drugi kut  
    { ubrzanje: 1.8, trajanje: 8000 },  // Treći kut
    { ubrzanje: 2.0, trajanje: 10000 }  // Četvrti i svi sljedeći kutovi
];
const MAKSIMALNA_RAZINA_UBRZANJA = 3;

// Boje cigli prema zadatku
const BOJE_CIGLI = [
    { r: 153, g: 51, b: 0 },     // 1. red - smeđa
    { r: 255, g: 0, b: 0 },      // 2. red - crvena
    { r: 255, g: 153, b: 204 },  // 3. red - ružičasta
    { r: 0, g: 255, b: 0 },      // 4. red - zelena
    { r: 255, g: 255, b: 153 }   // 5. red - žuta
];

// Globalne varijable
let canvas, kontekst;
let stanjeIgre = 'izbornik'; // 'izbornik', 'igranje', 'krajIgre', 'pobjeda'
let cigle = [];
let palica = {};
let loptica = {};
let rezultat = 0;
let najboljiRezultat = 0;
let tipke = {};
let idAnimacije;
let palicaSeMičeLijevo = false;
let palicaSeMičeDesno = false;

// Inicijalizacija igre
function inicijalizirajIgru() {
    canvas = document.getElementById('game-canvas');
    kontekst = canvas.getContext('2d');
    
    // Učitaj najbolji rezultat iz local storage-a
    najboljiRezultat = localStorage.getItem('breakoutNajboljiRezultat') || 0;
    
    // Postavi event listenere
    document.addEventListener('keydown', obradiPritisnutuTipku);
    document.addEventListener('keyup', obradiOtpustenuTipku);
    
    // Inicijaliziraj objekte
    resetirajIgru();
    
    // Pokreni glavnu petlju igre
    glavnaPetljaIgre();
}

// Resetiraj igru
function resetirajIgru() {
    // Resetiraj rezultat
    rezultat = 0;
    
    // Ponovno stvori cigle
    stvoriCigle();
    
    // Postavi palicu
    palica = {
        x: (ŠIRINA_CANVASA - ŠIRINA_PALICE) / 2,
        y: VISINA_CANVASA - VISINA_PALICE - 20,
        width: ŠIRINA_PALICE,
        height: VISINA_PALICE
    };
    
    // Postavi lopticu na početnu poziciju (na palici)
    loptica = {
        x: palica.x + palica.width / 2 - VELIČINA_LOPTICE / 2,
        y: palica.y - VELIČINA_LOPTICE,
        veličina: VELIČINA_LOPTICE,
        brzinaX: 0,
        brzinaY: 0,
        osnovnaBrzina: BRZINA_LOPTICE,
        povečanjeBrzine: 1.0,
        timerUbrzanja: 0,
        razinaUbrzanja: -1 // -1 = nema ubrzanja, 0-3 = razina ubrzanja
    };
    
    // Resetiraj stanje kretanja palice
    palicaSeMičeLijevo = false;
    palicaSeMičeDesno = false;
}

// Stvori cigle
function stvoriCigle() {
    cigle = [];
    
    // Izračunaj ukupnu širinu koju zauzimaju sve cigle s razmacima
    const ukupnaŠirinaCigli = BROJ_STUPACA_CIGLI * ŠIRINA_CIGLE + (BROJ_STUPACA_CIGLI - 1) * HORIZONTALNI_RAZMAK_CIGLI;
    
    // Izračunaj početni pomak kako bi cigle bile centrirane horizontalno
    const početniX = (ŠIRINA_CANVASA - ukupnaŠirinaCigli) / 2;
    
    for (let red = 0; red < BROJ_REDOVA_CIGLI; red++) {
        for (let stupac = 0; stupac < BROJ_STUPACA_CIGLI; stupac++) {
            cigle.push({
                x: početniX + stupac * (ŠIRINA_CIGLE + HORIZONTALNI_RAZMAK_CIGLI),
                y: red * (VISINA_CIGLE + VERTIKALNI_RAZMAK_CIGLI) + GORNJA_MARGINA_CIGLI,
                width: ŠIRINA_CIGLE,
                height: VISINA_CIGLE,
                boja: BOJE_CIGLI[red],
                vidljiva: true
            });
        }
    }
}

// Funkcija za primjenu ubrzanja
function primijeniUbrzanje() {
    // Povećaj razinu ubrzanja (do maksimuma)
    loptica.razinaUbrzanja = Math.min(loptica.razinaUbrzanja + 1, MAKSIMALNA_RAZINA_UBRZANJA);
    
    const ubrzanje = RAZINE_UBRZANJA[loptica.razinaUbrzanja];
    loptica.povečanjeBrzine = ubrzanje.ubrzanje;
    loptica.timerUbrzanja = ubrzanje.trajanje;
    
    // Ponovno izračunaj brzinu s novim ubrzanjem
    ažurirajBrzinuLoptice();
    console.log(`Ubrzanje razina ${loptica.razinaUbrzanja + 1}: ${ubrzanje.ubrzanje}x brzine na ${ubrzanje.trajanje/1000} sekundi`);
}

// Funkcija za ažuriranje brzine loptice
function ažurirajBrzinuLoptice() {
    const trenutnaBrzina = loptica.osnovnaBrzina * loptica.povečanjeBrzine;
    const magnitude = Math.sqrt(loptica.brzinaX * loptica.brzinaX + loptica.brzinaY * loptica.brzinaY);
    
    if (magnitude > 0) {
        loptica.brzinaX = (loptica.brzinaX / magnitude) * trenutnaBrzina;
        loptica.brzinaY = (loptica.brzinaY / magnitude) * trenutnaBrzina;
    }
}

// Funkcija za resetiranje ubrzanja
function resetirajUbrzanje() {
    loptica.razinaUbrzanja = -1;
    loptica.povečanjeBrzine = 1.0;
    loptica.timerUbrzanja = 0;
    ažurirajBrzinuLoptice();
}

// Obrada pritisnutih tipki
function obradiPritisnutuTipku(događaj) {
    tipke[događaj.key] = true;
    
    // Pokreni igru pritiskom na space
    if (događaj.key === ' ' && (stanjeIgre === 'izbornik' || stanjeIgre === 'krajIgre' || stanjeIgre === 'pobjeda')) {
        pokreniIgru();
    }
    
    // Praćenje kretanja palice
    if (događaj.key === 'ArrowLeft' || događaj.key === 'a' || događaj.key === 'A') {
        palicaSeMičeLijevo = true;
    }
    if (događaj.key === 'ArrowRight' || događaj.key === 'd' || događaj.key === 'D') {
        palicaSeMičeDesno = true;
    }
    
    // Resetiraj najbolji rezultat pritiskom na 'R'
    if (događaj.key === 'r' || događaj.key === 'R') {
        resetirajNajboljiRezultat();
    }
}

// Obrada otpuštenih tipki
function obradiOtpustenuTipku(događaj) {
    tipke[događaj.key] = false;
    
    if (događaj.key === 'ArrowLeft' || događaj.key === 'a' || događaj.key === 'A') {
        palicaSeMičeLijevo = false;
    }
    if (događaj.key === 'ArrowRight' || događaj.key === 'd' || događaj.key === 'D') {
        palicaSeMičeDesno = false;
    }
}

// Resetiraj najbolji rezultat
function resetirajNajboljiRezultat() {
    najboljiRezultat = 0;
    localStorage.setItem('breakoutNajboljiRezultat', 0);
    console.log('Najbolji rezultat resetiran na 0');
    
    // Ažuriraj prikaz ako je igra u toku
    if (stanjeIgre === 'igranje') {
        nacrtajIgru();
    }
}

// Pokreni igru
function pokreniIgru() {
    stanjeIgre = 'igranje';
    
    // SAKRIJ OVERLAY
    const overlay = document.getElementById('game-overlay');
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
    
    // Resetiraj igru ako je završila
    resetirajIgru();
    resetirajUbrzanje(); // Resetiraj ubrzanje
    
    // Postavi početni smjer loptice (slučajno lijevo ili desno pod 45°)
    const smjer = Math.random() > 0.5 ? 1 : -1;
    loptica.brzinaX = smjer * loptica.osnovnaBrzina * Math.cos(Math.PI / 4); // 45° horizontalno
    loptica.brzinaY = -loptica.osnovnaBrzina * Math.sin(Math.PI / 4); // 45° vertikalno
}

// Glavna petlja igre
function glavnaPetljaIgre() {
    ažurirajStanje();
    nacrtajIgru();
    idAnimacije = requestAnimationFrame(glavnaPetljaIgre);
}

// Ažuriraj stanje igre
function ažurirajStanje() {
    if (stanjeIgre !== 'igranje') return;
    
    // Ažuriraj trajanje ubrzanja
    if (loptica.timerUbrzanja > 0) {
        loptica.timerUbrzanja -= 16;
        
        if (loptica.timerUbrzanja <= 0) {
            // Vrati na normalnu brzinu kada timer istekne
            resetirajUbrzanje();
            console.log('Ubrzanje isteklo - vraćeno na normalnu brzinu');
        }
    }
    
    // Pomakni palicu
    if (palicaSeMičeLijevo) {
        palica.x = Math.max(5, palica.x - BRZINA_PALICE);
    }
    if (palicaSeMičeDesno) {
        palica.x = Math.min(ŠIRINA_CANVASA - palica.width - 5, palica.x + BRZINA_PALICE);
    }
    
    if (loptica.brzinaX === 0 && loptica.brzinaY === 0) {
        loptica.x = palica.x + palica.width / 2 - loptica.veličina / 2;
    }
    
    // Ažuriraj poziciju loptice
    loptica.x += loptica.brzinaX;
    loptica.y += loptica.brzinaY;
    
    // Detekcija kolizije s rubovima
    // Lijevi i desni rub
    if (loptica.x <= 5 || loptica.x + loptica.veličina >= ŠIRINA_CANVASA - 5) {
        loptica.brzinaX = -loptica.brzinaX;
        // Osigurati da loptica ne izađe izvan granica
        loptica.x = Math.max(5, Math.min(loptica.x, ŠIRINA_CANVASA - loptica.veličina - 5));
    }
    
    // Gornji rub
    if (loptica.y <= 5) {
        loptica.brzinaY = -loptica.brzinaY;
        loptica.y = 5;
    }
    
    // Donji rub - kraj igre
    if (loptica.y + loptica.veličina >= VISINA_CANVASA - 5) {
        krajIgre();
        return;
    }
    
    // Detekcija kolizije s palicom
    if (
        loptica.x + loptica.veličina > palica.x &&
        loptica.x < palica.x + palica.width &&
        loptica.y + loptica.veličina > palica.y &&
        loptica.y < palica.y + palica.height
    ) {
        // Odbijanje ovisno o kretanju palice
        if (palicaSeMičeDesno) {
            // Palica ide DESNO → OKRENI smjer u DESNO
            loptica.brzinaX = Math.abs(loptica.osnovnaBrzina * loptica.povečanjeBrzine * Math.cos(Math.PI / 4)); // 45° desno
        } else if (palicaSeMičeLijevo) {
            // Palica ide LIJEVO → OKRENI smjer u LIJEVO
            loptica.brzinaX = -Math.abs(loptica.osnovnaBrzina * loptica.povečanjeBrzine * Math.cos(Math.PI / 4)); // 45° lijevo
        } else {
            // Palica STOJI → NASTAVI isti horizontalni smjer
            // loptica.brzinaX ostaje ista, samo okrenemo Y smjer
        }
        
        // Uvijek ide gore pod 45°
        loptica.brzinaY = -Math.abs(loptica.osnovnaBrzina * loptica.povečanjeBrzine * Math.sin(Math.PI / 4));
        
        // Osigurati da loptica ne uđe u palicu
        loptica.y = palica.y - loptica.veličina;
    }
    
    // Detekcija kolizije s ciglama
    for (let i = 0; i < cigle.length; i++) {
        const cigla = cigle[i];
        
        if (cigla.vidljiva && 
            loptica.x + loptica.veličina > cigla.x &&
            loptica.x < cigla.x + cigla.width &&
            loptica.y + loptica.veličina > cigla.y &&
            loptica.y < cigla.y + cigla.height) {
            
            // Sakrij ciglu
            cigla.vidljiva = false;
            
            // Povećaj rezultat
            rezultat++;
            
            // Ažuriraj najbolji rezultat
            if (rezultat > najboljiRezultat) {
                najboljiRezultat = rezultat;
                localStorage.setItem('breakoutNajboljiRezultat', najboljiRezultat);
            }
            
            // Detektiraj udarac u kut cigle za ubrzanje
            const središteLopticeX = loptica.x + loptica.veličina / 2;
            const središteLopticeY = loptica.y + loptica.veličina / 2;
            const središteCigleX = cigla.x + cigla.width / 2;
            const središteCigleY = cigla.y + cigla.height / 2;
            
            const deltaX = središteLopticeX - središteCigleX;
            const deltaY = središteLopticeY - središteCigleY;
            
            const blizuKuta = Math.abs(deltaX) > cigla.width * 0.4 && 
                                 Math.abs(deltaY) > cigla.height * 0.4;
            
            if (blizuKuta) {
                primijeniUbrzanje();
            }
            
            // odbijanje - samo okreni Y smjer
            loptica.brzinaY = -loptica.brzinaY;
            
            break;
        }
    }
    
    // Provjera pobjede
    const preostaleCigle = cigle.filter(cigla => cigla.vidljiva).length;
    if (preostaleCigle === 0) {
        pobjeda();
        return;
    }
}

// Crtaj igru
function nacrtajIgru() {
    // Očisti canvas
    kontekst.fillStyle = 'black';
    kontekst.fillRect(0, 0, ŠIRINA_CANVASA, VISINA_CANVASA);
    
    // Crtaj cigle
    for (let i = 0; i < cigle.length; i++) {
        const cigla = cigle[i];
        
        if (cigla.vidljiva) {
            // cigla
            kontekst.fillStyle = `rgb(${cigla.boja.r}, ${cigla.boja.g}, ${cigla.boja.b})`;
            kontekst.fillRect(cigla.x, cigla.y, cigla.width, cigla.height);
            
            // 3D efekt - svjetliji gornji i lijevi rub
            kontekst.strokeStyle = `rgb(${Math.min(cigla.boja.r + 50, 255)}, ${Math.min(cigla.boja.g + 50, 255)}, ${Math.min(cigla.boja.b + 50, 255)})`;
            kontekst.lineWidth = 2;
            kontekst.beginPath();
            kontekst.moveTo(cigla.x, cigla.y);
            kontekst.lineTo(cigla.x + cigla.width, cigla.y);
            kontekst.lineTo(cigla.x + cigla.width, cigla.y + cigla.height);
            kontekst.stroke();
            
            // 3D efekt - tamniji donji i desni rub
            kontekst.strokeStyle = `rgb(${Math.max(cigla.boja.r - 50, 0)}, ${Math.max(cigla.boja.g - 50, 0)}, ${Math.max(cigla.boja.b - 50, 0)})`;
            kontekst.beginPath();
            kontekst.moveTo(cigla.x, cigla.y);
            kontekst.lineTo(cigla.x, cigla.y + cigla.height);
            kontekst.lineTo(cigla.x + cigla.width, cigla.y + cigla.height);
            kontekst.stroke();
        }
    }
    
    // Crtaj palicu
    kontekst.fillStyle = 'white';
    kontekst.fillRect(palica.x, palica.y, palica.width, palica.height);
    
    // 3D efekt za palicu - svjetliji gornji rub
    kontekst.strokeStyle = '#cccccc';
    kontekst.lineWidth = 2;
    kontekst.beginPath();
    kontekst.moveTo(palica.x, palica.y);
    kontekst.lineTo(palica.x + palica.width, palica.y);
    kontekst.stroke();
    
    // 3D efekt za palicu - tamniji donji rub
    kontekst.strokeStyle = '#666666';
    kontekst.beginPath();
    kontekst.moveTo(palica.x, palica.y + palica.height);
    kontekst.lineTo(palica.x + palica.width, palica.y + palica.height);
    kontekst.stroke();
    
    // Crtaj lopticu
    kontekst.fillStyle = 'white';
    kontekst.fillRect(loptica.x, loptica.y, loptica.veličina, loptica.veličina);
    
    // Vizualni efekt za ubrzanu lopticu
    if (loptica.timerUbrzanja > 0) {
        kontekst.strokeStyle = `rgba(255, 255, 0, ${0.5 + 0.3 * Math.sin(Date.now() / 200)})`;
        kontekst.lineWidth = 2;
        kontekst.beginPath();
        kontekst.rect(loptica.x - 3, loptica.y - 3, loptica.veličina + 6, loptica.veličina + 6);
        kontekst.stroke();
    }
    
    // 3D efekt za lopticu - svjetliji gornji lijevi kut
    kontekst.strokeStyle = '#cccccc';
    kontekst.lineWidth = 1;
    kontekst.beginPath();
    kontekst.moveTo(loptica.x, loptica.y);
    kontekst.lineTo(loptica.x + loptica.veličina, loptica.y);
    kontekst.lineTo(loptica.x + loptica.veličina, loptica.y + loptica.veličina);
    kontekst.stroke();
    
    // 3D efekt za lopticu - tamniji donji desni kut
    kontekst.strokeStyle = '#666666';
    kontekst.beginPath();
    kontekst.moveTo(loptica.x, loptica.y);
    kontekst.lineTo(loptica.x, loptica.y + loptica.veličina);
    kontekst.lineTo(loptica.x + loptica.veličina, loptica.y + loptica.veličina);
    kontekst.stroke();
    
    // Ispiši trenutni rezultat
    kontekst.font = 'bold 20px Helvetica, Verdana, sans-serif';
    kontekst.fillStyle = 'white';
    kontekst.textAlign = 'left';
    kontekst.fillText(`Score: ${rezultat}`, 20, 30);
    
    // Ispiši najbolji rezultat
    kontekst.textAlign = 'right';
    kontekst.fillText(`Best score: ${najboljiRezultat}`, ŠIRINA_CANVASA - 100, 30);
    
    // Prikaz razine ubrzanja ako je aktivan
    if (loptica.timerUbrzanja > 0) {
        kontekst.textAlign = 'center';
        kontekst.fillStyle = 'yellow';
        kontekst.fillText(`SPEED: ${loptica.povečanjeBrzine.toFixed(1)}x`, ŠIRINA_CANVASA / 2, 30);
    }
}

// Kraj igre
function krajIgre() {
    stanjeIgre = 'krajIgre';
    const overlay = document.getElementById('game-overlay');
    overlay.innerHTML = `
        <div id="game-over">KRAJ IGRE</div>
        <div class="subtitle" style="margin-top: 20px;">Rezultat: ${rezultat}</div>
        <div class="subtitle">Najbolji rezultat: ${najboljiRezultat}</div>
        <div class="subtitle" style="margin-top: 20px;">Pritisni RAZMAK za novu igru</div>
        <div class="subtitle" style="margin-top: 10px; font-size: 14px;">Pritisni R za reset najboljeg rezultata</div>
    `;
    overlay.classList.remove('hidden');
}

// Pobjeda
function pobjeda() {
    stanjeIgre = 'pobjeda';
    const overlay = document.getElementById('game-overlay');
    overlay.innerHTML = `
        <div id="victory">POBJEDA!</div>
        <div class="subtitle" style="margin-top: 20px;">Rezultat: ${rezultat}</div>
        <div class="subtitle">Najbolji rezultat: ${najboljiRezultat}</div>
        <div class="subtitle" style="margin-top: 20px;">Pritisni RAZMAK za novu igru</div>
        <div class="subtitle" style="margin-top: 10px; font-size: 14px;">Pritisni R za reset najboljeg rezultata</div>
    `;
    overlay.classList.remove('hidden');
}

// Pokreni igru kada se stranica učita
window.onload = inicijalizirajIgru;
