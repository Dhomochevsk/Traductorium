


const contentviewer = document.getElementById("Contentviewer");
const viewer = document.getElementById("viewer");
const exitDoc = document.getElementById("exitDoc");
//------------------------------------------------------------------------
let book = null;
let rendition = null;
let pdfDoc = null;
let fontSize = 100; // porcentaje
let docModificado = false;
//------------------------------------------------------------------------


const dropZone = document.getElementById("drop-zone");

//-----------RIGHT----------------------------------------------------
const dropDocx = document.getElementById("drop-docx");
const contentDoc = document.getElementById("ContentDoc");
const editor = document.getElementById("editor");

editor.addEventListener("input", () => {
    docModificado = true;
});

exitDoc.addEventListener("click", e => {

    if (docModificado) {

        const confirmar = confirm(
            "Hay cambios sin guardar. ¿Estás seguro de que deseas cerrar el documento?"
        );

        if (!confirmar) {
            return;
        }

    }

    mostrarRight();

});

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

const sidebar = document.getElementById("chapterList");
const openMenu = document.getElementById("openMenu");

openMenu.addEventListener("click", (e) => {

    e.stopPropagation(); // evita que el clic llegue al document

    sidebar.classList.toggle("open");
});

document.addEventListener("click", (e) => {

    if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !openMenu.contains(e.target)
    ) {
        sidebar.classList.remove("open");
    }

});

function cargarCapitulos() {

    const chapterList = document.getElementById("chapterList");

    chapterList.innerHTML = "";

    book.loaded.navigation.then(function(nav) {

        nav.toc.forEach(function(chapter) {

            const link = document.createElement("a");

            link.href = "#";
            link.textContent = chapter.label;

            link.addEventListener("click", function(e) {

                e.preventDefault();

                rendition.display(chapter.href);

                chapterList.classList.remove("open");
            });

            chapterList.appendChild(link);
        });

    });
}

document.getElementById("chapterList")
.addEventListener("change", function() {

    if (this.value && rendition) {
        rendition.display(this.value);
    }

});


//--------------buscar--------------------------------

// Referencias
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");


// Muestra los resultados
function mostrarResultadosBusqueda(resultados) {

    searchResults.innerHTML = "";

    resultados.forEach(function(resultado) {

        const link = document.createElement("a");

        link.href = "#";
        const palabra = searchInput.value.trim();

        link.innerHTML = resultado.titulo.replace(
            new RegExp(`(${palabra})`, "gi"),
            "<mark>$1</mark>"
        );

        link.addEventListener("click", function(e) {

            e.preventDefault();

/*esto remplaza esto rendition.display(chapter.href); para resaltar resultados al buscar*/

                rendition.display(resultado.href).then(function() {

                    resaltarPalabraVisible(searchInput.value.trim());

                });
/**----------------------------------------------------------- */
                searchResults.classList.remove("open");

            });

        searchResults.appendChild(link);

    });

    if (resultados.length > 0) {
        searchResults.classList.add("open");
    } else {
        searchResults.classList.remove("open");
    }
}


async function buscarEnLibro(palabra) {

    const resultados = [];

    palabra = palabra.toLowerCase();

    for (const section of book.spine.spineItems) {

        try {

            const doc = await section.load(book.load.bind(book));

            const body = doc.querySelector("body");
            const texto = body ? body.textContent : "";
            const textoLower = texto.toLowerCase();

            let indice = 0;

            while ((indice = textoLower.indexOf(palabra, indice)) !== -1) {

                const inicio = Math.max(0, indice - 40);
                const fin = Math.min(texto.length, indice + palabra.length + 40);

                resultados.push({

                    titulo: texto.substring(inicio, fin).replace(/\s+/g, " "),
                    href: section.href

                });

                indice += palabra.length;

            }

            section.unload();

        } catch (e) {

            console.error(e);

        }

    }

    mostrarResultadosBusqueda(resultados);

}


let palabraBuscada = "";
searchInput.addEventListener("input", function () {

    const palabra = this.value.trim();

    if (palabra === "") {

        searchResults.innerHTML = "";
        searchResults.classList.remove("open");
        return;

    }

    palabraBuscada = palabra;
    buscarEnLibro(palabra);

});


// Cerrar la lista al hacer clic fuera
document.addEventListener("click", function(e) {

    if (!searchResults.contains(e.target) && e.target !== searchInput) {

        searchResults.classList.remove("open");

    }

});





function resaltarPalabraVisible(palabra) {

    const iframe = document.querySelector("#viewer iframe");

    if (!iframe) return;

    const doc = iframe.contentDocument;

    if (!doc) return;

    const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const regex = new RegExp(palabra, "gi");

    const textos = [];

    while (walker.nextNode()) {
        textos.push(walker.currentNode);
    }

    textos.forEach(function(textNode) {

        if (!regex.test(textNode.nodeValue)) return;

        regex.lastIndex = 0;

        const span = doc.createElement("span");

        span.innerHTML = textNode.nodeValue.replace(
            regex,
            "<mark>$&</mark>"
        );

        textNode.parentNode.replaceChild(span, textNode);

    });

}

//---------------------------------------------------------------------

const panelButons = document.getElementById("panelButons");
const titulo = document.getElementById("Titulo");

function ocultarLeft() {
    dropZone.style.display = "none";
    contentviewer.style.display = "block";

    openMenu.style.display="block";
    
    titulo.style.display="none";
    panelButons.classList.add("panel-disabled");
    panelButons.style.pointerEvents = "auto";
}

function mostrarLeft() {
    dropZone.style.display = "block";
    contentviewer.style.display = "none";

    openMenu.style.display="none";

    titulo.style.display="block";
    panelButons.style.pointerEvents = "none";
    panelButons.classList.remove("panel-disabled");

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
    docModificado = false;
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
        docModificado = false;
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
            docModificado = false;
        })
        .catch(error => {

            console.error("Error al abrir el DOCX:", error);

        });

    };

    reader.readAsArrayBuffer(file);

});


//---------------------------------------------------------------------------------

const panelButonsRight = document.getElementById("panelButonsRight");
const newDoc = document.getElementById("newDoc");


function ocultarRight() {
    dropDocx.style.display = "none";
    contentDoc.style.display = "block";

    panelButonsRight.classList.add("panel-disabled");
    newDoc.classList.add("button-disabled")
}

function mostrarRight() {
    dropDocx.style.display = "block";
    contentDoc.style.display = "none";

    panelButonsRight.classList.remove("panel-disabled");
    newDoc.classList.remove("button-disabled")
}

