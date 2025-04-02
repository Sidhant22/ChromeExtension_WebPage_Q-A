Webpage Q&A Chrome Extension
🚀 A Chrome extension that extracts webpage content and lets users ask AI-powered questions based on the page context. Built using Langchain and OpenAI.

Features
-  Extracts webpage content in real-time
-  Allows users to ask questions about the page
-  Uses Langchain for document processing
-  Simple and lightweight Chrome extension

Demo
📸 ![image](https://github.com/user-attachments/assets/7f8388ad-03af-455f-8535-fe2e0c3a2b52)
![Screenshot 2025-03-31 120654](https://github.com/user-attachments/assets/67d8a14d-6aa4-4f1b-b7fe-2f076186a832)
![Screenshot 2025-03-31 121848](https://github.com/user-attachments/assets/c6f22cdb-1e40-419b-bb04-e5d5cacf22c6)

Architecture Overview
This project consists of:
1. Chrome Extension – Frontend interface for user interactions
2. Backend API – Processes webpage content and handles LLM interactions using Langchain
3. Document Loading – Extracts and processes webpage content in real-time

Project Structure

1. manifest.json:    Defines extension structure & permissions
2. popup.html :      UI for user interactions
3. popup.js  :       Handles frontend logic
4. background.js :   Manages extension lifecycle & API communication
5.  content.js :     Extracts content from webpages
6.  styles.css :     UI styling

How It Works
1. User browses a webpage
2. Extension extracts the page content
3. User asks a question in the popup
4. Content is sent to the backend
5. Langchain processes the content & AI generates a response
6. Response is displayed in the extension

Installation
1. Clone the repository:
git clone https://github.com/your-username/repository-name.git
Open Chrome and go to chrome://extensions/
2. Enable Developer Mode (toggle on top-right)
3. Click Load Unpacked and select the project folder
4. The extension is now installed!

Contributing
Feel free to open issues or submit PRs. Suggestions and feedback are always welcome!
