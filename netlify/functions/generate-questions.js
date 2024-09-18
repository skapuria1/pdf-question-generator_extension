const fetch = require('node-fetch');

exports.handler = async (event) => {
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
        const { pdfText, numOfFlashcards } = JSON.parse(event.body);

        if (!pdfText || !numOfFlashcards) {
            console.error('Invalid input data.');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid input data.' })
            };
        }

        // Adjust this prompt as needed for better responses
        const prompt = `Generate ${numOfFlashcards} flashcards with questions and answers based on the following content: "${pdfText}". Provide each in the format: "Q: question?" "A: answer"`;

        // Make a request to GPT-4 Mini API
        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GPT4_MINI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                prompt: prompt,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error with GPT-4 Mini API request:', errorText);
            throw new Error(`Error with GPT-4 Mini API: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        // Check if data is structured as expected
        if (!data.choices || data.choices.length === 0) {
            console.error('Unexpected API response structure:', data);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Unexpected API response structure.' })
            };
        }

        // Process the response into flashcards
        const flashcards = data.choices[0].text
            .split('\n')
            .filter(line => line.trim() !== '') // Ignore empty lines
            .map(line => {
                const parts = line.split('Q:');
                if (parts.length < 2) {
                    return { question: '', answer: line.trim() }; // Only answer provided
                }
                return {
                    question: 'Q: ' + parts[1].split('A:')[0].trim(),
                    answer: 'A: ' + (parts[1].split('A:')[1] || '').trim()
                };
            });

        console.log('Processed flashcards:', flashcards);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ flashcards })
        };
    } catch (error) {
        console.error('Internal Server Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
