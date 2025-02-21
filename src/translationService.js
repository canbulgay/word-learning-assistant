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
 * Gets example sentences from Tatoeba
 * @param {string} word - Word to get examples for
 * @param {string} lang - Language code
 * @returns {Promise<Array>}
 */
async function getExampleSentences(word, lang = "en") {
  try {
    const tatoebaLang = LANGUAGE_CODES[lang] || "eng";
    const url = new URL(TATOEBA_API_URL);
    url.searchParams.append("query", word);
    url.searchParams.append("from", tatoebaLang);
    url.searchParams.append("to", LANGUAGE_CODES.tr);
    url.searchParams.append("trans_filter", "limit:3");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.warn("Tatoeba API error, falling back to default examples");
      return getDefaultExamples(word);
    }

    const data = await response.json();

    // Kelimeyi içeren cümleleri filtrele
    const wordRegex = new RegExp(`\\b${word}\\b`, "i");
    const examples = [];

    // API yanıtını kontrol et ve örnekleri işle
    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        if (examples.length >= 3) break; // En fazla 3 örnek al

        // Sadece kelimeyi içeren ve çevirisi olan cümleleri kontrol et
        if (
          wordRegex.test(result.text) &&
          result.translations &&
          result.translations.length > 0
        ) {
          const translation =
            result.translations?.[0]?.[0]?.[0]?.text ||
            result.translations?.[0]?.[0]?.text ||
            result.translations[0]?.text;
          if (translation) {
            examples.push({
              original: capitalizeFirstLetter(result.text),
              translation: capitalizeFirstLetter(translation),
            });
          }
        }
      }
    }

    // Eğer yeterli örnek bulunamadıysa varsayılan örnekleri kullan
    if (examples.length === 0) {
      console.warn("No suitable examples found, using default examples");
      return getDefaultExamples(word);
    }

    return examples;
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
    {
      original: `The word "${word}" is commonly used in everyday conversations.`,
      translation: `"${word}" kelimesi günlük konuşmalarda sıkça kullanılır.`,
    },
    {
      original: `Many people use "${word}" when they want to express this concept.`,
      translation: `Birçok insan bu kavramı ifade etmek istediğinde "${word}" kullanır.`,
    },
    {
      original: `In business contexts, "${word}" often appears in professional communications.`,
      translation: `İş bağlamında, "${word}" genellikle profesyonel iletişimde kullanılır.`,
    },
  ];
  return examples.map((example) => ({
    original: capitalizeFirstLetter(example.original),
    translation: capitalizeFirstLetter(example.translation),
  }));
}

/**
 * Gets the best translation based on quality score
 * @param {Object} responseData - API response data
 * @returns {string} - Best translation
 */
function getBestTranslation(responseData) {
  // Tüm çevirileri topla
  const translations = [
    {
      text: responseData.responseData.translatedText,
      quality: 100, // Ana çeviri en yüksek kalite skoru
    },
    ...(responseData.matches?.map((match) => ({
      text: match.translation,
      quality: match.quality || 0,
    })) || []),
  ];

  // Kalite skoruna göre sırala ve en iyisini al
  const bestTranslation = translations.sort((a, b) => b.quality - a.quality)[0];

  return bestTranslation.text;
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
    // Construct the API URL with parameters
    const url = new URL(MYMEMORY_API_URL);
    url.searchParams.append("q", text);
    url.searchParams.append("langpair", `${sourceLang}|${targetLang}`);

    const response = await fetch(url.toString());
    const responseData = await response.json();

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

    if (!responseData.responseData?.translatedText) {
      throw new Error(ERROR_MESSAGES.DEFAULT);
    }

    // Get example sentences
    const examples = await getExampleSentences(text, sourceLang);

    // En iyi çeviriyi al ve normalize et
    const translatedText = capitalizeFirstLetter(
      getBestTranslation(responseData).trim()
    );

    // Sadece en iyi çeviriyi döndür
    return {
      text: translatedText,
      examples: examples,
      originalText: text,
      sourceLang,
      targetLang,
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

// Make functions available globally
window.translateText = translateText;
window.getExampleSentences = getExampleSentences;
