console.log('popup.js loaded');

// Set the path to the local pdf.worker.js file
pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';

document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('uploadPdf');
    const numFlashcardsInput = document.getElementById('numFlashcards'); // Get the number of flashcards

    if (fileInput.files.length === 0) {
        alert('Please select a PDF file.');
        return;
    }

    // Validate the number of flashcards
    const numberOfFlashcards = parseInt(numFlashcardsInput.value, 10);
    if (isNaN(numberOfFlashcards) || numberOfFlashcards <= 0) {
        alert('Please enter a valid number of flashcards.');
        return;
    }

    // Extract text from the PDF using PDF.js
    try {
        const file = fileInput.files[0];
        const text = await extractTextFromPdf(file);
        console.log('Extracted text:', text);

        // Send the text to the Netlify function
        const response = await fetch('https://studyguidegenerator.netlify.app/.netlify/functions/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pdfText: text, numberOfFlashcards }) // Include the number of flashcards
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        // Display the flashcards
        document.getElementById('output').innerText = data.flashcards || 'No flashcards generated.';
    } catch (error) {
        console.error('Error generating flashcards:', error);
        document.getElementById('output').innerText = `Error generating flashcards: ${error.message}`;
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
                    const pageText = content.items.map(item => item.str).join(' ');
                    console.log(`Page ${i} text:`, pageText);
                    text += pageText + ' ';
                }
                resolve(text);
            } catch (error) {
                console.error('Error extracting text:', error);
                reject(error);
            }
        };
        reader.onerror = (e) => {
            console.error('FileReader error:', e);
            reject(e);
        };
        reader.readAsArrayBuffer(file);
    });
}
