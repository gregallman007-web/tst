/* Take Some Time — animated bird.
   Plays a bird MP4 on a solid background (black OR white — auto-detected),
   auto-crops to the bird, keys the background out to transparent, and paints
   it into a <canvas data-bird-src="..."> each frame. A CSS drop-shadow grounds it. */
(function () {
  function initBird(canvas) {
    var url = canvas.getAttribute('data-bird-src'); if (!url) return;
    var targetW = parseInt(canvas.getAttribute('data-w') || '320', 10);

    // loop window: trim glitchy head/tail frames out of the cycle (seconds)
    var trimEnd = parseFloat(canvas.getAttribute('data-bird-trim') || '0.45');
    var trimStart = parseFloat(canvas.getAttribute('data-bird-trim-start') || '0.04');
    var loopEnd = Infinity;

    var v = document.createElement('video');
    v.src = url; v.muted = true; v.loop = false; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.playsInline = true;
    v.style.cssText = 'position:absolute;left:-10px;top:-10px;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(v);
    v.addEventListener('loadedmetadata', function () {
      if (isFinite(v.duration) && v.duration > trimEnd + 0.1) loopEnd = v.duration - trimEnd;
    });

    var SW = 240, SH = 135;
    var samp = document.createElement('canvas'); samp.width = SW; samp.height = SH;
    var sx = samp.getContext('2d', { willReadFrequently: true });
    var ctx = canvas.getContext('2d');

    var mode = canvas.getAttribute('data-bird-bg') || null; // 'black' | 'white' | auto
    var crop = null, out = null, ox = null;
    var bb = { minX: 1e9, minY: 1e9, maxX: 0, maxY: 0 }, samples = 0;

    // bottom-right watermark mask (e.g. Gemini logo): "w,h" as fractions of the frame
    var maskBR = null;
    (function () {
      var raw = canvas.getAttribute('data-bird-mask-br'); if (!raw) return;
      var p = raw.split(',').map(parseFloat);
      maskBR = { w: p[0] || 0, h: (p.length > 1 ? p[1] : p[0]) || 0 };
    })();
    var wmOut = null; // watermark rect in output px (computed in finalize)

    // ping-pong buffer: capture keyed frames forward, then play back and forth
    var frames = [], capDone = false, lastCapT = -1, acc = 0, playIdx = 0, dir = 1, lastTs = 0;
    var CAP_FPS = 20, MAX_FRAMES = 120;

    function detectMode(d) {
      function lum(px, py) { var i = (py * SW + px) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 3; }
      var c = (lum(2, 2) + lum(SW - 3, 2) + lum(2, SH - 3) + lum(SW - 3, SH - 3)) / 4;
      return c > 180 ? 'white' : 'black';
    }
    function isFg(d, i) {
      if (mode === 'white') return Math.min(d[i], d[i + 1], d[i + 2]) < 214;
      return Math.max(d[i], d[i + 1], d[i + 2]) > 26;
    }
    function alphaOf(r, g, b) {
      var t;
      if (mode === 'white') {
        var w = r < g ? (r < b ? r : b) : (g < b ? g : b); // min channel = "whiteness"
        if (w > 242) return 0;
        t = (242 - w) / 40;
      } else {
        var m = r > g ? (r > b ? r : b) : (g > b ? g : b); // max channel
        if (m < 8) return 0;
        t = (m - 8) / 34;
      }
      if (t > 1) t = 1;
      return (t * t * (3 - 2 * t)) * 255;
    }
    function scanBBox() {
      sx.drawImage(v, 0, 0, SW, SH);
      var d = sx.getImageData(0, 0, SW, SH).data, any = false;
      if (!mode) mode = detectMode(d);
      var mx = maskBR ? SW * (1 - maskBR.w) : SW, my = maskBR ? SH * (1 - maskBR.h) : SH;
      for (var y = 0; y < SH; y++) for (var x = 0; x < SW; x++) {
        if (maskBR && x >= mx && y >= my) continue; // ignore watermark corner when finding the bird
        var i = (y * SW + x) * 4;
        if (isFg(d, i)) { any = true; if (x < bb.minX) bb.minX = x; if (x > bb.maxX) bb.maxX = x; if (y < bb.minY) bb.minY = y; if (y > bb.maxY) bb.maxY = y; }
      }
      return any;
    }
    function finalize() {
      var pX = (bb.maxX - bb.minX) * 0.08 + 2, pY = (bb.maxY - bb.minY) * 0.08 + 2;
      var x0 = Math.max(0, bb.minX - pX), y0 = Math.max(0, bb.minY - pY);
      var x1 = Math.min(SW, bb.maxX + pX), y1 = Math.min(SH, bb.maxY + pY);
      var rx = v.videoWidth / SW, ry = v.videoHeight / SH;
      crop = { x: x0 * rx, y: y0 * ry, w: (x1 - x0) * rx, h: (y1 - y0) * ry };
      var TW = targetW, TH = Math.max(1, Math.round(TW * crop.h / crop.w));
      canvas.width = TW; canvas.height = TH;
      out = document.createElement('canvas'); out.width = TW; out.height = TH;
      ox = out.getContext('2d', { willReadFrequently: true });
      // watermark rect (source px) intersected with the crop, mapped to output px
      if (maskBR) {
        var wsx0 = v.videoWidth * (1 - maskBR.w), wsy0 = v.videoHeight * (1 - maskBR.h);
        var ix0 = Math.max(wsx0, crop.x), iy0 = Math.max(wsy0, crop.y);
        var ix1 = crop.x + crop.w, iy1 = crop.y + crop.h;
        if (ix1 > ix0 && iy1 > iy0) {
          var rx2 = TW / crop.w, ry2 = TH / crop.h;
          wmOut = {
            x: Math.floor((ix0 - crop.x) * rx2), y: Math.floor((iy0 - crop.y) * ry2),
            x1: Math.ceil((ix1 - crop.x) * rx2), y1: Math.ceil((iy1 - crop.y) * ry2)
          };
        }
      }
      canvas.classList.add('bird-ready');
    }
    function keyToOut() {
      ox.drawImage(v, crop.x, crop.y, crop.w, crop.h, 0, 0, out.width, out.height);
      var img = ox.getImageData(0, 0, out.width, out.height), d = img.data;
      for (var i = 0; i < d.length; i += 4) d[i + 3] = alphaOf(d[i], d[i + 1], d[i + 2]);
      if (wmOut) {
        for (var wy = wmOut.y; wy < wmOut.y1; wy++) for (var wx = wmOut.x; wx < wmOut.x1; wx++) {
          d[(wy * out.width + wx) * 4 + 3] = 0; // erase any watermark left inside the crop
        }
      }
      return img;
    }
    function playback(ts) {
      if (!lastTs) lastTs = ts;
      var dt = (ts - lastTs) / 1000; lastTs = ts;
      acc += dt * CAP_FPS;
      while (acc >= 1) {
        acc -= 1; playIdx += dir;
        if (playIdx >= frames.length - 1) { playIdx = frames.length - 1; dir = -1; }
        else if (playIdx <= 0) { playIdx = 0; dir = 1; }
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[playIdx], 0, 0);
      requestAnimationFrame(playback);
    }
    function frame(ts) {
      if (capDone) { playback(ts); return; }
      if (v.readyState >= 2 && v.videoWidth) {
        if (!crop) {
          if (scanBBox()) { samples++; if (samples >= 8) finalize(); }
        } else {
          var img = keyToOut();
          ctx.putImageData(img, 0, 0); // live forward pass while capturing
          if (v.currentTime - lastCapT >= 1 / (CAP_FPS + 2)) {
            var f = document.createElement('canvas'); f.width = out.width; f.height = out.height;
            f.getContext('2d').putImageData(img, 0, 0);
            frames.push(f); lastCapT = v.currentTime;
          }
          if (v.currentTime >= loopEnd || v.ended || frames.length >= MAX_FRAMES) {
            if (frames.length >= 2) { capDone = true; try { v.pause(); } catch (e) {} }
            else { try { v.currentTime = trimStart; } catch (e) {} play(); }
          }
        }
      }
      requestAnimationFrame(frame);
    }
    function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    v.addEventListener('loadeddata', play);
    v.addEventListener('canplay', play);
    play();
    requestAnimationFrame(frame);
  }
  function boot() {
    var l = document.querySelectorAll('canvas[data-bird-src]');
    for (var i = 0; i < l.length; i++) initBird(l[i]);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
