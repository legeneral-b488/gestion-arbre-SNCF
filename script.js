/**********************************
 * Variables et initialisations
 **********************************/
let currentLine = localStorage.getItem("currentLine") || "";  
let dataArray = JSON.parse(localStorage.getItem("treesData")) || [];  
let lastInsertTimestamp = 0;  

// Sélecteurs DOM
const initialLineSelect = document.getElementById("initialLineSelect");
const currentLineSpan = document.getElementById("currentLine");

const treeForm = document.getElementById("treeForm");

const pkDebutInput = document.getElementById("pkDebut");
const pkFinInput = document.getElementById("pkFin");
const voieSelect = document.getElementById("voieSelect");
const distanceVoieInput = document.getElementById("distanceVoie");
// Nouveau champ HAUTEUR
const hauteurInput = document.getElementById("hauteur");

const nbArbresInput = document.getElementById("nbArbres");
const proprietaireSelect = document.getElementById("proprietaireSelect");
const decisionSelect = document.getElementById("decisionSelect");

const arbreMortRadio = document.getElementById("arbreMort");
const arbreVivantRadio = document.getElementById("arbreVivant");
const checkStabilite = document.getElementById("checkStabilite");
const checkMaladie = document.getElementById("checkMaladie");
const commentaireInput = document.getElementById("commentaire");

// Pas de const pour PB21, etc., on utilisera getElementById
// Côté => document.querySelector("input[name='cote']:checked")
// PB31 / PB32 / PB33 => see below
// PB21 / PB22 => see below

const submitBtn = document.getElementById("submitBtn");

// Tableau
const dataTable = document.getElementById("dataTable").querySelector("tbody");

// Boutons divers
const exportExcelBtn = document.getElementById("exportExcelBtn");
const resetDataBtn = document.getElementById("resetDataBtn");
const resetOverlay = document.getElementById("resetOverlay");
const confirmResetBtn = document.getElementById("confirmResetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

// Mode sombre
const darkModeToggle = document.getElementById("darkModeToggle");

/**********************************
 * Au chargement : Vérification ligne et chargement des données
 **********************************/
window.addEventListener("load", () => {
  renderTable();
  if (currentLine) {
    initialLineSelect.value = currentLine;
    if (currentLineSpan) {
      currentLineSpan.textContent = currentLine;
    }
  }
});

/**********************************
 * Gestion de la sélection de ligne
 **********************************/
initialLineSelect.addEventListener("change", () => {
  currentLine = initialLineSelect.value;
  if (currentLineSpan) {
    currentLineSpan.textContent = currentLine;
  }
  localStorage.setItem("currentLine", currentLine);
});

/**********************************
 * Formulaire : soumission des données
 **********************************/
treeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!currentLine) {
    alert("Veuillez d'abord sélectionner une ligne ferroviaire !");
    return;
  }

  const now = Date.now();
  if (now - lastInsertTimestamp < 1000) return;  

  const errors = validateForm();
  if (errors.length > 0) {
    alert("Erreurs:\n - " + errors.join("\n - "));
    return;
  }

  const urgenceValue = calculerUrgence();

  const newData = {
    ligne: currentLine,
    voie: voieSelect.value,
    pkDebut: pkDebutInput.value,
    pkFin: pkFinInput.value || "",
    distance: distanceVoieInput.value,
    // Position 6 => Hauteur
    hauteur: hauteurInput.value || "",

    // Position 7 => Nb arbres
    nbArbres: nbArbresInput.value,

    // 8 => Proprietaire
    proprio: proprietaireSelect.value,
    // 9 => Decision
    decision: decisionSelect.value,
    // 10 => Urgence
    urgence: urgenceValue,
    // 11 => Stabilité
    stabilite: checkStabilite.checked ? "Oui" : "Non",
    // 12 => Maladie
    maladie: checkMaladie.checked ? "Oui" : "Non",
    // 13 => Commentaire
    commentaire: commentaireInput.value || "",
    // 14 => Côté
    cote: document.querySelector("input[name='cote']:checked")?.value || "",
    // 15 => Diamètre
    diametre: [
      document.getElementById("PB31")?.checked ? "PB31" : "",
      document.getElementById("PB32")?.checked ? "PB32" : "",
      document.getElementById("PB33")?.checked ? "PB33" : ""
    ].filter(Boolean).join(", "),
    // 16 => Débroussaillage
    debroussaillage: [
      document.getElementById("PB21")?.checked ? "PB21" : "",
      document.getElementById("PB22")?.checked ? "PB22" : ""
    ].filter(Boolean).join(", ")
  };

  dataArray.push(newData);
  saveDataToLocalStorage();
  renderTable();

  treeForm.reset();
  initialLineSelect.value = currentLine;
  localStorage.setItem("currentLine", currentLine);

  submitBtn.disabled = true;
  setTimeout(() => {
    submitBtn.disabled = false;
  }, 1000);

  lastInsertTimestamp = now;
});

/**********************************
 * Validation du formulaire
 **********************************/
