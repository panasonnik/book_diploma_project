document.querySelectorAll('.like-button').forEach((button) => {
    // button.addEventListener('click', (e) => {
    //   const bookId = parseInt(e.currentTarget.dataset.bookId);
    //   const book = state.books.find((b) => b.id === bookId);
    //   book.liked = !book.liked;
    // });
    btn.addEventListener('click', () => {
      btn.classList.toggle('liked');
    });
  });

  function openModal(title, author, description, imageUrl, genres, year, pages) {
    document.getElementById('modalBookTitle').textContent = title;
    document.getElementById('modalBookImage').src = imageUrl;
    document.getElementById('modalAuthorName').textContent = author;
    document.getElementById('modalBookDescription').textContent =
      description;
    document.getElementById('modalGenres').textContent = genres;
    document.getElementById('modalYear').textContent = year;
    document.getElementById('modalPages').textContent = pages;

    document.getElementById('bookModal').style.display = 'block';
  }

  function closeModal() {
    document.getElementById('bookModal').style.display = 'none';
  }

  window.onclick = function (event) {
    if (event.target == document.getElementById('bookModal')) {
      closeModal();
    }
  };