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
        const { pdfText, numFlashcards } = JSON.parse(event.body);

        if (!apiKey) {
            console.error('Error: Missing API key.');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Missing API key.' })
            };
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
                    { "role": "system", "content": "You are a helpful assistant." },
                    { "role": "user", "content": `Generate ${numFlashcards} flashcards with questions and answers based on the following text: ${pdfText}` }
                ],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error with GPT-4o Mini API request:', errorText);
            throw new Error(`Error with GPT-4o Mini API: ${response.statusText}`);
        }

        const data = await response.json();

        // Assuming GPT-4 Mini response structure is in data.choices[0].message.content
        const flashcards = JSON.parse(data.choices[0].message.content); // This assumes GPT returns JSON formatted flashcards

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ questions: flashcards })
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
