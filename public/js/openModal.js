function openModal(
    title,
    author,
    description,
    imageUrl,
    year,
    pages,
    genres
  ) {
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