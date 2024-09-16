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

    //  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
};
