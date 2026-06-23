console.log(ePub);

console.log(window.pdfjsLib);
console.log(window.pdfjsDistBuildPdf);


//------------------------------------------------------------------------
console.log("PATATA");
console.log(window.docx);
console.log(window.docxjs);


const contentviewer = document.getElementById("Contentviewer");
const viewer = document.getElementById("viewer");
const exit = document.getElementById("exit");
//------------------------------------------------------------------------
let book = null;
let rendition = null;
let pdfDoc = null;
let fontSize = 100; // porcentaje
//------------------------------------------------------------------------
const pdfjsLib = window.pdfjsLib;

pdfjsLib.GlobalWorkerOptions.workerSrc = "libs/pdf.worker.min.js";

const dropZone = document.getElementById("drop-zone");

//-----------RIGHT----------------------------------------------------
const dropDocx = document.getElementById("drop-docx");
const contentDoc = document.getElementById("ContentDoc");
const editor = document.getElementById("editor");



exit.addEventListener("click", e => {
    mostrarLeft();
});


dropZone.addEventListener("dragover", e => {
    e.preventDefault();
});

dropZone.addEventListener("drop", e => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (!file) return;

    ocultarLeft();

    if (file.name.endsWith(".epub")) {
        abrirEPUB(file);
    }
    else if (file.name.endsWith(".pdf")) {
        abrirPDF(file);
    }
});



//------------------------------------------------------------------------


function abrirPDF(file) {

    limpiarLeft();

    const viewer = document.getElementById("viewer");
    viewer.innerHTML = "";

    const url = URL.createObjectURL(file);

    const object = document.createElement("object");

    object.className = "pdfview";
    object.type = "application/pdf";
    //object.data = url + "#toolbar=0";
    object.data = url;

    viewer.appendChild(object);

}

//---------------------------------------------------------------------

function abrirEPUB(file) {

    limpiarLeft()

    document.getElementById("viewer").innerHTML = "";

    const reader = new FileReader();




    reader.onload = function (e) {

        book = ePub(e.target.result);

        rendition = book.renderTo("viewer", {
            width: "100%",
            height: "100%",
            flow: "scrolled-doc"
        });

        rendition.hooks.content.register(function(contents) {

            console.log("HOOK EJECUTADO");

            const style = contents.document.createElement("style");

            style.textContent = `
                .block_16,
                .block_16 *,
                .text_1,
                .text_2 {
                    font-size: inherit !important;
                }
            `;

            contents.document.head.appendChild(style);

        });

        rendition.display();

        cargarCapitulos();
    };



    reader.readAsArrayBuffer(file);
}

document.getElementById("next").addEventListener("click", () => {
    if (rendition) rendition.next();
});

document.getElementById("prev").addEventListener("click", () => {
    if (rendition) rendition.prev();
});

document.getElementById("increaseFont").addEventListener("click", () => {
    if (rendition) {

        fontSize += 10;

        rendition.themes.override(
            "font-size",
            fontSize + "%"
        );

    }
});

document.getElementById("decreaseFont").addEventListener("click", () => {
    if (rendition) {

        fontSize -= 10;

        rendition.themes.override(
            "font-size",
            fontSize + "%"
        );

    }
});

function cargarCapitulos() {

    const chapterList = document.getElementById("chapterList");

    chapterList.innerHTML =
        '<option value="">Capítulos</option>';

    book.loaded.navigation.then(function(nav) {

        nav.toc.forEach(function(chapter) {

            const option = document.createElement("option");

            option.textContent = chapter.label;
            option.value = chapter.href;

            chapterList.appendChild(option);
        });

    });
}

document.getElementById("chapterList")
.addEventListener("change", function() {

    if (this.value && rendition) {
        rendition.display(this.value);
    }

});



//---------------------------------------------------------------------


function ocultarLeft() {
    dropZone.style.display = "none";
    contentviewer.style.display = "block";
}

function mostrarLeft() {
    dropZone.style.display = "block";
    contentviewer.style.display = "none";

}

function limpiarLeft() {

    if (pdfDoc) {
        pdfDoc.destroy();
        pdfDoc = null;
    }
    // Eliminar el EPUB anterior, si existe
    if (rendition) {
        rendition.destroy();
        rendition = null;
    }

    if (book) {
        book.destroy();
        book = null;
    }

}




//----------------Right------------------------------------------------------

// Componentes de docx
const { Document, Paragraph, Packer } = window.docx;


// ====================
// Nuevo documento
// ====================
document.getElementById("newDoc").addEventListener("click", () => {
    ocultarRight();
    editor.innerHTML = "";

});


// ====================
// Guardar DOCX
// ====================
document.getElementById("saveDoc").addEventListener("click", async () => {

    try {

        // Obtener solo el texto del editor
        const lineas = editor.innerText.split("\n");

        const documento = new Document({
            sections: [
                {
                    children: lineas.map(linea => new Paragraph(linea))
                }
            ]
        });

        const blob = await Packer.toBlob(documento);

        const enlace = document.createElement("a");

        enlace.href = URL.createObjectURL(blob);
        enlace.download = "documento.docx";

        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);

        URL.revokeObjectURL(enlace.href);

    }
    catch (error) {

        console.error("Error al guardar el DOCX:", error);

    }

});


// ====================
// Zona para arrastrar DOCX
// ====================

dropDocx.addEventListener("dragover", e => {

    e.preventDefault();

});

dropDocx.addEventListener("drop", e => {

    e.preventDefault();

    const file = e.dataTransfer.files[0];
    
    ocultarRight();

    if (!file)
        return;

    if (!file.name.toLowerCase().endsWith(".docx")) {

        alert("Solo se permiten archivos DOCX.");
        return;

    }

    const reader = new FileReader();

    reader.onload = function (event) {

        mammoth.convertToHtml({
            arrayBuffer: event.target.result
        })
        .then(result => {

            // Conserva negritas, listas, encabezados, etc.
            editor.innerHTML = result.value;

        })
        .catch(error => {

            console.error("Error al abrir el DOCX:", error);

        });

    };

    reader.readAsArrayBuffer(file);

});


//---------------------------------------------------------------------------------

function ocultarRight() {
    dropDocx.style.display = "none";
    contentDoc.style.display = "block";
}

function mostrarRight() {
    dropDocx.style.display = "block";
    contentDoc.style.display = "none";

}


