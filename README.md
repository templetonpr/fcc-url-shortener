# URL Shortener
Microservice to shorten URLs using Node, Express, and PostgreSQL

Live version here:
Note: This is a *demonstration* project. Bookmark at your own peril.

---

### Usage

Human users:
- Use the form at /new

Robot users:
- POST a valid URL to /new in the format `{"original_url": "your url here"}`
- The server will respond with `{ "original_url": "your original url", "short_url": "your shortened url"}`
- In the event of an error, the server will respond with `{"error": "Error message here"}`
---

### To Do

[ ] Tests
[ ] Make index.html and newUrl.html easier on the eyes with some better styling
[ ] Some kind of Stats thing?
