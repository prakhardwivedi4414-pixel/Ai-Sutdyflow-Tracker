document.addEventListener("mousemove", (e) => {
  document.querySelectorAll(".card").forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty("--mx", x + "%");
    card.style.setProperty("--my", y + "%");
  });
});
