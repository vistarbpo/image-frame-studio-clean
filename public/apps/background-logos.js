const NUM_LOGOS = 10;
const LOGO_SRC = 'icon.webp'; // Placeholder, replace with your logo
const container = document.querySelector('.background-logos');

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

for (let i = 0; i < NUM_LOGOS; i++) {
  const img = document.createElement('img');
  img.src = LOGO_SRC;
  img.className = 'bg-logo-anim';
  const size = randomBetween(30, 80);
  img.style.width = `${size}px`;
  img.style.opacity = randomBetween(0.07, 0.18);
  img.style.position = 'absolute';
  img.style.left = `${randomBetween(0, 90)}vw`;
  img.style.top = `${randomBetween(0, 90)}vh`;
  img.style.zIndex = 0;
  img.style.pointerEvents = 'none';
  img.style.animation = `floatLogo${i % 3} ${randomBetween(7, 16)}s ease-in-out infinite`;
  container.appendChild(img);
}

// Add keyframes for floating/fading
const style = document.createElement('style');
style.innerHTML = `
@keyframes floatLogo0 {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-18px) scale(1.07); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes floatLogo1 {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(12px) scale(0.97); opacity: 0.8; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes floatLogo2 {
  0% { transform: translateX(0) scale(1); }
  50% { transform: translateX(10px) scale(1.04); }
  100% { transform: translateX(0) scale(1); }
}
`;
document.head.appendChild(style); 