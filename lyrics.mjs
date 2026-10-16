// Shared handler: receives a prompt, calls the Gemini API and returns the text (keeps the API key on the server).
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"; // Model name: from the environment, else a default free model

export default async function handler(req, res) { // Request handler used by both Vercel and the local server
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" }); // Reject anything that is not a POST request
  const prompt = (req.body && req.body.prompt) || ""; // Read the prompt from the request body (empty if missing)
  if (!prompt || prompt.length > 6000) return res.status(400).json({ error: "Invalid prompt" }); // Reject empty or oversized prompts

  try { // Attempt the API call
    const r = await fetch( // Send an HTTP request to Gemini
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, // Gemini endpoint for the chosen model
      { // Request options
        method: "POST", // Gemini expects a POST
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, // JSON body plus the secret API key
        body: JSON.stringify({ // Convert the request payload to JSON
          contents: [{ parts: [{ text: prompt }] }], // The prompt text to send to the model
          generationConfig: { // Settings that control the output
            temperature: 0.9, // Higher value = more creative output
            maxOutputTokens: 4096, // Maximum length of the reply
            // Gemini 2.5 Flash "thinks" first and those tokens count against the limit, so turn thinking off to avoid cut-off lyrics
            ...(/2\.5-flash/.test(MODEL) ? { thinkingConfig: { thinkingBudget: 0 } } : {}), // Only add this setting for 2.5 Flash models
          }, // End of generationConfig
        }), // End of JSON body
      } // End of request options
    ); // End of fetch call
    const data = await r.json(); // Parse Gemini's JSON response
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: data.error?.message || "Upstream error" }); // Pass rate-limit errors through; report other failures as 502
    const cand = data.candidates?.[0]; // Take the first candidate reply
    let text = (cand?.content?.parts || []).map(p => p.text || "").join(""); // Join all text parts into one string
    if (text && cand?.finishReason === "MAX_TOKENS") text += "\n\n[Output hit the length limit. Press Try again or shorten the request.]"; // Warn if the reply was truncated
    if (!text) return res.status(502).json({ error: "Empty response" }); // Treat a blank reply as an error
    res.status(200).json({ text }); // Send the generated text back to the browser
  } catch (e) { // If the request itself failed (network, bad JSON, etc.)
    res.status(500).json({ error: "Server error" }); // Return a generic server error
  } // End of try/catch
} // End of handler