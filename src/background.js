// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveWord") {
    saveWord(request.data);
  }
});

// Save word to storage
async function saveWord(wordData) {
  try {
    // Get existing words
    const result = await chrome.storage.local.get("words");
    const words = result.words || [];

    // Add new word
    words.push(wordData);

    // Save updated words
    await chrome.storage.local.set({ words });

    // Optional: Send success message back to content script
    return true;
  } catch (error) {
    console.error("Error saving word:", error);
    return false;
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with empty words array if not exists
  chrome.storage.local.get("words", (result) => {
    if (!result.words) {
      chrome.storage.local.set({ words: [] });
    }
  });
});
