export async function calculateDecisionMatrix(books) {
    console.log(books);
    const weights = { //користувач вкаже ці ваги при реєстрації на тестуванні
        numberOfPages: 0,
        dateOfPublishing: 1.0
    };

    function normalize(data, key) {
        const values = data.map(book => book[key]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return data.map(book => ({
            ...book,
            [`normalized_${key}`]: (book[key] - min) / (max - min)
        }));
    }

    let normalizedBooks = normalize(books, "numberOfPages");
    normalizedBooks = normalize(normalizedBooks, "dateOfPublishing");

    const scoredBooks = normalizedBooks.map(book => ({
        ...book,
        score: (book.normalized_numberOfPages * weights.numberOfPages) +
              (book.normalized_dateOfPublishing * weights.dateOfPublishing)
    }));

    //топ 2 книги
    scoredBooks.sort((a, b) => b.score - a.score);

    return scoredBooks;
}
