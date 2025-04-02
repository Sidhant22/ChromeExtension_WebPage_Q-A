Webpage Q&A Chrome Extension
🚀 A Chrome extension that extracts webpage content and lets users ask AI-powered questions based on the page context. Built using Langchain and OpenAI.

Features
✅ Extracts webpage content in real-time
✅ Allows users to ask questions about the page
✅ Uses Langchain for document processing
✅ Simple and lightweight Chrome extension

Demo
📸 ![image](https://github.com/user-attachments/assets/7f8388ad-03af-455f-8535-fe2e0c3a2b52)
![Screenshot 2025-03-31 120654](https://github.com/user-attachments/assets/67d8a14d-6aa4-4f1b-b7fe-2f076186a832)
![Screenshot 2025-03-31 121848](https://github.com/user-attachments/assets/c6f22cdb-1e40-419b-bb04-e5d5cacf22c6)

Architecture Overview
This project consists of:
1️⃣ Chrome Extension – Frontend interface for user interactions
2️⃣ Backend API – Processes webpage content and handles LLM interactions using Langchain
3️⃣ Document Loading – Extracts and processes webpage content in real-time

Project Structure
my-extension/
├── manifest.json      # Defines extension structure & permissions
├── popup.html         # UI for user interactions
├── popup.js           # Handles frontend logic
├── background.js      # Manages extension lifecycle & API communication
├── content.js         # Extracts content from webpages
└── styles.css         # UI styling

How It Works
1️⃣ User browses a webpage
2️⃣ Extension extracts the page content
3️⃣ User asks a question in the popup
4️⃣ Content is sent to the backend
5️⃣ Langchain processes the content & AI generates a response
6️⃣ Response is displayed in the extension

Installation
1. Clone the repository:
git clone https://github.com/your-username/repository-name.git
Open Chrome and go to chrome://extensions/
2. Enable Developer Mode (toggle on top-right)
3. Click Load Unpacked and select the project folder
4. The extension is now installed!

Contributing
Feel free to open issues or submit PRs. Suggestions and feedback are always welcome!
