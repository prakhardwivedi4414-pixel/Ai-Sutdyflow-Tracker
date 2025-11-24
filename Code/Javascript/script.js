document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.fluid-navbar');
  if (!navbar) return;

  navbar.style.setProperty('--x', '50%');
  navbar.style.setProperty('--y', '50%');

  navbar.addEventListener('mousemove', (e) => {
    const rect = navbar.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    navbar.style.setProperty('--x', `${xPct}%`);
    navbar.style.setProperty('--y', `${yPct}%`);
  });

  navbar.addEventListener('mouseleave', () => {
    navbar.style.setProperty('--x', '50%');
    navbar.style.setProperty('--y', '50%');
  });
});
