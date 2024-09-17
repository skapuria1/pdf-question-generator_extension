const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const { pdfText } = JSON.parse(event.body);

    // Call the GPT-4 Mini API using the secure API key stored in Netlify
    const apiKey = process.env.GPT4_MINI_API_KEY;
    const response = await fetch('https://api.gpt4mini.com/v1/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            prompt: `Generate questions from this text: ${pdfText}`,
            max_tokens: 500
        })
    });

    const data = await response.json();
    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
};
