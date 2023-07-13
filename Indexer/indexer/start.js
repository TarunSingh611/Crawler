const db = require('./../models/sql')();
const fs = require('fs');
const regularExpression = /\w+(?:-\w+)*/g;
const standaloneTags = ['br', 'hr', 'img', 'meta'];

// Load stopwords from JSON file
const stopwords = require('./stopwords_en.json');

function startIndexer(sesId, fcount) {
  console.log(`Your Session sesId is ${sesId} with ${fcount} at a time`);
  console.log("INDEXING...");
  indexLink();
  const indexInterval = setInterval(indexLink, 50);

  async function indexLink() {
    const code = `SELECT id, url, path FROM crawler.links${sesId} WHERE path IS NOT NULL AND path != "invalid" AND indexed = 0 ORDER BY depth LIMIT 1;`;

    db.sqlret(code, function (result) {
      const res = result[0];

      if (res) {
        indexFile(sesId, res);
        markIndexed(sesId, res.id);
      } else {
        clearInterval(indexInterval);
        console.log("Indexing Complete");
      }
    });
  }
}

function indexFile(sesId, res) {
  const fileContent = fs.readFileSync(res.path, 'utf8');
  console.log('File reading complete');
  const wordTags = processFileContent(fileContent);
  addWordtoDB(wordTags, res, sesId);
}

function processFileContent(content) {
  let cleanedContent = content;

  // Remove inline CSS styles
  cleanedContent = cleanedContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove inline JavaScript code
  cleanedContent = cleanedContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove HTML comments
  cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '');

  const lines = cleanedContent.split('\n');
  const wordTags = {};

  let currentTags = [];

  lines.forEach((line) => {
    processLine(line, wordTags, currentTags);
  });

  return wordTags;
}

function processLine(line, wordTags, currentTags) {
  // Remove HTML tags and their attributes
  const cleanedLine = line.replace(/<[^>]+>/g, '');

  const words = cleanedLine.match(regularExpression);

  if (words) {
    words.forEach((word) => {
      const lowercaseWord = word.toLowerCase().trim().replace(/^"(.*)"$/, '$1').replace(/-/g, '');
      
      if (
        lowercaseWord.length >= 3 && // Check if the word length is at least 3
        !stopwords.includes(lowercaseWord) && // Check if the word is not a stopword
        !/^\d+$/.test(lowercaseWord) // Check if the word is not entirely composed of numbers
      ) { 
        if (!wordTags[lowercaseWord]) {
          wordTags[lowercaseWord] = { count: 0, tags: {} };
        }

        // Check if the word is split across multiple lines
        const wordStartIndex = line.indexOf(word);
        const wordEndIndex = wordStartIndex + word.length;
        const isSplitWord = line.slice(wordStartIndex - 1, wordEndIndex + 1).match(/<\/?[^>]+>/g);

        if (isSplitWord) {
          // Add the word to the wordTags dictionary multiple times, once for each line that it appears on
          const lineCount = isSplitWord.length + 1;
          for (let i = 0; i < lineCount; i++) {
            wordTags[lowercaseWord].count++;
            const tagMatches = line.match(/<([a-zA-Z0-9-]+)/g);
            if (tagMatches) {
              tagMatches.forEach((tag) => {
                const tagName = tag.substring(1).toLowerCase();
                if (!standaloneTags.includes(tagName) && !tagName.startsWith('/')) {
                  wordTags[lowercaseWord].tags[tagName] = (wordTags[lowercaseWord].tags[tagName] || 0) + 1;
                }
              });
            }
          }
        } else {
          wordTags[lowercaseWord].count++;
          const tagMatches = line.match(/<([a-zA-Z0-9-]+)/g);
          if (tagMatches) {
            tagMatches.forEach((tag) => {
              const tagName = tag.substring(1).toLowerCase();
              if (!standaloneTags.includes(tagName) && !tagName.startsWith('/')) {
                wordTags[lowercaseWord].tags[tagName] = (wordTags[lowercaseWord].tags[tagName] || 0) + 1;
              }
            });
          }
        }
      }
    });
  }

  // Update currentTags based on the encountered HTML tags
  const tagMatches = line.match(/<\/?([a-zA-Z0-9-]+)/g);

  if (tagMatches) {
    tagMatches.forEach((tag) => {
      const tagName = tag.substring(1).toLowerCase(); // Exclude the "<" or "</" characters

      if (!standaloneTags.includes(tagName) && !tagName.startsWith('/')) {
        if (tag.startsWith('</')) {
          // Closing tag
          const index = currentTags.lastIndexOf(tagName);
          if (index !== -1) {
            currentTags.splice(index, 1);
          }
        } else {
          // Opening tag
          currentTags.push(tagName);
        }
      }
    });
  }

  // Extract keywords from <meta name="keywords" content="...">
  const metaTagMatches = line.match(/<meta\s+name="keywords"\s+content="([^"]+)">/i);
  if (metaTagMatches) {
    const content = metaTagMatches[1];
    const keywords = content.split(',').map((keyword) => keyword.trim().toLowerCase());

    keywords.forEach((keyword) => {
      if (keyword.length >= 2 && !stopwords.includes(keyword)) {
        if (!wordTags[keyword]) {
          wordTags[keyword] = { count: 0, tags: {} };
        }

        wordTags[keyword].count++;
        currentTags.forEach((tag) => {
          wordTags[keyword].tags[tag] = (wordTags[keyword].tags[tag] || 0) + 1;
        });

        // Add 'meta' tag to the word
        wordTags[keyword].tags['meta'] = (wordTags[keyword].tags['meta'] || 0) + 1;
      }
    });
  }
}

function addWordtoDB(wordTags, res, sesId) {
  for (const word in wordTags) {
    const escapedWord = word.replace(/['"@#(){}][%!,.]/g, '');

    if (escapedWord.trim() !== '') { // Check if the word is not empty after removing special characters

      let title = wordTags[word].tags.title || 0;
      let h1 = wordTags[word].tags.h1 || 0;
      let h2 = wordTags[word].tags.h2 || 0;
      let h3 = wordTags[word].tags.h3 || 0;
      let h4 = wordTags[word].tags.h4 || 0;
      let h5 = wordTags[word].tags.h5 || 0;
      let h6 = wordTags[word].tags.h6 || 0;
      let heading = h1 + h2 + h3 + h4 + h5 + h6;
      let meta = wordTags[word].tags.meta || 0;
      let weight = (title*5)+(meta*4)+((h1+h2)*3)+((h4+h5+h6+h3)*2)+(wordTags[word].count);

      const code = `INSERT IGNORE INTO index${sesId} (term, url, path,weight, w_freq, title_f, head,meta)
       VALUES ('${escapedWord}', '${res.url}', '${res.path}',${weight}, ${wordTags[word].count}, ${title}, ${heading},${meta});`;

      db.sqlret(code, function (result) {
        console.log(`Word Added to database: ${word}`);
      });
    }
  }
}

async function markIndexed(sesId, id) {
  const code = `UPDATE crawler.links${sesId} SET indexed = 1 WHERE id = '${id}';`;
  await db.sqlwrite(code);
}

module.exports = {
  startIndexer
};
