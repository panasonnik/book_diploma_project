document.getElementById("quizForm").addEventListener("submit", function (event) {
    const genreCheckboxes = document.querySelectorAll(".genre-checkbox");
    const genreErrorMessage = document.getElementById("genreErrorMessage");
    const languageCheckboxes = document.querySelectorAll(".language-checkbox");
    const languageErrorMessage = document.getElementById("languageErrorMessage");
    let isGenreChecked = Array.from(genreCheckboxes).some(checkbox => checkbox.checked);
    let isLanguageChecked = Array.from(languageCheckboxes).some(checkbox => checkbox.checked);

    if (!isGenreChecked) {
        event.preventDefault();
        genreErrorMessage.style.display = "block";
    } else {
        genreErrorMessage.style.display = "none";
    }

    if (!isLanguageChecked) {
        event.preventDefault();
        languageErrorMessage.style.display = "block";
    } else {
        languageErrorMessage.style.display = "none";
    }
  });