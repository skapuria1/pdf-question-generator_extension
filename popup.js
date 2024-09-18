document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('uploadPdf'); // Updated ID here
    if (fileInput.files.length === 0) {
        alert('Please select a PDF file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            // Using PDF.js to extract text from the uploaded PDF
            const typedArray = new Uint8Array(event.target.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                text += pageText + '\n';
            }

            // Log the extracted text for debugging
            console.log('Extracted PDF text:', text);

            // Limit the text length for testing purposes
            const limitedText = text.slice(0, 500); // Limit to 500 characters for testing
            const payload = JSON.stringify({ pdfText: limitedText });

            // Call the Netlify function
            const response = await fetch('https://studyguidegenerator.netlify.app/.netlify/functions/generate-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: payload
            });

            if (!response.ok) {
                const errorText = await response.text(); // Capture error response
                console.error('Error from Netlify function:', errorText); // Log error details
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Generated Questions:', data.questions);

            // Output the generated questions
            document.getElementById('output').textContent = data.questions;
        } catch (error) {
            console.error('Error generating questions:', error);
            alert('Error generating questions. Please check the console for more details.');
        }
    };

    reader.readAsArrayBuffer(file);
});
