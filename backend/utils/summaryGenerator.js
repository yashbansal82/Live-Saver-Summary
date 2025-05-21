const { OpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function extractContent(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Get text content from body
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.substring(0, 4000); // Limit content length
  } catch (error) {
    console.error('Error extracting content:', error);
    throw new Error('Failed to extract content from URL');
  }
}

async function generateSummary(url) {
  try {
    const content = await extractContent(url);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise summaries of web content. Focus on the main points and key information."
        },
        {
          role: "user",
          content: `Please provide a concise summary of the following content:\n\n${content}`
        }
      ],
      max_tokens: 150
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}

module.exports = { generateSummary }; 