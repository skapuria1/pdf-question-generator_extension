// Set the path to the pdf.worker.js file
pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';

document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('uploadPdf');
    if (fileInput.files.length === 0) {
        alert('Please select a PDF file.');
        return;
    }

    // Extract text from the PDF using PDF.js
    const file = fileInput.files[0];
    const text = await extractTextFromPdf(file);

    // Send the text to the Netlify function
    const response = await fetch('https://your-netlify-function-url/.netlify/functions/generate-questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pdfText: text })
    });

    const data = await response.json();
    document.getElementById('output').innerText = data.questions;
});

// Function to extract text from the PDF file using PDF.js
async function extractTextFromPdf(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function () {
            const typedArray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ');
            }
            resolve(text);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