function validateForm() {
  let errs = [];
  if (!pkDebutInput.value) errs.push("PK Début est requis");
  if (!distanceVoieInput.value) errs.push("Distance voie est requise");
  if (!nbArbresInput.value) errs.push("Nombre d'arbres est requis");
  return errs;
}

/**********************************
 * Calcul de l'urgence
 **********************************/
function calculerUrgence() {
  // U1 si l'arbre est mort, U2 sinon
  return arbreMortRadio.checked ? "U1" : "U2";
}

/**********************************
 * Rendu du tableau avec modification des lignes
 **********************************/
function renderTable() {
  dataTable.innerHTML = "";

  dataArray.forEach((item, index) => {
    const row = document.createElement("tr");
    // L'ordre ici DOIT coller au <thead> (voir points 1..16 + actions)
    row.innerHTML = `
      <!-- 1: Ligne -->
      <td>${item.ligne}</td>
      <!-- 2: Voie -->
      <td contenteditable="true">${item.voie}</td>
      <!-- 3: PK Début -->
      <td contenteditable="true">${item.pkDebut}</td>
      <!-- 4: PK Fin -->
      <td contenteditable="true">${item.pkFin}</td>
      <!-- 5: Distance -->
      <td contenteditable="true">${item.distance}</td>
      <!-- 6: Hauteur -->
      <td contenteditable="true">${item.hauteur}</td>
      <!-- 7: Nb Arbres -->
      <td contenteditable="true">${item.nbArbres}</td>
      <!-- 8: Propriétaire -->
      <td contenteditable="true">${item.proprio}</td>
      <!-- 9: Décision -->
      <td contenteditable="true">${item.decision}</td>
      <!-- 10: Urgence (Non contenteditable) -->
      <td>${item.urgence}</td>
      <!-- 11: Stabilité -->
      <td contenteditable="true">${item.stabilite}</td>
      <!-- 12: Maladie -->
      <td contenteditable="true">${item.maladie}</td>
      <!-- 13: Commentaire -->
      <td contenteditable="true">${item.commentaire}</td>
      <!-- 14: Côté -->
      <td contenteditable="true">${item.cote}</td>
      <!-- 15: Diamètre -->
      <td contenteditable="true">${item.diametre}</td>
      <!-- 16: Débroussaillage -->
      <td contenteditable="true">${item.debroussaillage}</td>
      <!-- 17: Actions -->
      <td>
        <button class="modify-btn" data-index="${index}">Modifier</button>
        <button class="delete-btn" data-index="${index}">🗑️</button>
      </td>
    `;
    dataTable.appendChild(row);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      dataArray.splice(idx, 1);
      saveDataToLocalStorage();
      renderTable();
    });
  });

  document.querySelectorAll(".modify-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      const row = e.target.closest("tr");

      if (btn.textContent === "Modifier") {
        btn.textContent = "Enregistrer";
      } else {
        // Relecture EXACTEMENT dans le même ordre
        const updatedData = {
          // 1
          ligne: row.children[0].textContent,
          // 2
          voie: row.children[1].textContent,
          // 3
          pkDebut: row.children[2].textContent,
          // 4
          pkFin: row.children[3].textContent,
          // 5
          distance: row.children[4].textContent,
          // 6
          hauteur: row.children[5].textContent,
          // 7
          nbArbres: row.children[6].textContent,
          // 8
          proprio: row.children[7].textContent,
          // 9
          decision: row.children[8].textContent,
          // 10
          urgence: row.children[9].textContent, // Non contenteditable
          // 11
          stabilite: row.children[10].textContent,
          // 12
          maladie: row.children[11].textContent,
          // 13
          commentaire: row.children[12].textContent,
          // 14
          cote: row.children[13].textContent,
          // 15
          diametre: row.children[14].textContent,
          // 16
          debroussaillage: row.children[15].textContent
        };

        dataArray[idx] = updatedData;
        saveDataToLocalStorage();
        renderTable();
      }
    });
  });
}

/**********************************
 * Sauvegarde et chargement des données
 **********************************/
function saveDataToLocalStorage() {
  localStorage.setItem("treesData", JSON.stringify(dataArray));
}

/**********************************
 * Export en Excel
 **********************************/
exportExcelBtn.addEventListener("click", () => {
  let ws = XLSX.utils.json_to_sheet(dataArray);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DonnéesArbres");
  XLSX.writeFile(wb, "Donnees_Arbres.xlsx");
});

/**********************************
 * Réinitialisation des données avec confirmation
 **********************************/
resetDataBtn.addEventListener("click", () => {
  const confirmation = confirm("⚠️ Attention, vous allez perdre toutes les données !\nVoulez-vous vraiment continuer ?");
  if (confirmation) {
    dataArray = [];
    saveDataToLocalStorage();
    renderTable();
    alert("✅ Toutes les données ont été supprimées avec succès.");
  }
});

/**********************************
 * Mode Sombre
 **********************************/
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});
