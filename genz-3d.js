/* Pointer-driven 3D scene. It never intercepts chat controls. */
(() => {
  const scene = document.querySelector('.scene');
  if (!scene || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frame = 0;
  scene.addEventListener('pointermove', event => {
    const box = scene.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      scene.style.setProperty('--ry', `${x * 16}deg`);
      scene.style.setProperty('--rx', `${-y * 13}deg`);
    });
  });
  scene.addEventListener('pointerleave', () => {
    scene.style.setProperty('--ry', '0deg');
    scene.style.setProperty('--rx', '0deg');
  });
})();
