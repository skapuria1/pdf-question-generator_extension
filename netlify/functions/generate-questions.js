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
                    { "role": "user", "content": "This is a connection test. Please confirm." }
                ],
                max_tokens: 10
            })
        });
        
        // Log the response text before parsing
        const responseText = await response.text();
        console.log('Full response:', responseText);
        
        // Attempt to parse the JSON
        if (!response.ok) {
            console.error('Error with GPT-4o Mini API request:', responseText);
            throw new Error(`Error with GPT-4o Mini API: ${response.statusText}`);
        }
        
        const data = JSON.parse(responseText);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ confirmation: data.choices[0].message.content.trim() })
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
