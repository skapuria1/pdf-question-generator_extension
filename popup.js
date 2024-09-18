console.log('popup.js loaded');

// Set the path to the local pdf.worker.js file
pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';

document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('uploadPdf');
    if (fileInput.files.length === 0) {
        alert('Please select a PDF file.');
        return;
    }

    // Extract text from the PDF using PDF.js
    try {
        const file = fileInput.files[0];
        const text = await extractTextFromPdf(file);
        console.log('Extracted text:', text); // Debugging output

        // Ask the user for the number of flashcards
        const numOfFlashcards = parseInt(prompt("How many flashcards would you like to generate?", "5"), 10);

        if (isNaN(numOfFlashcards) || numOfFlashcards <= 0) {
            alert('Please enter a valid number of flashcards.');
            return;
        }

        // Send the text to the Netlify function
        const response = await fetch('https://studyguidegenerator.netlify.app/.netlify/functions/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                pdfText: text, 
                numOfFlashcards: numOfFlashcards 
            })
        });

        console.log('Response status:', response.status); // Debugging output
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data); // Debugging output

        // Check if 'flashcards' is an array and contains the expected structure
        if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
            throw new Error('Invalid response format: Expected an array of flashcards');
        }

        // Generate the flashcards HTML
        const flashcardsHtml = generateFlashcardsHtml(data.flashcards);

        // Give the user an option to download or view the HTML
        const download = confirm("Flashcards generated. Would you like to download them?");
        if (download) {
            downloadHtmlFile(flashcardsHtml);
        } else {
            viewInBrowser(flashcardsHtml);
        }

    } catch (error) {
        console.error('Error generating flashcards:', error);
        document.getElementById('output').innerText = `Error generating flashcards: ${error.message}`;
    }
});

// Function to generate flashcards HTML
function generateFlashcardsHtml(flashcards) {
    let flashcardsData = flashcards.map((fc, index) => `
        { question: '${fc.question}', answer: '${fc.answer}' }`
    ).join(',');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Flashcards</title>
    <style>
        /* Your CSS from flashcards.html */
    </style>
</head>
<body>
    <div class="container">
        <div class="flashcard-container">
            <div class="flashcard" id="flashcard" onclick="flipCard()">
                <div class="flashcard-front">
                    <div class="question"></div>
                </div>
                <div class="flashcard-back">
                    <div class="answer"></div>
                </div>
            </div>
        </div>
        <div class="navigation">
            <button class="nav-button" id="prevBtn" onclick="prevCard()">Previous</button>
            <button class="nav-button" id="nextBtn" onclick="nextCard()">Next</button>
        </div>
        <div class="question-list">
            ${flashcards.map((fc, index) => `<div onclick="goToCard(${index})">${index + 1}. ${fc.question}</div>`).join('')}
        </div>
    </div>

    <script>
        const flashcards = [${flashcardsData}];

        let currentCardIndex = 0;

        function flipCard() {
            const flashcardElement = document.getElementById('flashcard');
            flashcardElement.classList.toggle('flipped');
        }

        function updateFlashcard() {
            const flashcardElement = document.getElementById('flashcard');
            const front = flashcardElement.querySelector('.flashcard-front .question');
            const back = flashcardElement.querySelector('.flashcard-back .answer');

            front.textContent = flashcards[currentCardIndex].question;
            back.textContent = flashcards[currentCardIndex].answer;

            // Reset flip when switching cards
            flashcardElement.classList.remove('flipped');

            document.getElementById('prevBtn').disabled = currentCardIndex === 0;
            document.getElementById('nextBtn').disabled = currentCardIndex === flashcards.length - 1;
        }

        function nextCard() {
            if (currentCardIndex < flashcards.length - 1) {
                currentCardIndex++;
                updateFlashcard();
            }
        }

        function prevCard() {
            if (currentCardIndex > 0) {
                currentCardIndex--;
                updateFlashcard();
            }
        }

        function goToCard(index) {
            currentCardIndex = index;
            updateFlashcard();
        }

        // Initialize the first flashcard
        updateFlashcard();
    </script>
</body>
</html>
`;
}

// Function to prompt user to download HTML
function downloadHtmlFile(htmlContent) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards.html';
    a.click();
    URL.revokeObjectURL(url);
}

// Function to view HTML in a new browser tab
function viewInBrowser(htmlContent) {
    const newWindow = window.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
}

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
