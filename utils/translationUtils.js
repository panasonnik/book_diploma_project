export function translateText(text, dictionary) {
    return text.replace(/\b[\w']+\b/g, (word) => {
      const lower = word.toLowerCase();
      return dictionary[lower] || word;
    });
  }

export function translateObject(obj, dictionary) {
    if (typeof obj === "string") {
      return translateText(obj, dictionary);
    }
  
    if (Array.isArray(obj)) {
      return obj.map(item => translateObject(item, dictionary));
    }
  
    if (typeof obj === "object" && obj !== null) {
      const result = {};
      for (const key in obj) {
        result[key] = translateObject(obj[key], dictionary);
      }
      return result;
    }
  
    return obj;
  }
  