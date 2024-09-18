const fetch = require('node-fetch');

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

        const { pdfText, numOfFlashcards } = JSON.parse(event.body);
        if (!pdfText || !numOfFlashcards) {
            throw new Error('Invalid input: pdfText and numOfFlashcards are required.');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: `Generate ${numOfFlashcards} flashcards with questions and answers based on the following content: "${pdfText}". Provide each in the format: "Q: question?" "A: answer"` }
                ],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error with GPT-4 Mini API request:', errorText);
            throw new Error(`Error with GPT-4 Mini API: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        const flashcards = data.choices[0].message.content
            .split("\n\n")
            .filter(line => line.includes("Q:") && line.includes("A:"))
            .map(flashcard => {
                const [question, answer] = flashcard.split("A:").map(part => part.trim());
                return { question: question.replace("Q:", "").trim(), answer };
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
