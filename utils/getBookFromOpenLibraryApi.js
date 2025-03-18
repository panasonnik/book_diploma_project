import fetch from 'node-fetch';

export async function getBookFromOpenLibraryApi(title) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=title:${title}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const book = data.items[0];
          const bookId = book.id;
          return `https://books.google.com/books?id=${bookId}&printsec=frontcover&output=embed`;
        } else {
          console.log('No books found for the given title.');
          return null;
        }
      } catch (error) {
        console.error('Error fetching book data:', error);
        return null;
      
    }

}