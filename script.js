/**********************************
 * Variables et initialisations
 **********************************/
let currentLine = "";          // Ligne ferroviaire en cours
let dataArray = [];            // Tableau principal des données
let lastInsertTimestamp = 0;   // Pour gérer le blocage anti-doublon (clic multiple)
let lineChangeCount = 0;       // Pour insérer un "séparateur" visuel lors du changement de ligne

// Sélecteurs DOM
const lineSelectionOverlay = document.getElementById("lineSelectionOverlay");
const initialLineSelect = document.getElementById("initialLineSelect");
const confirmLineBtn = document.getElementById("confirmLineBtn");
const currentLineBanner = document.getElementById("currentLineBanner");
const currentLineSpan = document.getElementById("currentLine");
const changeLineBtn = document.getElementById("changeLineBtn");

const formSection = document.getElementById("formSection");
const treeForm = document.getElementById("treeForm");

const pkDebutInput = document.getElementById("pkDebut");
const pkFinInput = document.getElementById("pkFin");
const voieSelect = document.getElementById("voieSelect");
const distanceVoieInput = document.getElementById("distanceVoie");
const nbArbresInput = document.getElementById("nbArbres");
const proprietaireSelect = document.getElementById("proprietaireSelect");
const decisionSelect = document.getElementById("decisionSelect");

const arbreMortRadio = document.getElementById("arbreMort");
const arbreVivantRadio = document.getElementById("arbreVivant");
const checkStabilite = document.getElementById("checkStabilite");
const checkMaladie = document.getElementById("checkMaladie");
const commentaireInput = document.getElementById("commentaire");

const submitBtn = document.getElementById("submitBtn");

const dataTable = document.getElementById("dataTable").querySelector("tbody");

const exportExcelBtn = document.getElementById("exportExcelBtn");
const resetDataBtn = document.getElementById("resetDataBtn");
const resetOverlay = document.getElementById("resetOverlay");
const confirmResetBtn = document.getElementById("confirmResetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

const darkModeToggle = document.getElementById("darkModeToggle");

/**********************************
 * Au chargement: affichage pop-up
 **********************************/
window.addEventListener("load", () => {
  // Charger depuis localStorage s'il y a des données
  loadDataFromLocalStorage();
  renderTable();

  // Si currentLine est déjà stocké, on remet l'overlay en display: none
  // Sinon, on montre la pop-up de sélection
  if (!currentLine) {
    lineSelectionOverlay.style.display = "flex";
  } else {
    lineSelectionOverlay.style.display = "none";
    currentLineBanner.style.display = "flex";
    currentLineSpan.textContent = currentLine;
  }
});

/**********************************
 * Confirmation de la ligne initiale
 **********************************/
confirmLineBtn.addEventListener("click", () => {
  const selectedLine = initialLineSelect.value;
  if (!selectedLine) {
    alert("Veuillez sélectionner une ligne !");
    return;
  }
  currentLine = selectedLine;
  currentLineSpan.textContent = currentLine;
  currentLineBanner.style.display = "flex";
  lineSelectionOverlay.style.display = "none";

  // Sauvegarder la ligne en cours dans localStorage
  saveDataToLocalStorage();
});

/**********************************
 * Bouton pour changer de ligne
 **********************************/
changeLineBtn.addEventListener("click", () => {
  // Rendre la pop-up visible de nouveau ?
  lineSelectionOverlay.style.display = "flex";
});

/**********************************
 * Formulaire: submit
 **********************************/
treeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Anti-double-clic (éviter qu'un clic trop rapide ne double la saisie)
  const now = Date.now();
  if (now - lastInsertTimestamp < 1000) {
    return; // Ignore si le dernier clic date de moins d'une seconde
  }

  // Vérifier la validité des champs
  const errors = validateForm();
  if (errors.length > 0) {
    alert("Erreurs:\n - " + errors.join("\n - "));
    return;
  }

  // Calcul de l'urgence
  const urgenceValue = calculerUrgence();

  // Générer un objet de données
  const newData = {
    // S'il y a eu changement de ligne => on peut créer un séparateur
    lineSeparator: false,

    // Données
    ligne: currentLine,
    voie: voieSelect.value,
    pkDebut: pkDebutInput.value,
    pkFin: pkFinInput.value || "",
    distance: distanceVoieInput.value,
    nbArbres: nbArbresInput.value,
    proprio: proprietaireSelect.value,
    decision: decisionSelect.value,
    urgence: urgenceValue,         // "U1" ou "U2" + style
    stabilite: checkStabilite.checked ? "Oui" : "Non",
    maladie: checkMaladie.checked ? "Oui" : "Non",
    commentaire: commentaireInput.value || ""
  };

  // Vérifier si la ligne a changé depuis la dernière saisie
  // (pour insérer un "bloc séparateur" visuel dans le tableau)
  if (dataArray.length > 0) {
    const lastData = dataArray[dataArray.length - 1];
    if (lastData.ligne !== currentLine) {
      // On insère d'abord un objet séparateur
      dataArray.push({ lineSeparator: true, ligne: currentLine });
    }
  }
  
  // On ajoute les données dans le tableau
  dataArray.push(newData);
  saveDataToLocalStorage();
  renderTable();

  // Reset du formulaire
  treeForm.reset();
  // Désactivation temporaire du bouton
  submitBtn.disabled = true;
  setTimeout(() => {
    submitBtn.disabled = false;
  }, 1000);

  // On met à jour le timestamp
  lastInsertTimestamp = now;
});

