const MYMEMORY_API_URL = "https://api.mymemory.translated.net/get";
const TATOEBA_API_URL = "https://tatoeba.org/eng/api_v0/search";

/**
 * Custom error messages for different scenarios
 */
const ERROR_MESSAGES = {
  RATE_LIMIT: "API kullanım limiti aşıldı. Lütfen biraz bekleyin.",
  NETWORK: "İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.",
  SERVER:
    "Çeviri servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
  INVALID_LANGUAGE: "Desteklenmeyen dil çifti.",
  DEFAULT: "Çeviri sırasında bir hata oluştu.",
};

/**
 * Language codes mapping for Tatoeba
 */
const LANGUAGE_CODES = {
  en: "eng",
  tr: "tur",
  // Diğer diller için buraya eklenebilir
};

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string}
 */
function capitalizeFirstLetter(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Normalizes text for comparison
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Birden fazla boşluğu teke indir
    .replace(/[.,!?;:'"]/g, ""); // Noktalama işaretlerini kaldır
}

/**
 * Removes duplicate translations and normalizes them
 * @param {Array} translations - Array of translations
 * @returns {Array}
 */
function filterAndNormalizeTranslations(translations) {
  const seen = new Set();
  const uniqueTranslations = [];

  translations.forEach((trans) => {
    const normalizedText = normalizeText(trans.text);
    if (!seen.has(normalizedText)) {
      seen.add(normalizedText);
      uniqueTranslations.push({
        ...trans,
        text: capitalizeFirstLetter(trans.text.trim()),
      });
    }
  });

  // Kalite skoruna göre sırala
  return uniqueTranslations.sort((a, b) => b.quality - a.quality);
}

/**
 * Gets example sentences from Tatoeba
 * @param {string} word - Word to get examples for
 * @param {string} lang - Language code
 * @returns {Promise<string[]>}
 */
async function getExampleSentences(word, lang = "en") {
  try {
    const tatoebaLang = LANGUAGE_CODES[lang] || "eng";
    const url = new URL(TATOEBA_API_URL);
    url.searchParams.append("query", word);
    url.searchParams.append("from", tatoebaLang);
    url.searchParams.append("trans_filter", "limit:3");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.warn("Tatoeba API error, falling back to default example");
      return getDefaultExamples(word);
    }

    const data = await response.json();

    // Kelimeyi içeren cümleleri filtrele
    const wordRegex = new RegExp(`\\b${word}\\b`, "i");
    const examples = data.results
      ?.filter((result) => wordRegex.test(result.text))
      ?.map((result) => capitalizeFirstLetter(result.text))
      ?.slice(0, 3);

    // Eğer örnek bulunamadıysa varsayılan örnekleri kullan
    return examples?.length > 0 ? examples : getDefaultExamples(word);
  } catch (error) {
    console.error("Error getting Tatoeba examples:", error);
    return getDefaultExamples(word);
  }
}

/**
 * Returns default example sentences when API fails
 * @param {string} word
 * @returns {string[]}
 */
function getDefaultExamples(word) {
  const examples = [
    `The word "${word}" is commonly used in everyday conversations.`,
    `Many people use "${word}" when they want to express this concept.`,
    `In business contexts, "${word}" often appears in professional communications.`,
  ];
  return examples.map((example) => capitalizeFirstLetter(example));
}

/**
 * Translates text using MyMemory Translation API
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<{text: string, examples: string[]}>}
 */
async function translateText(text, sourceLang = "en", targetLang = "tr") {
  try {
    console.log(
      `Translation request for: "${text}" (${sourceLang} -> ${targetLang})`
    );

    // Construct the API URL with parameters
    const url = new URL(MYMEMORY_API_URL);
    url.searchParams.append("q", text);
    url.searchParams.append("langpair", `${sourceLang}|${targetLang}`);

    const response = await fetch(url.toString());
    const responseData = await response.json();
    console.log("API Response:", responseData);

    if (responseData.responseStatus !== 200) {
      let errorMessage = ERROR_MESSAGES.DEFAULT;

      if (responseData.responseStatus === 403) {
        errorMessage = ERROR_MESSAGES.RATE_LIMIT;
      } else if (responseData.responseStatus >= 500) {
        errorMessage = ERROR_MESSAGES.SERVER;
      } else if (
        responseData.responseMessage &&
        responseData.responseMessage.includes("language")
      ) {
        errorMessage = ERROR_MESSAGES.INVALID_LANGUAGE;
      }

      throw new Error(errorMessage);
    }

    if (
      !responseData.responseData ||
      !responseData.responseData.translatedText
    ) {
      console.error("Unexpected API response format:", responseData);
      throw new Error(ERROR_MESSAGES.DEFAULT);
    }

    // Get example sentences
    const examples = await getExampleSentences(text, sourceLang);

    // Tüm çevirileri topla
    let allTranslations = [
      {
        text: responseData.responseData.translatedText,
        quality: 100,
      },
      ...(responseData.matches?.map((match) => ({
        text: match.translation,
        quality: match.quality,
      })) || []),
    ];

    // Çevirileri filtrele ve normalize et
    allTranslations = filterAndNormalizeTranslations(allTranslations);

    // Ana çeviri ve alternatifleri ayır
    const mainTranslation = allTranslations[0];
    const alternativeTranslations = allTranslations.slice(1, 3);

    return {
      text: mainTranslation.text,
      examples: examples,
      originalText: text,
      sourceLang,
      targetLang,
      alternatives: alternativeTranslations,
    };
  } catch (error) {
    console.error("Translation error details:", {
      message: error.message,
      originalError: error,
      text,
      sourceLang,
      targetLang,
    });

    if (Object.values(ERROR_MESSAGES).includes(error.message)) {
      throw error;
    }

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(ERROR_MESSAGES.NETWORK);
    }

    throw new Error(ERROR_MESSAGES.DEFAULT);
  }
}

// Make functions available globally
window.translateText = translateText;
window.getExampleSentences = getExampleSentences;
