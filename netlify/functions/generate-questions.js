const fetch = require('node-fetch');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    try {
        const { pdfText, numOfFlashcards } = JSON.parse(event.body);

        const apiKey = process.env.GPT4_MINI_API_KEY;
        if (!apiKey) {
            throw new Error('Missing API key');
        }

        // API request to GPT-4o Mini for generating flashcards
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that generates flashcards for exam preparation."
                    },
                    {
                        "role": "user",
                        "content": `Generate ${numOfFlashcards} flashcards with questions and answers based on the following content: "${pdfText}". Provide each in the format: "Q: [question]" "A: [answer]"`
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`Error with GPT-4o Mini API: ${response.statusText}`);
        }

        const data = await response.json();
        const generatedContent = data.choices[0].message.content.trim();

        // Parse the response into a usable format
        const flashcards = generatedContent.split('\n').map(item => {
            const [question, answer] = item.split('A:');
            return {
                question: question.replace('Q:', '').trim(),
                answer: answer.trim(),
            };
        }).filter(card => card.question && card.answer);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ flashcards }),
        };
    } catch (error) {
        console.error('Error generating flashcards:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
