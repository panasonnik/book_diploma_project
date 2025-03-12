import fetch from 'node-fetch';

export async function getBookFromOpenLibraryApi(title) {
    const apiUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.docs.length === 0) {
            return null;
        }

        const book = data.docs.find(b => b.language?.includes('uk') || b.language?.includes('eng')) || data.docs[0];

        if (!book) {
            return null;
        }
        return `https://openlibrary.org${book.key}/preview`;
    } catch (error) {
        console.error('Error fetching book:', error);
        return null;
    }

}