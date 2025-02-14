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

const submitBtn = document.getElementById("submitBtn");

const dataTable = document.getElementById("dataTable").querySelector("tbody");

const exportExcelBtn = document.getElementById("exportExcelBtn");
const resetDataBtn = document.getElementById("resetDataBtn");
const resetOverlay = document.getElementById("resetOverlay");
const confirmResetBtn = document.getElementById("confirmResetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

const darkModeToggle = document.getElementById("darkModeToggle");

/**********************************
 * Au chargement : Vérification ligne et chargement des données
 **********************************/
window.addEventListener("load", () => {
  renderTable();
  if (currentLine) {
    initialLineSelect.value = currentLine;
    currentLineSpan.textContent = currentLine;
  }
});

/**********************************
 * Gestion de la sélection de ligne
 **********************************/
initialLineSelect.addEventListener("change", () => {
  currentLine = initialLineSelect.value;
  currentLineSpan.textContent = currentLine;
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
    nbArbres: nbArbresInput.value,
    proprio: proprietaireSelect.value,
    decision: decisionSelect.value,
    urgence: urgenceValue,
    stabilite: checkStabilite.checked ? "Oui" : "Non",
    maladie: checkMaladie.checked ? "Oui" : "Non",
    commentaire: commentaireInput.value || ""  
  };

  dataArray.push(newData);
  saveDataToLocalStorage();
  renderTable();

  treeForm.reset();
  initialLineSelect.value = currentLine; 

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
  return arbreMortRadio.checked ? "U1" : "U2";
}

/**********************************
 * Rendu du tableau avec modification des lignes
 **********************************/
function renderTable() {
  dataTable.innerHTML = "";
  dataArray.forEach((item, index) => {
    const row = document.createElement("tr");

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
        const updatedData = {
          ligne: row.children[0].textContent,
          voie: row.children[1].textContent,
          pkDebut: row.children[2].textContent,
          pkFin: row.children[3].textContent,
          distance: row.children[4].textContent,
          nbArbres: row.children[5].textContent,
          proprio: row.children[6].textContent,
          decision: row.children[7].textContent,
          urgence: row.children[8].textContent,
          stabilite: row.children[9].textContent,
          maladie: row.children[10].textContent,
          commentaire: row.children[11].textContent,
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

