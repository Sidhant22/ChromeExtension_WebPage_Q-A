console.log("Content script loaded on: " + window.location.href);

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  
  if (request.action === "extractContent") {
    console.log("Extracting content from page");
    const pageContent = document.body.innerText;
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    
    console.log("Content length:", pageContent.length);
    console.log("Title:", pageTitle);
    
    sendResponse({
      content: pageContent,
      title: pageTitle,
      url: pageUrl
    });
    
    console.log("Response sent back to background script");
  }
  return true; // Required for async response
});