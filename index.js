const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

const BASE_URL =
  "https://raw.githubusercontent.com/Telugu-Bible/all-books/main";

async function fetchBooksMetadata() {
  const metadataUrl = `${BASE_URL}/Books.json`;
  try {
    const response = await axios.get(metadataUrl);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch books metadata from GitHub.");
  }
}

async function fetchBookContent(bookName) {
  const bookUrl = `${BASE_URL}/${bookName}.json`;
  try {
    const response = await axios.get(bookUrl);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch book content from GitHub.");
  }
}

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Telugu Bible API!",
    availableEndpoints: [
      {
        method: "GET",
        path: "/api/books",
        description: "Returns a list of all books (English and Telugu names)",
      },
      {
        method: "GET",
        path: "/api/books/:bookName",
        description:
          "Returns the content (chapters and verses) of a specific book",
      },
      {
        method: "GET",
        path: "/api/books/:bookName/:chapter",
        description: "Returns all verses for a specific chapter in a book",
      },
      {
        method: "GET",
        path: "/api/books/:bookName/:chapter/:verse",
        description: "Returns a specific verse from a chapter of a book",
      },
    ],
  });
});

app.get("/api/books", async (req, res) => {
  try {
    const books = await fetchBooksMetadata();
    const bookNames = books.map((book) => ({
      english: book.book.english,
      telugu: book.book.telugu,
    }));
    res.json(bookNames);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch books metadata" });
  }
});

function getEnglishBookNameFromTelugu(teluguName) {
  return fetchBooksMetadata()
    .then((books) => {
      const book = books.find((b) => b.book.telugu === teluguName);
      return book ? book.book.english : null;
    })
    .catch(() => null);
}

app.get("/api/books/:bookName", async (req, res) => {
  let { bookName } = req.params;
  try {
    const books = await fetchBooksMetadata();
    let englishBookName = bookName;
    const englishBookNameFromTelugu = await getEnglishBookNameFromTelugu(
      bookName
    );

    if (englishBookNameFromTelugu) {
      englishBookName = englishBookNameFromTelugu;
    }

    const book = books.find(
      (b) => b.book.english.toLowerCase() === englishBookName.toLowerCase()
    );

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const bookContent = await fetchBookContent(englishBookName);

    if (!bookContent) {
      return res.status(404).json({ error: "Book content not found" });
    }

    res.json(bookContent);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch book content" });
  }
});

app.get("/api/books/:bookName/:chapter", async (req, res) => {
  const { bookName, chapter } = req.params;
  try {
    const books = await fetchBooksMetadata();
    let englishBookName = bookName;
    const englishBookNameFromTelugu = await getEnglishBookNameFromTelugu(
      bookName
    );

    if (englishBookNameFromTelugu) {
      englishBookName = englishBookNameFromTelugu;
    }

    const book = books.find(
      (b) => b.book.english.toLowerCase() === englishBookName.toLowerCase()
    );

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const bookContent = await fetchBookContent(englishBookName);

    if (!bookContent) {
      return res.status(404).json({ error: "Book content not found" });
    }

    const chapterData = bookContent.chapters.find(
      (ch) => ch.chapter === chapter
    );

    if (!chapterData) {
      return res.status(404).json({ error: `Chapter ${chapter} not found` });
    }

    res.json(chapterData.verses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chapter content" });
  }
});

app.get("/api/books/:bookName/:chapter/:verse", async (req, res) => {
  const { bookName, chapter, verse } = req.params;
  try {
    const books = await fetchBooksMetadata();
    let englishBookName = bookName;
    const englishBookNameFromTelugu = await getEnglishBookNameFromTelugu(
      bookName
    );

    if (englishBookNameFromTelugu) {
      englishBookName = englishBookNameFromTelugu;
    }

    const book = books.find(
      (b) => b.book.english.toLowerCase() === englishBookName.toLowerCase()
    );

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const bookContent = await fetchBookContent(englishBookName);

    if (!bookContent) {
      return res.status(404).json({ error: "Book content not found" });
    }

    const chapterData = bookContent.chapters.find(
      (ch) => ch.chapter === chapter
    );

    if (!chapterData) {
      return res.status(404).json({ error: `Chapter ${chapter} not found` });
    }

    const verseData = chapterData.verses.find((v) => v.verse === verse);

    if (!verseData) {
      return res.status(404).json({ error: `Verse ${verse} not found` });
    }

    res.json(verseData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch verse content" });
  }
});

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.listen(port, () => {
  console.log(`Bible API server running at http://localhost:${port}`);
});
