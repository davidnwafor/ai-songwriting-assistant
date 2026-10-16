// Zero-dependency local dev server: serves /public and routes /api/lyrics to the shared handler.
const http = require("http"); // Built-in module for creating a web server
const fs = require("fs"); // Built-in module for reading files
const path = require("path"); // Built-in module for building file paths

// Load .env.local / .env (simple KEY=value parser)
for (const f of [".env.local", ".env"]) { // Check each env file name in order
  const p = path.join(__dirname, f); // Full path to that file
  if (!fs.existsSync(p)) continue; // Skip it if it does not exist
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) { // Read the file and go through it line by line
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i); // Match lines shaped like KEY=value
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); // Save the value (minus quotes) unless it is already set
  } // End of line loop
} // End of env file loop

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" }; // Maps file extensions to content types

http.createServer(async (req, res) => { // Create the server; this runs for every request
  const url = new URL(req.url, "http://localhost"); // Parse the requested URL

  if (url.pathname === "/api/lyrics") { // If the request is for the lyrics API
    const { default: handler } = await import("./lib/lyrics.mjs"); // Load the shared handler
    let body = ""; // Will hold the raw request body
    for await (const chunk of req) body += chunk; // Read the body in pieces and join them
    try { req.body = JSON.parse(body || "{}"); } catch { req.body = {}; } // Parse JSON, falling back to an empty object
    res.status = c => { res.statusCode = c; return res; }; // Add a status() helper so the handler works like on Vercel
    res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); }; // Add a json() helper that sends a JSON reply
    return handler(req, res); // Run the handler and stop here
  } // End of API route

  const file = path.join(__dirname, "public", url.pathname === "/" ? "index.html" : url.pathname); // Map the URL to a file in /public (/ becomes index.html)
  if (!file.startsWith(path.join(__dirname, "public")) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { // Block paths outside /public, missing files and folders
    res.statusCode = 404; return res.end("Not found"); // Reply with 404 Not Found
  } // End of file check
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream"); // Set the content type from the file extension
  fs.createReadStream(file).pipe(res); // Stream the file to the browser
}).listen(3000, () => { // Start listening on port 3000
  console.log("Songwriting Assistant running at http://localhost:3000"); // Tell the user where to open the app
  if (!process.env.GEMINI_API_KEY) console.log("GEMINI_API_KEY not found. Add it to .env.local"); // Warn if the key is missing
}); // End of server setup