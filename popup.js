console.log('popup.js loaded');

// Set the path to the local pdf.worker.js file
pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';

document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('uploadPdf');
    if (fileInput.files.length === 0) {
        alert('Please select a PDF file.');
        return;
    }

    const numFlashcardsInput = document.getElementById('numFlashcards'); // Get the input field for number of flashcards

    // Validate the number of flashcards
    const numOfFlashcards = parseInt(numFlashcardsInput.value, 10);
    if (isNaN(numOfFlashcards) || numOfFlashcards <= 0) {
        alert('Please enter a valid number of flashcards.');
        return;
    }

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
                numOfFlashcards: numOfFlashcards,
                prompt: `Generate ${numOfFlashcards} flashcards with questions and answers based on the following content: "${text}". Provide each in the format: "Q: question?" "A: answer"`
            })
        });

        console.log('Response status:', response.status); // Debugging output
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data); // Debugging output

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
    let flashcardsData = flashcards.map((fc, index) => `{
        question: '${fc.question}',
        answer: '${fc.answer}'
    }`).join(',');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Flashcards</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        .flashcard-container {
            position: relative;
            width: 300px;
            height: 200px;
            perspective: 1000px;
        }
        .flashcard {
            width: 100%;
            height: 100%;
            text-align: center;
            transition: transform 0.6s;
            transform-style: preserve-3d;
            position: relative;
            cursor: pointer;
        }
        .flashcard.flipped {
            transform: rotateY(180deg);
        }
        .flashcard-front, .flashcard-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .flashcard-front {
            background-color: #fff;
            border: 1px solid #ddd;
        }
        .flashcard-back {
            background-color: #4CAF50;
            color: white;
            transform: rotateY(180deg);
            border: 1px solid #4CAF50;
        }
        .navigation {
            margin-top: 20px;
        }
        .nav-button {
            padding: 10px 20px;
            margin: 0 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 5px;
        }
        .nav-button:disabled {
            background-color: #ddd;
            cursor: not-allowed;
        }
        .question-list {
            margin-top: 30px;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            width: 300px;
            text-align: left;
            background-color: #fff;
        }
        .question-list div {
            cursor: pointer;
            padding: 5px;
            border-bottom: 1px solid #eee;
        }
        .question-list div:hover {
            background-color: #f1f1f1;
        }
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
