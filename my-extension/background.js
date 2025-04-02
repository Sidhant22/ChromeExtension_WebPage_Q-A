// Variables to store state
let currentSessionId = null;
const API_BASE_URL = "http://localhost:5000"; // Change when deploying

// Function to start session refresh interval
function startSessionRefresh() {
  if (sessionRefreshInterval) {
      clearInterval(sessionRefreshInterval);
  }
  
  if (currentSessionId) {
      // Refresh session every 30 seconds
      sessionRefreshInterval = setInterval(() => {
          keepSessionAlive();
      }, 30000);
  }
}


// Process the current page when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  // This won't be triggered if we're using a popup
  console.log("Extension icon clicked");
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);
  
  if (request.action === "processPage") {
    // Get the current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log("Tabs:", tabs);  // Log the tabs to see what you're getting
      if (tabs && tabs.length > 0) {
        processCurrentPage(tabs[0].id);
        sendResponse({status: "processing"});
      } else {
        console.error("No active tab found");
        sendResponse({status: "error", message: "No active tab found"});
      }
    });
    return true; // Required for async response
  } 
  else if (request.action === "getSessionStatus") {
    sendResponse({
      hasSession: currentSessionId !== null,
      sessionId: currentSessionId
    });
  }
  else if (request.action === "sendChatMessage") {
    sendChatMessage(request.query)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({status: "error", message: error.toString()}));
    return true; // Required for async response
  }
  return true;
});

// Function to keep session alive
function keepSessionAlive() {
  if (!currentSessionId) return;
  
  fetch(`${API_BASE_URL}/keep-alive`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          session_id: currentSessionId
      })
  })
  .then(response => response.json())
  .then(data => {
      if (data.status !== "success") {
          console.warn("Session expired:", currentSessionId);
          currentSessionId = null;
          clearInterval(sessionRefreshInterval);
          sessionRefreshInterval = null;
      }
  })
  .catch(error => {
      console.error("Error refreshing session:", error);
  });
}



// Function to process the current webpage
function processCurrentPage(tabId) {
  console.log("Processing page for tab:", tabId);
  
  // Request content extraction from the content script
  chrome.tabs.sendMessage(tabId, {action: "extractContent"}, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to content script:", chrome.runtime.lastError);
      return;
    }

    if (response) {
      console.log("Content extracted, sending to backend:", response);
      // Send content to backend for processing
      fetch(`${API_BASE_URL}/process-page`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: response.content,
          title: response.title,
          url: response.url
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("Backend response:", data);
        if (data.status === "success") {
          currentSessionId = data.session_id;
          // Start session refresh
          startSessionRefresh();

          // Notify any open popups that we've processed the page
          chrome.runtime.sendMessage({
            action: "pageProcessed", 
            sessionId: currentSessionId
          });
        }
      })
      .catch(error => {
        console.error("Error processing page:", error);
      });
    }
  });
}

// Function to send chat messages to the backend
async function sendChatMessage(query) {

  console.log("Sending chat message:", query);
  
  if (!currentSessionId) {
    return {status: "error", message: "No active session"};
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_id: currentSessionId,
        query: query
        // query: simplifiedQuery
      })
    });
    
    const data = await response.json();
    console.log("Chat response:", data);
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    return {status: "error", message: error.toString()};
  }
}

// Function to simplify complex queries
// function simplifyQuery(query) {
//     // Example simplification, you can add more sophisticated methods here
//     return query.replace(/who|what|where|when|how|why/gi, '').trim();
//   }