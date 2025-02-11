document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("tree-form");
    const tableBody = document.querySelector("#data-table tbody");
    const exportExcelBtn = document.getElementById("export-excel");
    const resetDataBtn = document.getElementById("reset-data");
    const toggleDarkMode = document.getElementById("toggle-dark-mode");

    // Charger les données enregistrées
    function loadData() {
        let savedData = JSON.parse(localStorage.getItem("treeData")) || [];
        savedData.forEach(data => addRowToTable(data));
    }

    // Sauvegarder les données
    function saveData() {
        let rows = [...document.querySelectorAll("#data-table tbody tr")];
        let data = rows.map(row => {
            return [...row.children].map(td => td.innerText);
        });
        localStorage.setItem("treeData", JSON.stringify(data));
    }

    // Ajouter une ligne dans le tableau
    function addRowToTable(data) {
        let row = document.createElement("tr");
        row.innerHTML = data.map(item => `<td>${item}</td>`).join("") +
            `<td><button class="delete-btn">🗑</button></td>`;
        tableBody.appendChild(row);
        saveData();
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        let voie = document.getElementById("voie").value;
        let pkDebut = document.getElementById("pk-debut").value;
        let pkFin = document.getElementById("pk-fin").value;
        let distanceVoie = document.getElementById("distance-voie").value;
        let nombreArbres = document.getElementById("nombre-arbres").value;
        let proprietaire = document.getElementById("proprietaire").value;
        let decision = document.getElementById("decision").value;
        let arbreMort = document.getElementById("arbre-mort").checked;
        let stabilite = document.getElementById("stabilite").checked;
        let maladie = document.getElementById("maladie").checked;
        let commentaire = document.getElementById("commentaire").value;

        let urgence = "U2";
        if (arbreMort) urgence = maladie && stabilite ? "U1 (Rouge)" : "U1 (Noir)";
        
        let rowData = [voie, pkDebut, pkFin, (voie === "V1" ? "GAUCHE" : "DROITE"), distanceVoie, nombreArbres, proprietaire, decision, urgence, stabilite ? "Oui" : "Non", maladie ? "Oui" : "Non", commentaire];
        addRowToTable(rowData);
    });

    exportExcelBtn.addEventListener("click", () => {
        let table = document.getElementById("data-table");
        let ws = XLSX.utils.table_to_sheet(table);
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Données Arbres");
        XLSX.writeFile(wb, "donnees_arbres.xlsx");
    });

    resetDataBtn.addEventListener("click", () => {
        if (confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ?")) {
            localStorage.removeItem("treeData");
            tableBody.innerHTML = "";
        }
    });

    loadData();
});
