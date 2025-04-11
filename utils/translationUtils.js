export function translateBook(translations, book) {
  const translatedTitle = translations[book.title_en]?.title || book.title_en;
  const translatedDescription = translations[book.title_en]?.description || book.description_en;
  const translatedAuthor = translations[book.title_en]?.author || book.author_en;    
  return {
    book_id: book.book_id,
    title_en: book.title_en,
    title: translatedTitle,
    author: translatedAuthor,
    description: translatedDescription,
    image_url: book.image_url,
    number_of_pages: book.number_of_pages,
    year_published: book.year_published,
    is_liked: book.is_liked,
    is_read: book.is_read,
    is_completed: book.is_completed,
    genre_name: book.genre_name_en.split(", ").map(genre => translations.dbGenres[genre] || genre).join(", "),
    genre_name_en: book.genre_name_en.split(","),
    language: translations.dbLanguages[book.language_en],
  };
}