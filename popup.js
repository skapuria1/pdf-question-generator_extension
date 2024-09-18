console.log('popup.js loaded'); // Debugging output

// Set the path to the local pdf.worker.js file
pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';

document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('uploadPdf');
    const flashcardCountInput = document.getElementById('flashcardCount'); // New input for the number of flashcards
    
    if (fileInput.files.length === 0) {
        alert('Please select a PDF file.');
        return;
    }

    if (!flashcardCountInput.value || isNaN(flashcardCountInput.value) || flashcardCountInput.value <= 0) {
        alert('Please enter a valid number of flashcards.');
        return;
    }

    const numberOfFlashcards = parseInt(flashcardCountInput.value);

    // Extract text from the PDF using PDF.js
    try {
        const file = fileInput.files[0];
        const text = await extractTextFromPdf(file);
        console.log('Extracted text:', text); // Debugging output

        // Send the text to the Netlify function
        const response = await fetch('https://studyguidegenerator.netlify.app/.netlify/functions/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                pdfText: text,
                numFlashcards: numberOfFlashcards // Send the number of flashcards requested
            })
        });

        console.log('Response status:', response.status); // Debugging output
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data); // Debugging output

        // Create flashcards using the format in flashcards.html
        if (data.questions) {
            generateFlashcards(data.questions);
        } else {
            document.getElementById('output').innerText = 'No questions generated.';
        }
    } catch (error) {
        console.error('Error generating questions:', error);
        document.getElementById('output').innerText = `Error generating questions: ${error.message}`;
    }
});

// Function to generate flashcards in the specified format
function generateFlashcards(questions) {
    const flashcardContainer = document.querySelector('.flashcard-container');
    flashcardContainer.innerHTML = ''; // Clear previous flashcards

    questions.forEach((question, index) => {
        const flashcard = document.createElement('div');
        flashcard.className = 'flashcard';
        flashcard.id = `flashcard-${index}`;
        flashcard.onclick = () => flipCard(index);

        const flashcardFront = document.createElement('div');
        flashcardFront.className = 'flashcard-front';
        flashcardFront.innerHTML = `<div class="question">${question.question}</div>`;

        const flashcardBack = document.createElement('div');
        flashcardBack.className = 'flashcard-back';
        flashcardBack.innerHTML = `<div class="answer">${question.answer}</div>`;

        flashcard.appendChild(flashcardFront);
        flashcard.appendChild(flashcardBack);
        flashcardContainer.appendChild(flashcard);
    });
}

// Function to extract text from the PDF file using PDF.js (same as before)
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
                    console.log(`Page ${i} text:`, pageText); // Debugging output
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