/**********************************
 * Fonction de validation
 **********************************/
function validateForm() {
  // On vide les précédents style d'erreur
  const allInputs = [pkDebutInput, pkFinInput, distanceVoieInput, nbArbresInput];
  allInputs.forEach((field) => field.classList.remove("error-field"));

  let errs = [];

  // PK Début obligatoire, format
  if (!pkDebutInput.value) {
    errs.push("PK Début est requis");
    pkDebutInput.classList.add("error-field");
  } else if (!/^\d+(\+|,)?\d*$/.test(pkDebutInput.value)) {
    errs.push("Format invalide pour PK Début (ex: 123+45)");
    pkDebutInput.classList.add("error-field");
  }

  // PK Fin si non vide, on vérifie le format
  if (pkFinInput.value && !/^\d+(\+|,)?\d*$/.test(pkFinInput.value)) {
    errs.push("Format invalide pour PK Fin (ex: 124+00)");
    pkFinInput.classList.add("error-field");
  }

  // Distance voie obligatoire, numeric
  if (!distanceVoieInput.value) {
    errs.push("Distance voie est requise");
    distanceVoieInput.classList.add("error-field");
  } else if (Number(distanceVoieInput.value) < 0) {
    errs.push("Distance voie ne peut pas être négative");
    distanceVoieInput.classList.add("error-field");
  }

  // Nombre d'arbres obligatoire, numeric
  if (!nbArbresInput.value) {
    errs.push("Nombre d'arbres est requis");
    nbArbresInput.classList.add("error-field");
  } else if (Number(nbArbresInput.value) < 0) {
    errs.push("Nombre d'arbres ne peut pas être négatif");
    nbArbresInput.classList.add("error-field");
  }

  // Au moins un radio Arbre Mort / Vivant ?
  const isMortChecked = arbreMortRadio.checked;
  const isVivantChecked = arbreVivantRadio.checked;
  if (!isMortChecked && !isVivantChecked) {
    // Par défaut, on considère Arbre Vivant => on coche par défaut
    arbreVivantRadio.checked = true;
  }

  // On retourne la liste d'erreurs
  return errs;
}

/**********************************
 * Calcul de l'urgence
 **********************************/
