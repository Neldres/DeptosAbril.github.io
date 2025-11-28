function moverCarrusel(id, n) {
  const carrusel = document.getElementById(id);
  const imgs = carrusel.getElementsByTagName('img');
  let index = 0;

  // encontrar la imagen visible
  for (let i = 0; i < imgs.length; i++) {
    if (imgs[i].classList.contains("mostrar")) {
      index = i;
      break;
    }
  }

  imgs[index].classList.remove("mostrar"); // ocultar actual
  let siguiente = index + n;
  if (siguiente >= imgs.length) siguiente = 0;
  if (siguiente < 0) siguiente = imgs.length - 1;

  imgs[siguiente].classList.add("mostrar"); // mostrar siguiente

  // actualizar fondo difuminado (si existe el elemento creado por JS)
  const bg = carrusel.querySelector('.carrusel-bg');
  if (bg) {
    bg.style.backgroundImage = `url("${imgs[siguiente].src}")`;
  }

  // actualizar indicador
  // si el id del carrusel termina con 'Carrusel', usamos la parte previa para construir el id del indicador
  let indicador = null;
  if (id && id.endsWith('Carrusel')) {
    const base = id.slice(0, -'Carrusel'.length); // 'depto1'
    const indicadorId = 'ind' + base.charAt(0).toUpperCase() + base.slice(1); // 'indDepto1'
    indicador = document.getElementById(indicadorId);
  }
  if (indicador) {
    indicador.textContent = `${siguiente + 1} / ${imgs.length}`;
  }
}

// Inicializar carruseles
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carrusel').forEach((c, i) => {
    const imgs = c.getElementsByTagName('img');
    if (imgs.length > 0) {
      imgs[0].classList.add("mostrar");
      // crear/asegurar el elemento de fondo difuminado para cada carrusel
      let bg = c.querySelector('.carrusel-bg');
      if (!bg) {
        bg = document.createElement('div');
        bg.className = 'carrusel-bg';
        c.insertBefore(bg, c.firstChild);
      }
      // usar la primera imagen para el fondo
      bg.style.backgroundImage = `url("${imgs[0].src}")`;
    }

    // actualizar indicador al inicio
    if (c.id && c.id.endsWith('Carrusel')) {
      const base = c.id.slice(0, -'Carrusel'.length);
      const indicadorId = 'ind' + base.charAt(0).toUpperCase() + base.slice(1);
      const indicador = document.getElementById(indicadorId);
      if (indicador) indicador.textContent = `1 / ${imgs.length}`;
    }
  });
});

/* ---------------- Visor / Zoom & Pan + Controls + Thumbnails ---------------- */
// Estado del visor
let _visorOpen = false;
let _scale = 1;
let _translateX = 0, _translateY = 0;
let _baseWidth = 0, _baseHeight = 0; // dimensiones del img en escala 1
const MAX_SCALE = 5;
const MIN_SCALE = 1;

function openVisor(src, alt) {
  const visor = document.getElementById('visor');
  const img = document.getElementById('visorImg');
  img.alt = alt || '';
  resetVisor();
  // set src and when loaded compute base dims
  img.onload = () => {
    // medir dimensiones visibles con scale 1
    img.style.transform = 'translate(0px, 0px) scale(1)';
    _scale = 1; _translateX = 0; _translateY = 0;
    const rect = img.getBoundingClientRect();
    _baseWidth = rect.width;
    _baseHeight = rect.height;
    // actualizar slider/control
    const range = document.getElementById('zoomRange'); if (range) range.value = _scale;
  };
  img.src = src;

  // ensure a blurred background element exists and set it to the image
  let visorBg = visor.querySelector('.visor-bg');
  if (!visorBg) {
    visorBg = document.createElement('div');
    visorBg.className = 'visor-bg';
    visor.insertBefore(visorBg, visor.firstChild);
  }
  visorBg.style.backgroundImage = `url("${src}")`;

  visor.setAttribute('aria-hidden', 'false');
  _visorOpen = true;
}

function closeVisor() {
  const visor = document.getElementById('visor');
  const visorBg = visor.querySelector('.visor-bg');
  if (visorBg) visorBg.style.backgroundImage = '';
  visor.setAttribute('aria-hidden', 'true');
  _visorOpen = false;
}

function resetVisor() {
  _scale = 1;
  _translateX = 0; _translateY = 0;
  const img = document.getElementById('visorImg');
  img.style.transformOrigin = '50% 50%';
  img.style.transform = 'translate(0px, 0px) scale(1)';
  const range = document.getElementById('zoomRange'); if (range) range.value = _scale;
}

