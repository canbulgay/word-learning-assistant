// Text selection and tooltip handling
let tooltip = null;
let isTranslating = false;

// Debounce function to prevent multiple rapid calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Create tooltip element
function createTooltip() {
  const div = document.createElement("div");
  div.className = "word-learning-tooltip";
  div.style.display = "none";
  document.body.appendChild(div);
  return div;
}

// Position tooltip near selected text
function positionTooltip(tooltip, x, y) {
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y - tooltip.offsetHeight - 10}px`;
}

// Show error message in tooltip
function showError(message) {
  return `
    <div class="tooltip-error">
      <div class="error-message">${message}</div>
      <button class="retry-button">Tekrar Dene</button>
    </div>
  `;
}

// Create tooltip content with examples
function createExamplesHtml(examples) {
  if (!examples || examples.length === 0) return "";

  return `
    <div class="examples-container">
      ${examples
        .map(
          (example) => `
        <div class="translation-example">
          <div class="example-original">${example.original}</div>
          <div class="example-translation">${example.translation}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// Show success/error message in tooltip
function showMessage(message, isSuccess = true) {
  return `
        <div class="tooltip-message ${isSuccess ? "success" : "error"}">
            ${message}
        </div>
    `;
}

// Handle text selection with debounce
const debouncedHandleTextSelection = debounce(async (event) => {
  if (isTranslating) return;

  const selectedText = window.getSelection().toString().trim();
  if (!selectedText || selectedText.length > 100) return;

  isTranslating = true;

  try {
    await handleTextSelection(event);
  } finally {
    isTranslating = false;
  }
}, 300);

// Handle text selection
async function handleTextSelection(event) {
  const selectedText = window.getSelection().toString().trim();

  if (!selectedText || selectedText.length > 100) return;

  if (!tooltip) {
    tooltip = createTooltip();
  }

  // Get selection coordinates
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Calculate position
  const x = rect.left + window.scrollX;
  const y = rect.top + window.scrollY;

  // Show loading state
  tooltip.innerHTML = '<div class="loading">Çeviriliyor...</div>';
  tooltip.style.display = "block";
  positionTooltip(tooltip, x, y);

  try {
    // Get translation from API
    const translation = await window.translateText(selectedText);

    // Create tooltip content
    let content = '<div class="tooltip-content">';

    // Main translation
    content += `
      <div class="translation-option main-translation">
        <div class="translation-text">${translation.text}</div>
        ${createExamplesHtml(translation.examples)}
        <button class="save-button" data-translation='${JSON.stringify(
          translation
        )}'>Kaydet</button>
      </div>
    `;

    // Alternative translations
    if (translation.alternatives && translation.alternatives.length > 0) {
      content += '<div class="alternative-translations">';
      translation.alternatives.forEach((alt) => {
        const altTranslation = {
          text: alt.text,
          examples: translation.examples,
          originalText: translation.originalText,
          sourceLang: translation.sourceLang,
          targetLang: translation.targetLang,
        };
        content += `
          <div class="translation-option alternative">
            <div class="translation-text">${alt.text}</div>
            <button class="save-button" data-translation='${JSON.stringify(
              altTranslation
            )}'>Kaydet</button>
          </div>
        `;
      });
      content += "</div>";
    }

    content += "</div>";

    tooltip.innerHTML = content;

    // Add event listeners to all save buttons
    tooltip.querySelectorAll(".save-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const translationData = JSON.parse(
          event.target.getAttribute("data-translation")
        );
        saveWord(selectedText, translationData);
        tooltip.style.display = "none";
      });
    });
  } catch (error) {
    console.error("Translation error:", error);
    tooltip.innerHTML = showError(error.message);

    // Add event listener to retry button
    const retryButton = tooltip.querySelector(".retry-button");
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        handleTextSelection(event);
      });
    }
  }
}

// Save word function
async function saveWord(original, translation) {
  const wordData = {
    original,
    translation: translation.text,
    context: translation.examples[0]?.original || "",
    context_translation: translation.examples[0]?.translation || "",
    url: window.location.href,
    timestamp: new Date().toISOString(),
    source_language: translation.sourceLang || "en",
    target_language: translation.targetLang || "tr",
  };

  try {
    // Send message to background script to save the word
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "saveWord",
          data: wordData,
        },
        (response) => resolve(response)
      );
    });

    if (response && tooltip) {
      tooltip.innerHTML = showMessage(response.message, response.success);

      // Hide tooltip after 2 seconds
      setTimeout(() => {
        if (tooltip) {
          tooltip.style.display = "none";
        }
      }, 2000);
    }
  } catch (error) {
    console.error("Error saving word:", error);
    if (tooltip) {
      tooltip.innerHTML = showMessage(
        "Kelime kaydedilirken bir hata oluştu.",
        false
      );
      setTimeout(() => {
        if (tooltip) {
          tooltip.style.display = "none";
        }
      }, 2000);
    }
  }
}

// Event listeners
document.addEventListener("mouseup", debouncedHandleTextSelection);
document.addEventListener("dblclick", debouncedHandleTextSelection);

// Close tooltip when clicking outside
document.addEventListener("click", (event) => {
  if (tooltip && !tooltip.contains(event.target)) {
    tooltip.style.display = "none";
  }
});