function calculerUrgence() {
  const isMort = arbreMortRadio.checked;
  const isVivant = arbreVivantRadio.checked; // ou !isMort
  const isStab = checkStabilite.checked;
  const isMal = checkMaladie.checked;

  // Logique :
  // Arbre Mort => U1 (rouge & gras)
  // Arbre Vivant seul => U2
  // Vivant + (Maladie ou Stab) => U2 (rouge)
  // Vivant + (Maladie et Stab) => U1 (rouge & gras)
  if (isMort) {
    // Priorité absolue
    return "U1";
  } else {
    // Arbre vivant
    if (isStab && isMal) {
      return "U1";
    } else {
      return "U2";
    }
  }
}

/**********************************
 * Rendu du tableau
 **********************************/
function renderTable() {
  dataTable.innerHTML = "";

  dataArray.forEach((item, index) => {
    // Si c'est un séparateur => on insère une ligne distinctive
    if (item.lineSeparator) {
      const sepRow = document.createElement("tr");
      sepRow.innerHTML = `
        <td colspan="13" class="line-separator">
          -- Changement de ligne : ${item.ligne} --
        </td>
      `;
      dataTable.appendChild(sepRow);
      return;
    }

    const row = document.createElement("tr");

    // Calcul du style pour Urgence
    let urgenceClass = "";
    if (item.urgence === "U1") {
      urgenceClass = "u1-cell"; // Rouge + gras
    } else {
      urgenceClass = "u2-cell"; // Normal ou un autre style
    }

    row.innerHTML = `
      <td>${item.ligne}</td>
      <td>${item.voie}</td>
      <td>${item.pkDebut}</td>
      <td>${item.pkFin}</td>
      <td>${item.distance}</td>
      <td>${item.nbArbres}</td>
      <td>${item.proprio}</td>
      <td>${item.decision}</td>
      <td class="${urgenceClass}">${item.urgence}</td>
      <td>${item.stabilite}</td>
      <td>${item.maladie}</td>
      <td>${item.commentaire}</td>
      <td>
        <button class="modify-btn" data-index="${index}">Modifier</button>
        <button class="delete-btn" data-index="${index}">🗑️</button>
      </td>
    `;
    dataTable.appendChild(row);
  });

  // Gestion des boutons "Modifier" et "Supprimer"
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      if (idx !== null) {
        dataArray.splice(idx, 1);
        saveDataToLocalStorage();
        renderTable();
      }
    });
  });

  const modifyButtons = document.querySelectorAll(".modify-btn");
  modifyButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      if (idx !== null) {
        loadIntoForm(idx);
      }
    });
  });
}

/**********************************
 * Charger une ligne dans le formulaire
 **********************************/
function loadIntoForm(index) {
  const item = dataArray[index];
  // Vérifier qu'il n'est pas un séparateur
  if (item.lineSeparator) return;

  // Charger les champs
  voieSelect.value = item.voie;
  pkDebutInput.value = item.pkDebut;
  pkFinInput.value = item.pkFin;
  distanceVoieInput.value = item.distance;
  nbArbresInput.value = item.nbArbres;
  proprietaireSelect.value = item.proprio;
  decisionSelect.value = item.decision;

  // Arbre mort ou vivant
  if (item.urgence === "U1" && item.ligne === currentLine && item.maladie === "Non" && item.stabilite === "Non") {
    // Ce cas n'est pas forcément fiable, on préfère re-checker
  }
  // On fait simple : si item.urgence === "U1" et item.stabilite==="Oui" et item.maladie==="Oui" => c'était un Vivant + 2cases
  // S'il est explicitement "Arbre Mort"
  if (item.urgence === "U1" && (item.maladie === "Non" && item.stabilite === "Non")) {
    arbreMortRadio.checked = true;
    arbreVivantRadio.checked = false;
  } else {
    // On suppose vivant
    arbreVivantRadio.checked = true;
    arbreMortRadio.checked = false;
  }

  checkStabilite.checked = (item.stabilite === "Oui");
  checkMaladie.checked = (item.maladie === "Oui");
  commentaireInput.value = item.commentaire;

  // Quand on resoumettra, on mettra à jour la ligne existante
  treeForm.onsubmit = function(e) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastInsertTimestamp < 1000) {
      return; // blocage double-clic
    }
    const errors = validateForm();
    if (errors.length > 0) {
      alert("Erreurs:\n - " + errors.join("\n - "));
      return;
    }
    const urgenceValue = calculerUrgence();

    // Mettre à jour l'objet
    item.voie = voieSelect.value;
    item.pkDebut = pkDebutInput.value;
    item.pkFin = pkFinInput.value;
    item.distance = distanceVoieInput.value;
    item.nbArbres = nbArbresInput.value;
    item.proprio = proprietaireSelect.value;
    item.decision = decisionSelect.value;
    item.urgence = urgenceValue;
    item.stabilite = checkStabilite.checked ? "Oui" : "Non";
    item.maladie = checkMaladie.checked ? "Oui" : "Non";
    item.commentaire = commentaireInput.value;

    // Sauvegarde
    saveDataToLocalStorage();
    renderTable();

    // Nettoyage du formulaire
    treeForm.reset();
    submitBtn.disabled = true;
    setTimeout(() => {
      submitBtn.disabled = false;
    }, 1000);

    // Restaure l'event par défaut
    treeForm.onsubmit = defaultFormSubmit;
  };
}