// Añadir listeners para las imágenes del carrusel (abrir visor) y controles
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carrusel img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (e) => {
      openVisor(e.currentTarget.src, e.currentTarget.alt);
    });
  });

  // cerrar con botón
  const closeBtn = document.getElementById('visorClose');
  if (closeBtn) closeBtn.addEventListener('click', closeVisor);

  // cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _visorOpen) closeVisor();
  });

  const content = document.getElementById('visorContent');
  const visorImg = document.getElementById('visorImg');

  // Controles de zoom (+, -, slider)
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  const zoomRange = document.getElementById('zoomRange');
  if (zoomIn) zoomIn.addEventListener('click', () => { _scale = Math.min(_scale * 1.12, MAX_SCALE); if (zoomRange) zoomRange.value = _scale; updateTransform(); });
  if (zoomOut) zoomOut.addEventListener('click', () => { _scale = Math.max(_scale / 1.12, MIN_SCALE); if (zoomRange) zoomRange.value = _scale; updateTransform(); });
  if (zoomRange) zoomRange.addEventListener('input', (e) => { _scale = parseFloat(e.target.value); updateTransform(); });

  // Zoom con rueda del mouse (mantiene el origen bajo el cursor)
  content.addEventListener('wheel', (e) => {
    if (! _visorOpen) return;
    e.preventDefault();
    const rect = visorImg.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const ox = (offsetX / rect.width) * 100;
    const oy = (offsetY / rect.height) * 100;
    visorImg.style.transformOrigin = `${ox}% ${oy}%`;
    const delta = e.deltaY < 0 ? 1.12 : 0.88;
    _scale = Math.min(Math.max(_scale * delta, MIN_SCALE), MAX_SCALE);
    if (zoomRange) zoomRange.value = _scale;
    updateTransform();
  }, { passive: false });

  // Drag para pan (ratón)
  let dragging = false;
  let lastX = 0, lastY = 0;
  content.addEventListener('mousedown', (e) => {
    if (! _visorOpen) return;
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    content.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    _translateX += dx / _scale; _translateY += dy / _scale;
    updateTransform();
  });
  window.addEventListener('mouseup', () => { dragging = false; content.style.cursor = 'default'; });

  // Touch: pan y pinch-to-zoom
  let touchStartDist = 0;
  content.addEventListener('touchstart', (e) => {
    if (! _visorOpen) return;
    if (e.touches.length === 1) {
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
    }
  }, { passive: false });
  content.addEventListener('touchmove', (e) => {
    if (! _visorOpen) return;
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastX; const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      _translateX += dx / _scale; _translateY += dy / _scale;
      updateTransform();
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / (touchStartDist || dist);
      touchStartDist = dist;
      _scale = Math.min(Math.max(_scale * factor, MIN_SCALE), MAX_SCALE);
      if (zoomRange) zoomRange.value = _scale;
      updateTransform();
    }
  }, { passive: false });

  // doble click para resetear zoom
  content.addEventListener('dblclick', (e) => { resetVisor(); });
});

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function updateTransform() {
  const img = document.getElementById('visorImg');
  const content = document.getElementById('visorContent');
  // si no medimos baseWidth/baseHeight aún, hacemos una medición aproximada
  if (!_baseWidth || !_baseHeight) {
    const rect = img.getBoundingClientRect();
    _baseWidth = rect.width || 0; _baseHeight = rect.height || 0;
  }
  const containerW = content.clientWidth;
  const containerH = content.clientHeight;
  const scaledW = _baseWidth * _scale;
  const scaledH = _baseHeight * _scale;

  // Calcular límites efectivos en coordenadas después del scale
  if (scaledW <= containerW) {
    _translateX = 0; // centrar horizontalmente
  } else {
    const maxEff = (scaledW - containerW) / 2; // px
    const minEff = -maxEff;
    // _translateX is in pre-scale units, effective = _translateX * _scale
    const eff = clamp(_translateX * _scale, minEff, maxEff);
    _translateX = eff / _scale;
  }

  if (scaledH <= containerH) {
    _translateY = 0; // centrar verticalmente
  } else {
    const maxEff = (scaledH - containerH) / 2;
    const minEff = -maxEff;
    const eff = clamp(_translateY * _scale, minEff, maxEff);
    _translateY = eff / _scale;
  }

  img.style.transform = `translate(${_translateX}px, ${_translateY}px) scale(${_scale})`;
  // actualizar control deslizante si existe
  const range = document.getElementById('zoomRange'); if (range) range.value = _scale;
}