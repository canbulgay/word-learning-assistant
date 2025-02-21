// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("words", (result) => {
    if (!result.words) {
      chrome.storage.local.set({ words: [] });
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveWord") {
    handleSaveWord(request.data, sendResponse);
    return true; // Will respond asynchronously
  }
});

/**
 * Handles saving a word to storage
 * @param {Object} wordData - Word data to save
 * @param {Function} sendResponse - Callback function
 */
async function handleSaveWord(wordData, sendResponse) {
  try {
    // Get existing words
    const result = await chrome.storage.local.get("words");
    const words = result.words || [];

    // Check if word already exists
    const wordExists = words.some(
      (word) =>
        word.original.toLowerCase() === wordData.original.toLowerCase() &&
        word.translation.toLowerCase() === wordData.translation.toLowerCase()
    );

    if (!wordExists) {
      // Add new word
      words.push({
        ...wordData,
        id: Date.now(), // Unique ID for each entry
        savedAt: new Date().toISOString(),
      });

      // Save updated words
      await chrome.storage.local.set({ words });

      // Notify content script
      sendResponse({ success: true, message: "Kelime kaydedildi." });

      // Update badge
      updateBadge(words.length);
    } else {
      sendResponse({ success: false, message: "Bu kelime zaten kaydedilmiş." });
    }
  } catch (error) {
    console.error("Error saving word:", error);
    sendResponse({
      success: false,
      message: "Kelime kaydedilirken bir hata oluştu.",
    });
  }
}

/**
 * Updates the extension badge with the number of saved words
 * @param {number} count - Number of saved words
 */
function updateBadge(count) {
  chrome.action.setBadgeText({ text: count.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.words) {
    updateBadge(changes.words.newValue.length);
  }
});
