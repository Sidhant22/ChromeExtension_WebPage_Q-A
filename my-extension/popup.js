// Variables to store state
let sessionId = null;
let processing = false;

let sessionCheckInterval = null;

// DOM elements
const statusElement = document.getElementById('status');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');

const sessionIndicator = document.getElementById('session-indicator');

// Update the session indicator
function updateSessionIndicator() {
  if (sessionId) {
    sessionIndicator.textContent = '● Connected';
    sessionIndicator.style.color = '#4CAF50';
  } else {
    sessionIndicator.textContent = '○ Disconnected';
    sessionIndicator.style.color = '#F44336';
  }
}

function startSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }
  
  // Check session every 10 seconds
  sessionCheckInterval = setInterval(() => {
    checkSession();
  }, 10000);
}

// Check session status
function checkSession() {
  chrome.runtime.sendMessage({action: "getSessionStatus"}, (response) => {
    if (response.hasSession !== (sessionId !== null)) {
      sessionId = response.hasSession ? response.sessionId : null;
      updateSessionIndicator();
      
      if (!sessionId) {
        statusElement.textContent = 'Session expired. Please reload.';
        statusElement.style.color = '#F44336';
      }
    }
  });
}


// Initialize when popup is opened
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we have an active session
  chrome.runtime.sendMessage({action: "getSessionStatus"}, (response) => {
    if (response.hasSession) {
      sessionId = response.sessionId;
      statusElement.textContent = 'Ready to chat!';
      statusElement.style.color = '#4CAF50';
      updateSessionIndicator();
    } else {
      // No active session, request to process the page
      statusElement.textContent = 'Processing page...';
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const activeTab = tabs[0];
        chrome.runtime.sendMessage({
          action: "processPage", 
          tabId: activeTab.id
        });
      });
    }
    startSessionCheck();
  });
  
  // Listen for page processed events
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "pageProcessed") {
      sessionId = request.sessionId;
      statusElement.textContent = 'Ready to chat!';
      statusElement.style.color = '#4CAF50';
      updateSessionIndicator();
    }
    return true;
  });
});

// Send message when button is clicked
sendButton.addEventListener('click', sendMessage);

// Or when Enter key is pressed
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Function to send message
async function sendMessage() {
  const userText = userInput.value.trim();
  
  if (userText === '' || processing) {
    return;
  }
  
  // Clear input
  userInput.value = '';
  processing = true;
  
  // Add user message to chat
  addMessage(userText, 'user');
  
  // Add loading indicator
  const loadingElement = document.createElement('div');
  loadingElement.className = 'message bot-message';
  loadingElement.innerHTML = '<div class="loading"></div>';
  chatMessages.appendChild(loadingElement);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: "sendChatMessage",
    query: userText
  }, (response) => {
    // Remove loading indicator
    chatMessages.removeChild(loadingElement);
    
    if (response.status === 'success') {
      addMessage(response.answer, 'bot');
    } else {
      addMessage('Error: ' + response.message, 'bot');
    }
    
    processing = false;
  });
}

// Function to add message to chat
function addMessage(text, sender) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}-message`;

  // Add speaker label
  const speakerLabel = document.createElement('div');
  speakerLabel.className = 'speaker-label';
  speakerLabel.textContent = sender === 'user' ? 'You:' : 'AI:';
  messageElement.appendChild(speakerLabel);

  // Add message content
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = text;
  messageElement.appendChild(messageContent);  

  // messageElement.textContent = text;
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}