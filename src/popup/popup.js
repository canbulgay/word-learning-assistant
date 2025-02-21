// Get the word list element
const wordList = document.getElementById("wordList");

// Load and display saved words
async function loadWords() {
  try {
    const result = await chrome.storage.local.get("words");
    const words = result.words || [];

    if (words.length === 0) {
      wordList.innerHTML = `
                <div class="no-words">
                    Henüz kaydedilmiş kelime bulunmuyor.
                </div>
            `;
      return;
    }

    // Sort words by timestamp (newest first)
    words.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Create HTML for each word
    const wordsHTML = words
      .map((word) => {
        const date = new Date(word.timestamp).toLocaleDateString("tr-TR");
        return `
                <div class="word-item">
                    <div class="word-original">${word.original}</div>
                    <div class="word-translation">${word.translation}</div>
                    <div class="word-context">${word.context}</div>
                    <div class="word-meta">
                        ${date} - <a href="${word.url}" target="_blank">Kaynak</a>
                    </div>
                </div>
            `;
      })
      .join("");

    wordList.innerHTML = wordsHTML;
  } catch (error) {
    console.error("Error loading words:", error);
    wordList.innerHTML = `
            <div class="no-words">
                Kelimeler yüklenirken bir hata oluştu.
            </div>
        `;
  }
}

// Load words when popup opens
document.addEventListener("DOMContentLoaded", loadWords);
