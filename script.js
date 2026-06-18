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

    limpiarLeft()

    const reader = new FileReader();

    reader.onload = function (e) {

        const typedArray = new Uint8Array(e.target.result);

        pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {

            pdfDoc = pdf;

            const viewer = document.getElementById("viewer");
            viewer.innerHTML = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

                pdf.getPage(pageNum).then(function (page) {

                    const scale = 1.5;
                    const viewport = page.getViewport({ scale: scale });

                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    viewer.appendChild(canvas);

                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    });

                });

            }

        });

    };

    reader.readAsArrayBuffer(file);

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
            height: "100%"
        });

        rendition.display();
    };

    reader.readAsArrayBuffer(file);
}

document.getElementById("next").addEventListener("click", () => {
    if (rendition) rendition.next();
});

document.getElementById("prev").addEventListener("click", () => {
    if (rendition) rendition.prev();
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


