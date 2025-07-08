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
        QRCode.toCanvas(document.createElement('canvas'), input, { width: 200 }, (error, canvas) => {
            if (error) console.error(error);
            output.appendChild(canvas);
            document.getElementById("downloadBtn").style.display = "block";
        });
    } else if (type === "barcode") {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, input, { format: "CODE128" });
        output.appendChild(canvas);
        document.getElementById("downloadBtn").style.display = "block";
    }
}

function downloadImage() {
    const canvas = document.querySelector("#codeOutput canvas");
    const link = document.createElement('a');
    link.href = canvas.toDataURL("image/png");
    link.download = "generated-code.png";
    link.click();
}
