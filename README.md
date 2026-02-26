Installation
npm install
Running the App

Development mode:

npm run dev

Production build:

npm run build
npm start

Default base URL:

http://localhost:3000




Tech stack
Node.js
Express
Typescsript
Jest
In memory instead of database


Features

Shortens long urls to 6 digit codes to be used with the base url

redirects from short code

tracks click counts

prevents duplicate entries but uses the same code for the same url

units tests for service layer


Architecture

Routes -> Controller -> Services -> Repos

Routes does http endpoints

Controller does requests and responses, parsing and some domain errors through http status codes

Service is the business logic, validates long urls, generates short codes, handles collisions and tracks clicks

Repos are the abstracted persistance layer for the in memory storage, easily swapped to something better like PostGres or Dynamo

app.ts does the init of the app and layers



API Endpoints
1. Shorten URL

POST /api/shorten

Request body:

{
  "url": "https://www.google.com"
}

Response:

{
  "code": "abc123",
  "longUrl": "https://www.google.com/",
  "shortUrl": "http://localhost:3000/abc123"
}




2. Redirect

GET /:code

Redirects (302) to the original URL.

Example:

GET /abc123




3. Metadata (Optional)

GET /api/:code

Returns stored metadata:

{
  "code": "abc123",
  "longUrl": "https://www.google.com/",
  "createdAt": 0000000000,
  "clicks": 3
}