/* ============================================================
   TAROT FRANÇAIS — moteur de jeu 3 / 4 / 5 joueurs
   ============================================================ */

/* ---------------- Cartes ---------------- */
const COULEURS = ['pique', 'coeur', 'carreau', 'trefle'];
const SYMBOLE = { pique:'\u2660', coeur:'\u2665', carreau:'\u2666', trefle:'\u2663' };
const NOM_COULEUR = { pique:'Pique', coeur:'C\u0153ur', carreau:'Carreau', trefle:'Tr\u00e8fle' };
const NOM_RANG = { 1:'As',11:'Valet',12:'Cavalier',13:'Dame',14:'Roi' };
const CONTRATS = [
  { id:'petite',       nom:'Petite',       mult:1 },
  { id:'garde',        nom:'Garde',        mult:2 },
  { id:'garde_sans',   nom:'Garde sans le chien',   mult:4 },
  { id:'garde_contre', nom:'Garde contre le chien', mult:6 },
];
const NOMS_BOTS = ['Irma', 'Basile', 'Colette', 'Marius'];

function creerPaquet() {
  const p = [];
  for (let v = 1; v <= 21; v++)
    p.push({ id:'A'+v, type:'atout', valeur:v,
             pts:(v===1||v===21)?4.5:0.5, img:'atout_'+v,
             nom:'Atout '+v + (v===1?' (le Petit)':v===21?' (le 21)':'') });
  p.push({ id:'EX', type:'excuse', pts:4.5, img:'excuse', nom:"L'Excuse" });
  for (const c of COULEURS)
    for (let r = 1; r <= 14; r++)
      p.push({ id:c[0].toUpperCase()+r, type:'couleur', couleur:c, rang:r,
               pts: r===14?4.5 : r===13?3.5 : r===12?2.5 : r===11?1.5 : 0.5,
               img: c + '_' + (r<=10 ? r : {11:'valet',12:'cavalier',13:'dame',14:'roi'}[r]),
               nom: (NOM_RANG[r] || r) + ' de ' + NOM_COULEUR[c] });
  return p;
}

