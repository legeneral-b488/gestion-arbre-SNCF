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
const nbArbresInput = document.getElementById("nbArbres");
const proprietaireSelect = document.getElementById("proprietaireSelect");
const decisionSelect = document.getElementById("decisionSelect");

const arbreMortRadio = document.getElementById("arbreMort");
const arbreVivantRadio = document.getElementById("arbreVivant");
const checkStabilite = document.getElementById("checkStabilite");
const checkMaladie = document.getElementById("checkMaladie");
const commentaireInput = document.getElementById("commentaire");

// Nouveaux champs ajoutés
// (Pas de const pour PB21, PB22, PB31, PB32, PB33, on ira les chercher directement via getElementById dans le code)

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

  // Anti-double-clic trop rapide
  const now = Date.now();
  if (now - lastInsertTimestamp < 1000) return;  

  // Vérifie la validité du formulaire
  const errors = validateForm();
  if (errors.length > 0) {
    alert("Erreurs:\n - " + errors.join("\n - "));
    return;
  }

  const urgenceValue = calculerUrgence();

  // Constitution de l'objet avec TOUS les champs (y compris les nouveaux)
  const newData = {
    // Champs déjà présents
    ligne: currentLine,
    voie: voieSelect.value,
    pkDebut: pkDebutInput.value,
    pkFin: pkFinInput.value || "",
    distance: distanceVoieInput.value,
    nbArbres: nbArbresInput.value,
    proprio: proprietaireSelect.value,
    decision: decisionSelect.value,
    urgence: urgenceValue,
    stabilite: checkStabilite.checked ? "Oui" : "Non",
    maladie: checkMaladie.checked ? "Oui" : "Non",
    commentaire: commentaireInput.value || "",

    // Champs ajoutés : Côté, Diamètre, Débroussaillage
    cote: document.querySelector("input[name='cote']:checked")?.value || "",
    diametre: [
      document.getElementById("PB31")?.checked ? "PB31" : "",
      document.getElementById("PB32")?.checked ? "PB32" : "",
      document.getElementById("PB33")?.checked ? "PB33" : ""
    ].filter(Boolean).join(", "),
    debroussaillage: [
      document.getElementById("PB21")?.checked ? "PB21" : "",
      document.getElementById("PB22")?.checked ? "PB22" : ""
    ].filter(Boolean).join(", ")
  };

  // Ajout à dataArray
  dataArray.push(newData);
  saveDataToLocalStorage();
  renderTable();

  // On réinitialise le formulaire
  treeForm.reset();

  // Après la réinitialisation du formulaire, on remet la ligne sélectionnée
  initialLineSelect.value = currentLine;
  localStorage.setItem("currentLine", currentLine);

  // Empêche de spammer la validation
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
  // Comme dans ton code initial : U1 si l'arbre est mort, U2 sinon
  return arbreMortRadio.checked ? "U1" : "U2";
}

/**********************************
 * Rendu du tableau avec modification des lignes
 **********************************/
function renderTable() {
  dataTable.innerHTML = "";
  dataArray.forEach((item, index) => {
    // Création d'une ligne
    const row = document.createElement("tr");

    // On met TOUTES les colonnes, y compris les nouvelles
    row.innerHTML = `
      <td>${item.ligne}</td>
      <td contenteditable="true">${item.voie}</td>
      <td contenteditable="true">${item.pkDebut}</td>
      <td contenteditable="true">${item.pkFin}</td>
      <td contenteditable="true">${item.distance}</td>
      <td contenteditable="true">${item.nbArbres}</td>
      <td contenteditable="true">${item.proprio}</td>
      <td contenteditable="true">${item.decision}</td>
      <td>${item.urgence}</td>
      <td contenteditable="true">${item.stabilite}</td>
      <td contenteditable="true">${item.maladie}</td>
      <td contenteditable="true">${item.commentaire}</td>
      <td contenteditable="true">${item.cote}</td>
      <td contenteditable="true">${item.diametre}</td>
      <td contenteditable="true">${item.debroussaillage}</td>
      <td>
        <button class="modify-btn" data-index="${index}">Modifier</button>
        <button class="delete-btn" data-index="${index}">🗑️</button>
      </td>
    `;

    dataTable.appendChild(row);
  });

  // Bouton de suppression
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      dataArray.splice(idx, 1);
      saveDataToLocalStorage();
      renderTable();
    });
  });

  // Bouton de modification
  document.querySelectorAll(".modify-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      const row = e.target.closest("tr");

      if (btn.textContent === "Modifier") {
        // On prépare à éditer => on change le texte du bouton
        btn.textContent = "Enregistrer";
      } else {
        // On enregistre les nouvelles valeurs directement depuis les cellules
        const updatedData = {
          ligne: row.children[0].textContent,
          voie: row.children[1].textContent,
          pkDebut: row.children[2].textContent,
          pkFin: row.children[3].textContent,
          distance: row.children[4].textContent,
          nbArbres: row.children[5].textContent,
          proprio: row.children[6].textContent,
          decision: row.children[7].textContent,
          urgence: row.children[8].textContent,        // Non contenteditable
          stabilite: row.children[9].textContent,
          maladie: row.children[10].textContent,
          commentaire: row.children[11].textContent,
          cote: row.children[12].textContent,
          diametre: row.children[13].textContent,
          debroussaillage: row.children[14].textContent
        };

        // Mise à jour dans le tableau global
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