/**********************************
 * Soumission par défaut du form
 **********************************/
const defaultFormSubmit = treeForm.onsubmit;

/**********************************
 * LocalStorage
 **********************************/
function saveDataToLocalStorage() {
  const toSave = {
    currentLine,
    dataArray
  };
  localStorage.setItem("treesData", JSON.stringify(toSave));
}

function loadDataFromLocalStorage() {
  const saved = localStorage.getItem("treesData");
  if (saved) {
    const parsed = JSON.parse(saved);
    currentLine = parsed.currentLine || "";
    dataArray = parsed.dataArray || [];
  }
}

/**********************************
 * Export en Excel
 **********************************/
exportExcelBtn.addEventListener("click", () => {
  // Générer un tableau multi-dimensionnel compatible SheetJS
  // On va créer un array d'objets -> array de tableaux
  let sheetData = [];
  // En-têtes
  sheetData.push([
    "Ligne", "Voie", "PK Début", "PK Fin", "Distance", "Nb Arbres",
    "Propriétaire", "Décision", "Urgence", "Stabilité", "Maladie", "Commentaire"
  ]);

  dataArray.forEach(item => {
    if (item.lineSeparator) {
      // On peut ajouter une ligne vide pour séparer
      sheetData.push(["-- Changement de ligne : " + item.ligne + " --"]);
    } else {
      sheetData.push([
        item.ligne,
        item.voie,
        item.pkDebut,
        item.pkFin,
        item.distance,
        item.nbArbres,
        item.proprio,
        item.decision,
        item.urgence,
        item.stabilite,
        item.maladie,
        item.commentaire
      ]);
    }
  });

  // Créer la worksheet
  let ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Appliquer un style minimal (NB : l'API de SheetJS pour le style est plus avancée en version pro)
  // ICI on fait du basique : on met juste le bold sur la première ligne
  // et "U1" en rouge+gras => c'est plus compliqué en version open-source. On fera simple.

  // Créer le workbook et y ajouter la feuille
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DonnéesArbres");

  // Exporter
  XLSX.writeFile(wb, "Donnees_Arbres.xlsx");
});

/**********************************
 * Réinitialisation
 **********************************/
resetDataBtn.addEventListener("click", () => {
  // Afficher la pop-up de confirmation
  resetOverlay.style.display = "flex";
});

confirmResetBtn.addEventListener("click", () => {
  // Effacer toutes les données
  dataArray = [];
  currentLine = "";
  saveDataToLocalStorage();
  renderTable();
  // Cacher la pop-up
  resetOverlay.style.display = "none";
  // Réafficher la pop-up initiale
  lineSelectionOverlay.style.display = "flex";
  currentLineBanner.style.display = "none";
});

cancelResetBtn.addEventListener("click", () => {
  resetOverlay.style.display = "none";
});

/**********************************
 * Mode sombre
 **********************************/
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

/**********************************
 * Fin du script
 **********************************/
