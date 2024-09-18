const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Define CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    // Handle preflight (OPTIONS) request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Handle the main request
    try {
        // Retrieve the GPT-4 Mini API key from Netlify environment variables
        const apiKey = process.env.GPT4O_MINI_API_KEY;

        // Call the GPT-4 Mini API to test the connection
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Use the correct model name
                messages: [
                    { "role": "system", "content": "You are a helpful assistant." },
                    { "role": "user", "content": "This is a connection test. Please confirm." }
                ],
                max_tokens: 10 // Keep the response short
            })
        });

        if (!response.ok) {
            throw new Error(`Error with GPT-4 Mini API request: ${response.statusText}`);
        }

        const data = await response.json();

        // Return the confirmation response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ confirmation: data.choices[0].message.content.trim() })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
