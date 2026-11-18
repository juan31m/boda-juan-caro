(function () {
  'use strict';
  const video = document.getElementById('video-invitacion');
  if (!video) return;
  const musica = document.getElementById('musicaFondo');
  let devolverMusica = false;
  let visible = false;
  function coordinarSonido() {
    if (!musica) return;
    if (!video.paused && !video.muted && video.volume > 0) {
      if (!musica.paused) { devolverMusica = true; musica.pause(); }
    } else if (devolverMusica) {
      devolverMusica = false;
      musica.play().catch(function () {});
    }
  }
  ['play', 'pause', 'ended', 'volumechange'].forEach(function (evento) {
    video.addEventListener(evento, coordinarSonido);
  });
  function actualizar() {
    if (visible && !document.hidden) {
      // Si el navegador bloquea el inicio automático, quedan los controles nativos.
      video.play().catch(function () {});
    } else { video.pause(); }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.35;
      actualizar();
    }, { threshold: [0, 0.35] });
    observer.observe(video);
    document.addEventListener('visibilitychange', actualizar);
  }
})();
