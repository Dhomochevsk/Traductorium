console.log(ePub);

console.log(window.pdfjsLib);
console.log(window.pdfjsDistBuildPdf);

//------------------------------------------------------------------------

const viewer = document.getElementById("viewer");
const exit = document.getElementById("exit");
//------------------------------------------------------------------------
const pdfjsLib = window.pdfjsDistBuildPdf;

pdfjsLib.PDFJS.workerSrc = "libs/pdf.worker.min.js";

const dropZone = document.getElementById("drop-zone");


exit.addEventListener("click", e => {
    mostrar();
});

dropZone.addEventListener("dragover", e => {
    e.preventDefault();
});

dropZone.addEventListener("drop", e => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (!file) return;

    ocultar();

    if (file.name.endsWith(".epub")) {
        abrirEPUB(file);
    }
    else if (file.name.endsWith(".pdf")) {
        abrirPDF(file);
    }
});

//------------------------------------------------------------------------
function abrirPDF(file) {

    const reader = new FileReader();

    reader.onload = function (e) {

        const typedArray = new Uint8Array(e.target.result);

        pdfjsLib.getDocument(typedArray).then(function (pdf) {

            const viewer = document.getElementById("viewer");
            viewer.innerHTML = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

                pdf.getPage(pageNum).then(function (page) {

                    const scale = 1.5;
                    const viewport = page.getViewport(scale);

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

let rendition;

function abrirEPUB(file) {
    ocultar()
    const reader = new FileReader();

    reader.onload = function (e) {
        const book = ePub(e.target.result);

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


function ocultar() {
    dropZone.style.display = "none";
    viewer.style.display = "block";
}

function mostrar() {
    dropZone.style.display = "block";
    viewer.style.display = "none";
}