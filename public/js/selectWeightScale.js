document.querySelectorAll(".chart-scale").forEach(scale => {
    scale.addEventListener("click", event => {
      if (!event.target.classList.contains("btn-scale")) return;
      scale.querySelectorAll(".btn-scale").forEach(btn => btn.classList.remove("selected"));

      event.target.classList.add("selected");

      document.getElementById(scale.dataset.input).value = event.target.dataset.value;
    });
});