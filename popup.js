// Set the path to the local pdf.worker.js file
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
    console.log('Extracted text:', text); // Debugging output

    // Send the text to the Netlify function
    try {
        const response = await fetch('https://studyguidegenerator.netlify.app/.netlify/functions/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pdfText: text })
        });

        console.log('Response status:', response.status); // Debugging output
        const data = await response.json();
        console.log('Response data:', data); // Debugging output

        document.getElementById('output').innerText = data.questions || 'No questions generated.';
    } catch (error) {
        console.error('Error fetching questions:', error);
        document.getElementById('output').innerText = 'Error generating questions.';
    }
});


// Function to extract text from the PDF file using PDF.js
async function extractTextFromPdf(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function () {
            try {
                const typedArray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    // Extract text from the page
                    const pageText = content.items.map(item => item.str).join(' ');
                    console.log(`Page ${i} text:`, pageText); // Debugging output
                    text += pageText + ' ';
                }
                resolve(text);
            } catch (error) {
                console.error('Error extracting text:', error);
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