function melanger(t) {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

function triMain(m) {
  const cle = c => c.type==='excuse' ? 1000
    : c.type==='atout' ? 500 + c.valeur
    : COULEURS.indexOf(c.couleur) * 20 + c.rang;
  return m.sort((a,b) => cle(a) - cle(b));
}

/* ---------------- État ---------------- */
let S = null;

function nouvellePartie(n) {
  S = {
    n, joueurs: [], donneur: Math.floor(Math.random()*n),
    cumul: chargerCumul(n),
  };
  for (let i = 0; i < n; i++)
    S.joueurs.push({ i, nom: i===0 ? 'Toi' : NOMS_BOTS[i-1], humain: i===0, main: [] });
  montrerEcran('jeu');
  nouvelleDonne();
}

function nouvelleDonne() {
  S.donneur = (S.donneur + 1) % S.n;
  S.phase = 'encheres';
  S.preneur = -1; S.contrat = null; S.partenaire = -1; S.carteAppelee = null;
  S.partenaireRevele = false;
  S.pileAttaque = []; S.pileDefense = []; S.ajust = 0;
  S.pli = []; S.entameur = (S.donneur + 1) % S.n;
  S.numPli = 0; S.petitAuBout = null;

  const paquet = melanger(creerPaquet());
  const tChien = S.n === 5 ? 3 : 6;
  S.chien = paquet.slice(0, tChien);
  const reste = paquet.slice(tChien);
  const parJoueur = reste.length / S.n;
  S.joueurs.forEach((j, i) => { j.main = triMain(reste.slice(i*parJoueur, (i+1)*parJoueur)); });
  S.nbPlisTotal = parJoueur; // avant écart, taille de main = nb de plis

  majTable();
  bandeau('Enchères — donneur : ' + S.joueurs[S.donneur].nom);
  S.tourEnchere = (S.donneur + 1) % S.n;
  S.meilleure = -1; // index dans CONTRATS
  S.parlé = 0;
  setTimeout(tourEnchere, 600);
}

/* ---------------- Enchères ---------------- */
function forceMain(main) {
  const atouts = main.filter(c => c.type==='atout');
  const bouts = main.filter(c => c.id==='A1'||c.id==='A21'||c.id==='EX').length;
  const rois = main.filter(c => c.type==='couleur' && c.rang===14).length;
  const dames = main.filter(c => c.type==='couleur' && c.rang===13).length;
  const gros = atouts.filter(c => c.valeur >= 16).length;
  let f = atouts.length + bouts*4 + rois*2 + dames + gros;
  if (atouts.length >= main.length/2.4) f += 3;
  return f * (18 / main.length); // normalise selon la taille de main
}

function contratBot(main) {
  const f = forceMain(main) + (Math.random()*2 - 1);
  if (f >= 30) return 3;
  if (f >= 24) return 2;
  if (f >= 19) return 1;
  if (f >= 14.5) return 0;
  return -1;
}

function tourEnchere() {
  if (S.parlé === S.n) return finEncheres();
  const j = S.joueurs[S.tourEnchere];
  marquerActif(j.i);
  if (j.humain) {
    afficherEncheresHumain();
  } else {
    const max = contratBot(j.main);
    let choix = -1;
    if (max > S.meilleure) choix = S.meilleure + 1 <= max ? S.meilleure + 1 : -1;
    setTimeout(() => {
      if (choix >= 0) { S.meilleure = choix; S.preneur = j.i; bulle(j.i, CONTRATS[choix].nom); }
      else bulle(j.i, 'Passe');
      S.parlé++; S.tourEnchere = (S.tourEnchere + 1) % S.n;
      setTimeout(tourEnchere, 750);
    }, 700);
  }
}

function afficherEncheresHumain() {
  const zone = document.getElementById('ench-btns');
  const info = document.getElementById('ench-info');
  info.textContent = S.meilleure < 0 ? 'Personne n\u2019a encore pris.'
    : 'Enchère en cours : ' + CONTRATS[S.meilleure].nom + ' (' + S.joueurs[S.preneur].nom + ')';
  let html = '<button class="btn contour" onclick="enchereHumain(-1)">Passer</button>';
  for (let i = S.meilleure + 1; i < CONTRATS.length; i++)
    html += `<button class="btn plein" onclick="enchereHumain(${i})">${CONTRATS[i].nom}</button>`;
  zone.innerHTML = html;
  voile('v-encheres', true);
}

function enchereHumain(i) {
  voile('v-encheres', false);
  if (i >= 0) { S.meilleure = i; S.preneur = 0; bulle(0, CONTRATS[i].nom); }
  else bulle(0, 'Passe');
  S.parlé++; S.tourEnchere = (S.tourEnchere + 1) % S.n;
  setTimeout(tourEnchere, 650);
}

function finEncheres() {
  marquerActif(-1);
  if (S.meilleure < 0) {
    messageTapis('Tout le monde passe.\nOn redonne\u2026');
    setTimeout(() => { messageTapis(null); nouvelleDonne(); }, 1600);
    return;
  }
  S.contrat = CONTRATS[S.meilleure];
  bandeau(S.joueurs[S.preneur].nom + ' joue une ' + S.contrat.nom);
  majTable();
  if (S.n === 5) return phaseAppelRoi();
  phaseChien();
}

/* ---------------- Appel du roi (5 joueurs) ---------------- */
function phaseAppelRoi() {
  const p = S.joueurs[S.preneur];
  if (p.humain) {
    const zone = document.getElementById('rois-choix');
    const rois = p.main.filter(c => c.type==='couleur' && c.rang===14).length;
    const rang = rois === 4 ? 13 : 14; // 4 rois en main -> appelle une dame
    zone.innerHTML = COULEURS.map(c => {
      const img = c + '_' + (rang===14?'roi':'dame');
      return `<div class="carte moy" onclick="choisirRoi('${c}',${rang})"><img src="cartes/${img}.webp"></div>`;
    }).join('');
    voile('v-roi', true);
  } else {
    // bot : appelle le roi de sa couleur la plus longue où il n'a pas le roi
    const rois = p.main.filter(c => c.type==='couleur' && c.rang===14).length;
    const rang = rois === 4 ? 13 : 14;
    let meilleur = null, score = -1;
    for (const c of COULEURS) {
      const aLaCarte = p.main.some(x => x.type==='couleur' && x.couleur===c && x.rang===rang);
      if (aLaCarte && rang===14) continue;
      const long = p.main.filter(x => x.type==='couleur' && x.couleur===c).length;
      if (long > score) { score = long; meilleur = c; }
    }
    choisirRoi(meilleur || 'pique', rang);
  }
}

function choisirRoi(couleur, rang) {
  voile('v-roi', false);
  S.carteAppelee = { couleur, rang };
  S.partenaire = S.joueurs.findIndex(j =>
    j.main.some(c => c.type==='couleur' && c.couleur===couleur && c.rang===rang));
  if (S.partenaire === S.preneur) S.partenaireRevele = true; // preneur seul, révélé de fait à la fin
  const nomCarte = (rang===14?'Roi':'Dame') + ' de ' + NOM_COULEUR[couleur];
  bandeau(S.joueurs[S.preneur].nom + ' appelle : ' + nomCarte);
  messageTapis(S.joueurs[S.preneur].nom + ' appelle le\n' + nomCarte);
  setTimeout(() => { messageTapis(null); phaseChien(); }, 1700);
}

/* ---------------- Chien & écart ---------------- */
function phaseChien() {
  const id = S.contrat.id;
  if (id === 'garde_sans') { S.pileAttaque.push(...S.chien); bandeau('Chien conservé face cachée (Garde sans)'); return debuterJeu(); }
  if (id === 'garde_contre') { S.pileDefense.push(...S.chien); bandeau('Chien à la défense (Garde contre)'); return debuterJeu(); }

  // Petite / Garde : montrer le chien à tous
  const zone = document.getElementById('chien-cartes');
  zone.innerHTML = S.chien.map(c => `<div class="carte moy"><img src="cartes/${c.img}.webp"></div>`).join('');
  document.getElementById('chien-info').textContent =
    S.joueurs[S.preneur].nom + ' ramasse le chien et doit écarter ' + S.chien.length + ' cartes.';
  document.getElementById('chien-ok').onclick = () => { voile('v-chien', false); ramasserChien(); };
  voile('v-chien', true);
}

function ramasserChien() {
  const p = S.joueurs[S.preneur];
  p.main = triMain(p.main.concat(S.chien));
  const taille = S.n === 5 ? 3 : 6;
  if (p.humain) {
    S.phase = 'ecart'; S.ecartChoix = [];
    majTable();
    infoMoi('Choisis ' + taille + ' cartes à écarter (ni roi, ni atout, ni Excuse), puis valide.');
    afficherBoutonEcart(taille);
  } else {
    p.main = triMain(p.main);
    const ecart = ecartBot(p.main, taille);
    ecart.forEach(c => { p.main.splice(p.main.indexOf(c), 1); });
    S.pileAttaque.push(...ecart);
    majTable();
    debuterJeu();
  }
}

function ecartable(c, main, strict = true) {
  if (c.type === 'excuse') return false;
  if (c.type === 'couleur' && c.rang === 14) return false;
  if (c.type === 'atout') {
    if (strict) return false;
    return c.valeur !== 1 && c.valeur !== 21; // jamais les bouts
  }
  return true;
}

function ecartBot(main, taille) {
  let cand = main.filter(c => ecartable(c, main, true));
  if (cand.length < taille)
    cand = cand.concat(main.filter(c => c.type==='atout' && ecartable(c, main, false)));
  // vider les couleurs courtes d'abord, puis petites cartes
  const longueur = {}; COULEURS.forEach(c => longueur[c] = main.filter(x => x.couleur===c).length);
  cand.sort((a,b) => {
    const la = a.type==='atout' ? 99 : longueur[a.couleur];
    const lb = b.type==='atout' ? 99 : longueur[b.couleur];
    if (la !== lb) return la - lb;
    if (a.pts !== b.pts) return a.pts - b.pts;
    return (a.rang||a.valeur) - (b.rang||b.valeur);
  });
  return cand.slice(0, taille);
}

function afficherBoutonEcart(taille) {
  const info = document.getElementById('info-moi');
  info.innerHTML = `<span id="ecart-txt"></span> <button class="btn plein" id="btn-ecart" style="padding:8px 16px" disabled>Écarter</button>`;
  majEcartInfo(taille);
  document.getElementById('btn-ecart').onclick = () => validerEcart();
}

function majEcartInfo(taille) {
  const t = document.getElementById('ecart-txt');
  if (t) t.textContent = 'Écart : ' + S.ecartChoix.length + ' / ' + taille;
  const b = document.getElementById('btn-ecart');
  if (b) b.disabled = S.ecartChoix.length !== taille;
}

function clicEcart(idx) {
  const p = S.joueurs[0];
  const c = p.main[idx];
  const taille = S.n === 5 ? 3 : 6;
  const strict = p.main.filter(x => ecartable(x, p.main, true)).length >= taille;
  if (!ecartable(c, p.main, strict)) return;
  const k = S.ecartChoix.indexOf(c);
  if (k >= 0) S.ecartChoix.splice(k, 1);
  else if (S.ecartChoix.length < taille) S.ecartChoix.push(c);
  majMainHumaine();
  majEcartInfo(taille);
}

function validerEcart() {
  const p = S.joueurs[0];
  S.ecartChoix.forEach(c => p.main.splice(p.main.indexOf(c), 1));
  S.pileAttaque.push(...S.ecartChoix);
  S.ecartChoix = [];
  debuterJeu();
}

/* ---------------- Jeu des plis ---------------- */
function debuterJeu() {
  S.phase = 'jeu';
  S.nbPlisTotal = S.joueurs[0].main.length;
  S.tour = S.entameur;
  majTable();
  infoMoi('');
  bandeau(S.contrat.nom + ' — ' + S.joueurs[S.preneur].nom + (S.n===5 && S.carteAppelee ?
    ' · appel : ' + (S.carteAppelee.rang===14?'Roi':'Dame') + ' de ' + NOM_COULEUR[S.carteAppelee.couleur] : ''));
  setTimeout(jouerTour, 700);
}

function campDe(i) {
  return (i === S.preneur || i === S.partenaire) ? 'A' : 'D';
}

function demandee(pli) {
  const c = pli.find(p => p.carte.type !== 'excuse');
  return c ? c.carte : null;
}

function atoutMaxPli(pli) {
  let m = 0;
  for (const p of pli) if (p.carte.type==='atout' && p.carte.valeur > m) m = p.carte.valeur;
  return m;
}

function coupsLegaux(main, pli) {
  const excuses = main.filter(c => c.type==='excuse');
  const dem = demandee(pli);
  if (!dem) return main.slice(); // ouvre le pli (ou après excuse seule) : tout est permis
  const autres = main.filter(c => c.type !== 'excuse');
  const amax = atoutMaxPli(pli);
  let jouables;
  if (dem.type === 'atout') {
    const atouts = autres.filter(c => c.type==='atout');
    if (atouts.length) {
      const sup = atouts.filter(c => c.valeur > amax);
      jouables = sup.length ? sup : atouts;
    } else jouables = autres;
  } else {
    const suite = autres.filter(c => c.type==='couleur' && c.couleur===dem.couleur);
    if (suite.length) jouables = suite;
    else {
      const atouts = autres.filter(c => c.type==='atout');
      if (atouts.length) {
        const sup = atouts.filter(c => c.valeur > amax);
        jouables = sup.length ? sup : atouts;
      } else jouables = autres;
    }
  }
  return jouables.concat(excuses);
}

function gagnantPli(pli) {
  let best = null;
  for (const p of pli) {
    const c = p.carte;
    if (c.type === 'excuse') continue;
    if (!best) { best = p; continue; }
    const b = best.carte;
    if (c.type==='atout' && (b.type!=='atout' || c.valeur > b.valeur)) best = p;
    else if (c.type==='couleur' && b.type==='couleur' && c.couleur===b.couleur && c.rang > b.rang) best = p;
  }
  return best ? best.j : pli[0].j;
}

function jouerTour() {
  if (S.phase !== 'jeu') return;
  marquerActif(S.tour);
  const j = S.joueurs[S.tour];
  if (j.humain) {
    infoMoi('À toi de jouer — touche une carte, puis confirme.');
    majMainHumaine();
  } else {
    setTimeout(() => {
      const c = choixBot(j);
      poserCarte(j.i, c);
    }, 800);
  }
}

function choixBot(j) {
  const L = coupsLegaux(j.main, S.pli);
  const nonEx = L.filter(c => c.type!=='excuse');
  const dernierDuPli = S.pli.length === S.n - 1;
  const dernierPli = S.nbPlisTotal - S.numPli === 1;

  // jouer l'Excuse sur un gros pli imprenable (jamais au dernier pli)
  if (L.some(c => c.type==='excuse') && !dernierPli && S.pli.length > 0) {
    const ptsPli = S.pli.reduce((s,p) => s + p.carte.pts, 0);
    const gagne = nonEx.filter(c => gagneAvec(c, j.i));
    if (!gagne.length && ptsPli >= 4 && j.main.length > 1)
      return L.find(c => c.type==='excuse');
  }
  if (!nonEx.length) return L[0];

  if (S.pli.length === 0) {
    // entame : petite couleur, ou gros atout si main d'atouts
    const couleurs = nonEx.filter(c => c.type==='couleur');
    if (couleurs.length) return couleurs.reduce((a,b) => cmpFaible(a,b) < 0 ? a : b);
    return nonEx.reduce((a,b) => cmpFaible(a,b) < 0 ? a : b);
  }

  const gAct = gagnantPli(S.pli);
  const monCamp = campDe(j.i), campG = campDe(gAct);
  const gagnantes = nonEx.filter(c => gagneAvec(c, j.i));

  if (campG === monCamp && S.pli.length >= (dernierDuPli ? 1 : 2)) {
    // le camp tient le pli : charger en points si dernier à parler, sinon petite carte
    if (dernierDuPli) {
      const charge = nonEx.filter(c => c.pts >= 1.5 && !gagneAvec(c, j.i));
      if (charge.length) return charge.reduce((a,b) => a.pts > b.pts ? a : b);
    }
    return nonEx.reduce((a,b) => cmpDefausse(a,b) < 0 ? a : b);
  }
  if (gagnantes.length) return gagnantes.reduce((a,b) => cmpFaible(a,b) < 0 ? a : b);
  return nonEx.reduce((a,b) => cmpDefausse(a,b) < 0 ? a : b);
}

function gagneAvec(c, ji) {
  const pli2 = S.pli.concat([{ j: ji, carte: c }]);
  return gagnantPli(pli2) === ji;
}
function cmpFaible(a, b) {
  const va = a.type==='atout' ? 100 + a.valeur : a.rang + (a.pts*2);
  const vb = b.type==='atout' ? 100 + b.valeur : b.rang + (b.pts*2);
  return va - vb;
}
function cmpDefausse(a, b) { // défausser d'abord peu de points, petites cartes
  if (a.pts !== b.pts) return a.pts - b.pts;
  return cmpFaible(a, b);
}

let selHumain = -1;
function clicCarteHumain(idx) {
  if (S.phase === 'ecart') return clicEcart(idx);
  if (S.phase !== 'jeu' || S.tour !== 0) return;
  const j = S.joueurs[0];
  const L = coupsLegaux(j.main, S.pli);
  const c = j.main[idx];
  if (!L.includes(c)) return;
  if (selHumain === idx) { selHumain = -1; poserCarte(0, c); }
  else { selHumain = idx; majMainHumaine(); infoMoi(c.nom + ' — touche à nouveau pour jouer.'); }
}

function poserCarte(ji, carte) {
  const j = S.joueurs[ji];
  j.main.splice(j.main.indexOf(carte), 1);
  S.pli.push({ j: ji, carte });
  selHumain = -1;
  // révélation du partenaire
  if (S.n===5 && S.carteAppelee && carte.type==='couleur' &&
      carte.couleur===S.carteAppelee.couleur && carte.rang===S.carteAppelee.rang && !S.partenaireRevele) {
    S.partenaireRevele = true;
    bulle(ji, 'Partenaire !');
  }
  majTable(); majPli();
  if (S.pli.length === S.n) setTimeout(finPli, 900);
  else { S.tour = (S.tour + 1) % S.n; jouerTour(); }
}

function finPli() {
  marquerActif(-1);
  const g = gagnantPli(S.pli);
  const campG = campDe(g);
  const dernier = (S.nbPlisTotal - S.numPli === 1);

  for (const p of S.pli) {
    const c = p.carte;
    if (c.type === 'excuse' && !dernier) {
      const campEx = campDe(p.j);
      (campEx === 'A' ? S.pileAttaque : S.pileDefense).push(c);
      if (campEx !== campG) S.ajust += campEx === 'A' ? -0.5 : 0.5; // rend une basse carte
    } else {
      (campG === 'A' ? S.pileAttaque : S.pileDefense).push(c);
    }
    if (c.id === 'A1' && dernier) S.petitAuBout = campG;
  }

  S.numPli++;
  bulle(g, 'Pli pour moi');
  setTimeout(() => {
    S.pli = []; majPli();
    if (S.numPli === S.nbPlisTotal) return finDonne();
    S.tour = g; S.entameurPli = g;
    jouerTour();
  }, 900);
}

/* ---------------- Comptage ---------------- */
function finDonne() {
  S.phase = 'fin';
  let ptsA = S.pileAttaque.reduce((s,c) => s + c.pts, 0) + S.ajust;
  const bouts = S.pileAttaque.filter(c => c.id==='A1'||c.id==='A21'||c.id==='EX').length;
  const seuil = [56, 51, 41, 36][bouts];
  const ecart = ptsA - seuil;
  const reussi = ecart >= 0;
  const base = 25 + Math.ceil(Math.abs(ecart));
  let bonusPetit = 0;
  if (S.petitAuBout) bonusPetit = (S.petitAuBout === 'A' ? 10 : -10);
  const score = (reussi ? 1 : -1) * base * S.contrat.mult + bonusPetit * S.contrat.mult;

  // répartition
  const delta = new Array(S.n).fill(0);
  const seul = S.n===5 && S.partenaire === S.preneur;
  if (S.n === 5 && !seul) {
    for (let i = 0; i < S.n; i++) {
      if (i === S.preneur) delta[i] = 2*score;
      else if (i === S.partenaire) delta[i] = score;
      else delta[i] = -score;
    }
  } else {
    for (let i = 0; i < S.n; i++)
      delta[i] = i === S.preneur ? (S.n-1)*score : -score;
  }
  delta.forEach((d,i) => S.cumul[i] += d);
  sauverCumul();

  // affichage
  document.getElementById('fin-titre').textContent =
    (reussi ? 'Contrat réussi !' : 'Contrat chuté…');
  document.getElementById('fin-titre').className = reussi ? 'gagne' : 'perdu';
  const nomP = S.joueurs[S.preneur].nom;
  let det = `${nomP} (${S.contrat.nom}) : <b>${arrondi(ptsA)} points</b> avec ${bouts} bout${bouts>1?'s':''} (il en fallait ${seuil}).`;
  if (S.n===5) det += seul ? `<br>${nomP} jouait seul.` :
    `<br>Partenaire : ${S.joueurs[S.partenaire].nom}.`;
  if (S.petitAuBout) det += `<br>Petit au bout pour ${S.petitAuBout==='A'?"l'attaque":'la défense'} (±10).`;
  document.getElementById('fin-detail').innerHTML = det;

  document.getElementById('fin-table').innerHTML =
    S.joueurs.map((j,i) => `<tr><td>${j.nom}${i===S.preneur?' ✦':''}${(S.n===5&&i===S.partenaire&&!seul)?' ✧':''}</td>
      <td class="${delta[i]>=0?'gagne':'perdu'}">${delta[i]>=0?'+':''}${delta[i]}</td>
      <td>${S.cumul[i]}</td></tr>`).join('') +
    `<tr class="tot"><td colspan="3" style="text-align:center;font-size:11px">✦ preneur · ✧ partenaire · dernière colonne : total</td></tr>`;
  voile('v-fin', true);
}

function arrondi(x) { return Math.round(x*2)/2; }

function donneSuivante() { voile('v-fin', false); nouvelleDonne(); }

/* ---------------- Scores cumulés ---------------- */
function chargerCumul(n) {
  try {
    const d = JSON.parse(localStorage.getItem('tarot_cumul_' + n));
    if (Array.isArray(d) && d.length === n) return d;
  } catch(e) {}
  return new Array(n).fill(0);
}
function sauverCumul() {
  try { localStorage.setItem('tarot_cumul_' + S.n, JSON.stringify(S.cumul)); } catch(e) {}
}
function razScores() {
  try { [3,4,5].forEach(n => localStorage.removeItem('tarot_cumul_' + n)); } catch(e) {}
  majMenuScores();
}
function majMenuScores() {
  const zone = document.getElementById('scores-cumul');
  let html = '';
  for (const n of [3,4,5]) {
    const d = chargerCumul(n);
    if (d.some(x => x !== 0))
      html += `À ${n} joueurs — toi : <b>${d[0]}</b> pts<br>`;
  }
  zone.innerHTML = html || 'Bienvenue à la table.';
}

/* ---------------- Affichage ---------------- */
function montrerEcran(id) {
  document.querySelectorAll('.ecran').forEach(e => e.classList.remove('on'));
  document.getElementById(id).classList.add('on');
}
function allerMenu() {
  document.querySelectorAll('.voile').forEach(v => v.classList.remove('on'));
  majMenuScores();
  montrerEcran('menu');
  S && (S.phase = 'menu');
}
function voile(id, on) { document.getElementById(id).classList.toggle('on', on); }
function bandeau(t) { document.getElementById('bandeau').textContent = t; }
function infoMoi(t) { document.getElementById('info-moi').textContent = t; }
function messageTapis(t) {
  const m = document.getElementById('message-tapis');
  if (t == null) { m.classList.remove('on'); m.textContent=''; }
  else { m.textContent = t; m.classList.add('on'); }
}

function majTable() {
  const zone = document.getElementById('adversaires');
  zone.innerHTML = S.joueurs.slice(1).map(j => {
    let badges = '';
    if (j.i === S.preneur && S.contrat) badges += '<span class="badge preneur">Preneur</span>';
    if (S.n===5 && S.partenaireRevele && j.i === S.partenaire && j.i !== S.preneur)
      badges += '<span class="badge partenaire">Partenaire</span>';
    if (j.i === S.donneur) badges += '<span class="badge donneur">Donne</span>';
    return `<div class="adv" id="adv-${j.i}">
      <div class="avatar">${j.nom[0]}</div>
      <div class="nom">${j.nom}</div>
      <div class="nbc">${j.main.length} carte${j.main.length>1?'s':''}</div>
      ${badges}</div>`;
  }).join('');
  // badges du joueur humain dans info si preneur
  majMainHumaine();
}

function majMainHumaine() {
  const zone = document.getElementById('main');
  const j = S.joueurs[0];
  let legales = null;
  if (S.phase === 'jeu' && S.tour === 0) legales = coupsLegaux(j.main, S.pli);
  const taille = S.n === 5 ? 3 : 6;
  const strict = S.phase==='ecart' ? j.main.filter(x => ecartable(x, j.main, true)).length >= taille : true;

  zone.innerHTML = j.main.map((c, idx) => {
    let cls = 'carte';
    if (S.phase === 'jeu' && S.tour === 0) {
      cls += legales.includes(c) ? ' jouable' : ' inerte';
      if (idx === selHumain) cls += ' levee';
    } else if (S.phase === 'ecart') {
      cls += ecartable(c, j.main, strict) ? ' jouable' : ' inerte';
      if (S.ecartChoix.includes(c)) cls += ' choisie-ecart';
    }
    return `<div class="${cls}" onclick="clicCarteHumain(${idx})"><img src="cartes/${c.img}.webp"></div>`;
  }).join('');
}

function majPli() {
  document.getElementById('pli').innerHTML = S.pli.map(p =>
    `<div class="pose"><div class="carte moy"><img src="cartes/${p.carte.img}.webp"></div>
     <div class="qui">${S.joueurs[p.j].nom}</div></div>`).join('');
}

function marquerActif(i) {
  document.querySelectorAll('.adv').forEach(e => e.classList.remove('actif'));
  if (i > 0) {
    const e = document.getElementById('adv-' + i);
    if (e) e.classList.add('actif');
  }
  if (i === 0) infoMoi('À toi de jouer…');
}

let bulles = {};
function bulle(i, txt) {
  if (i === 0) { infoMoi('Toi : ' + txt); setTimeout(() => { if (S.phase==='encheres') infoMoi(''); }, 1200); return; }
  const adv = document.getElementById('adv-' + i);
  if (!adv) return;
  const old = adv.querySelector('.bulle');
  if (old) old.remove();
  const b = document.createElement('div');
  b.className = 'bulle'; b.textContent = txt;
  adv.appendChild(b);
  clearTimeout(bulles[i]);
  bulles[i] = setTimeout(() => b.remove(), 1600);
}

/* ---------------- Retour Android ---------------- */
window.appBack = function () {
  if (document.getElementById('menu').classList.contains('on')) return 'exit';
  allerMenu();
  return 'ok';
};

majMenuScores();
