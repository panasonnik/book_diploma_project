let selectedValues = { bookLengthWeights: null, bookYearWeights: null,  genreWeights: null, languageWeights: null};

document.querySelectorAll(".chart-scale").forEach(scale => {
    scale.addEventListener("click", event => {
      if (!event.target.classList.contains("btn-scale")) return;
      scale.querySelectorAll(".btn-scale").forEach(btn => btn.classList.remove("selected"));

      event.target.classList.add("selected");
      selectedValues[scale.dataset.input] = event.target.dataset.value;
      document.getElementById(scale.dataset.input).value = event.target.dataset.value;

      document.getElementById(`errorMessage-${scale.dataset.input}`).classList.add("error-message--hidden");
    });
});

function validate(event) {
    let isValid = true;

    for (let key in selectedValues) {
      if (!selectedValues[key]) {
        document.getElementById(`errorMessage-${key}`).classList.remove("error-message--hidden");
        isValid = false;
      }
    }

    if (!isValid) event.preventDefault();
    return isValid;
  }