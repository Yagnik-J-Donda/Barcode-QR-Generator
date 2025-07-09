function generateCode() {
    const input = document.getElementById("userInput").value;
    const type = document.getElementById("codeType").value;
    const output = document.getElementById("codeOutput");
    output.innerHTML = ""; // Clear previous

    if (input.trim() === "") {
        alert("Please enter something to generate!");
        return;
    }

    if (type === "qr") {
        // ✅ Generate QR Code as SVG and insert directly (no size hacks)
        QRCode.toString(input, { type: 'svg' }, function (err, svgString) {
            if (err) throw err;
            output.innerHTML = svgString; // Directly inject SVG into DOM
            document.getElementById("downloadBtnSVG").style.display = "inline-block";
            document.getElementById("downloadBtnPDF").style.display = "inline-block";
        });

    } else if (type === "barcode") {
        // ✅ Create and append empty SVG first
        const svgElement = document.createElement('svg');
        svgElement.setAttribute("width", "300");
        svgElement.setAttribute("height", "100");
        svgElement.setAttribute("viewBox", "0 0 300 100"); // Infinite scaling

        output.appendChild(svgElement);

        // Render Barcode
        JsBarcode(svgElement, input, {
            format: "CODE128",
            displayValue: true,
            fontSize: 20,
            width: 2,
            height: 100,
            margin: 10
        });

        document.getElementById("downloadBtnSVG").style.display = "inline-block";
        document.getElementById("downloadBtnPDF").style.display = "inline-block";
    }
}



function downloadSVG() {
    const svg = document.querySelector("#codeOutput svg");
    if (!svg) {
        alert("No code to download!");
        return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "generated-code.svg";
    link.click();
}

function downloadPDF() {
    const svg = document.querySelector("#codeOutput svg");
    if (!svg) {
        alert("No code to download!");
        return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const pdf = new jspdf.jsPDF();
        pdf.addImage(canvas, 'PNG', 10, 10, 180, 180);
        pdf.save("generated-code.pdf");
    };
    img.src = url;
}

function decodeCode() {
    const fileInput = document.getElementById('uploadInput');
    const resultBox = document.getElementById('decodedText');

    if (fileInput.files.length === 0) {
        alert("Please upload an image first!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const fileType = file.type;

        if (fileType === "image/svg+xml") {
            // 🖼 Rasterize SVG to Canvas
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                processImage(canvas);
            };
            img.src = event.target.result;
        } else {
            // 🖼 Directly process PNG/JPEG
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                processImage(canvas);
            };
            img.src = event.target.result;
        }
    };

    reader.readAsDataURL(file);
}

function processImage(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const resultBox = document.getElementById('decodedText');

    // Try decoding QR Code first
    const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
    if (qrCode) {
        resultBox.innerText = "📦 Decoded QR Code: " + qrCode.data;
    } else {
        // Then try Barcode decoding
        Quagga.decodeSingle({
            src: canvas.toDataURL("image/png"), // Use rasterized image
            numOfWorkers: 0,
            inputStream: {
                size: 800
            },
            decoder: {
                readers: [
                    "code_128_reader", "ean_reader", "ean_8_reader",
                    "code_39_reader", "upc_reader", "upc_e_reader"
                ]
            },
            locate: true
        }, function(result) {
            if (result && result.codeResult) {
                resultBox.innerText = "📦 Decoded Barcode: " + result.codeResult.code;
            } else {
                resultBox.innerText = "❌ No QR or Barcode detected.";
            }
        });
    }
}

