// Example modified code in generate-questions.js
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const apiKey = process.env.GPT4_MINI_API_KEY;
        if (!apiKey) {
            console.error('Error: Missing API key.');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Missing API key.' })
            };
        }

        const requestBody = JSON.parse(event.body);
        const pdfText = requestBody.pdfText;
        const numOfFlashcards = requestBody.numOfFlashcards;

        // Make sure to generate the response in the correct format
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { "role": "system", "content": "You are a helpful assistant." },
                    { "role": "user", "content": `Generate ${numOfFlashcards} flashcards for the following text:\n\n${pdfText}` }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error with GPT-4o Mini API request:', errorText);
            throw new Error(`Error with GPT-4o Mini API: ${response.statusText}`);
        }

        const data = await response.json();

        // Here you need to parse the response and create an array of flashcards
        // Example parsing logic (modify according to your API's response)
        const flashcards = data.choices[0].message.content.split('\n---\n').map((cardText) => {
            const [questionLine, answerLine] = cardText.split('\n');
            return {
                question: questionLine.replace('Q:', '').trim(),
                answer: answerLine.replace('A:', '').trim()
            };
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ flashcards })
        };
    } catch (error) {
        console.error('Internal Server Error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
