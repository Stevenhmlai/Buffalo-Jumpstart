// YouTube player with the portal's own controls.
//
// YouTube's built-in player has links that take people out of the portal
// ("Watch on YouTube", the video title, the YouTube logo, suggested videos at
// the end). We hide YouTube's controls and lay a transparent shield over the
// video so none of those can be clicked, and draw our own controls instead.
//
// Before the very first play, only the top and bottom strips are shielded, so
// the first tap lands on YouTube's own play button. Phones (iOS in particular)
// only allow sound if that first tap happens inside the YouTube frame.
//
// It also tells the portal when the member reaches the end of the video.
(function () {
  var el = document.getElementById('yt');
  if (!el) return;
  var box = el.closest('.player');
  var done = false;
  var started = false;
  var player;

  // ---------- build our overlay ----------
  function h(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  var ICON = {
    play: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    full: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    exitfull: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    replay: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  var shieldTop = h('div', 'pl-shield pl-shield-top');        // covers title / channel link
  var shieldBottom = h('div', 'pl-shield pl-shield-bottom');  // covers "Watch on YouTube" / logo
  var shield = h('button', 'pl-shield pl-shield-full', { type: 'button', 'aria-label': 'Play or pause' });
  shield.hidden = true;
  var ended = h('div', 'pl-ended'); ended.hidden = true;
  var replayBtn = h('button', 'pl-replay', { type: 'button' });
  replayBtn.innerHTML = ICON.replay + '<span>Watch again</span>';
  ended.appendChild(replayBtn);

  var bar = h('div', 'pl-bar'); bar.hidden = true;
  var playBtn = h('button', 'pl-btn', { type: 'button', 'aria-label': 'Play' });
  var time = h('span', 'pl-time'); time.textContent = '0:00 / 0:00';
  var seek = h('input', 'pl-seek', { type: 'range', min: '0', max: '0', step: '1', value: '0', 'aria-label': 'Video position' });
  var muteBtn = h('button', 'pl-btn', { type: 'button', 'aria-label': 'Mute' });
  var fullBtn = h('button', 'pl-btn', { type: 'button', 'aria-label': 'Full screen' });
  playBtn.innerHTML = ICON.play; muteBtn.innerHTML = ICON.sound; fullBtn.innerHTML = ICON.full;
  bar.appendChild(playBtn); bar.appendChild(time); bar.appendChild(seek); bar.appendChild(muteBtn);
  var canFull = !!(box.requestFullscreen || box.webkitRequestFullscreen);
  if (canFull) bar.appendChild(fullBtn);

  [shieldTop, shieldBottom, shield, ended, bar].forEach(function (n) { box.appendChild(n); });
  // Block right-click "copy video URL" style menus over the video area
  box.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------- helpers ----------
  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60), x = s % 60;
    if (m >= 60) return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ':' + String(x).padStart(2, '0');
    return m + ':' + String(x).padStart(2, '0');
  }
  var seeking = false;
  function refresh() {
    if (!player || !player.getDuration) return;
    var d = player.getDuration() || 0, t = player.getCurrentTime() || 0;
    if (d > 0) seek.max = String(Math.floor(d));
    if (!seeking) seek.value = String(Math.floor(t));
    seek.style.setProperty('--pct', d > 0 ? (t / d * 100) + '%' : '0%');
    time.textContent = fmt(t) + ' / ' + fmt(d);
    var muted = player.isMuted && player.isMuted();
    muteBtn.innerHTML = muted ? ICON.muted : ICON.sound;
    muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    if (d > 0 && t >= d - 3) markComplete();
  }
  function setPlaying(p) {
    playBtn.innerHTML = p ? ICON.pause : ICON.play;
    playBtn.setAttribute('aria-label', p ? 'Pause' : 'Play');
    box.classList.toggle('is-paused', !p);
  }
  function toggle() {
    if (!player || !player.getPlayerState) return;
    var st = player.getPlayerState();
    if (st === YT.PlayerState.PLAYING || st === YT.PlayerState.BUFFERING) player.pauseVideo();
    else player.playVideo();
  }
  function goLive() {           // after the first play: full shield + our controls
    if (started) return;
    started = true;
    shield.hidden = false; bar.hidden = false;
    box.classList.add('pl-started');
  }

  function markComplete() {
    if (done) return;
    done = true;
    fetch(el.getAttribute('data-complete-url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': el.getAttribute('data-csrf') },
      body: '{}',
      credentials: 'same-origin',
    }).then(function (r) {
      if (!r.ok) { done = false; return; }
      var after = document.querySelector('[data-after-watch]');
      var before = document.querySelector('[data-before-watch]');
      if (after) after.hidden = false;
      if (before) before.hidden = true;
    }).catch(function () { done = false; });
  }

  // ---------- control events ----------
  shield.addEventListener('click', toggle);
  playBtn.addEventListener('click', toggle);
  muteBtn.addEventListener('click', function () {
    if (!player) return;
    if (player.isMuted()) player.unMute(); else player.mute();
    setTimeout(refresh, 50);
  });
  seek.addEventListener('input', function () { seeking = true; time.textContent = fmt(+seek.value) + ' / ' + fmt(player && player.getDuration()); });
  seek.addEventListener('change', function () { seeking = false; if (player) player.seekTo(+seek.value, true); });
  fullBtn.addEventListener('click', function () {
    var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (box.requestFullscreen || box.webkitRequestFullscreen).call(box);
  });
  function onFs() {
    var on = (document.fullscreenElement || document.webkitFullscreenElement) === box;
    fullBtn.innerHTML = on ? ICON.exitfull : ICON.full;
    fullBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
  }
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);
  replayBtn.addEventListener('click', function () {
    ended.hidden = true;
    if (player) { player.seekTo(0, true); player.playVideo(); }
  });
  // Space bar / K to play-pause when the player has focus
  box.addEventListener('keydown', function (e) {
    if (!started || e.target === seek) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
  });

  // ---------- YouTube ----------
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('yt', {
      videoId: el.getAttribute('data-video-id'),
      playerVars: {
        controls: 0,          // our own controls instead
        disablekb: 1,
        fs: 0,                // YouTube's full screen would escape our shield; ours keeps it
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onStateChange: function (e) {
          var S = YT.PlayerState;
          if (e.data === S.PLAYING) { goLive(); ended.hidden = true; setPlaying(true); }
          else if (e.data === S.PAUSED || e.data === S.CUED) setPlaying(false);
          else if (e.data === S.ENDED) { setPlaying(false); ended.hidden = false; markComplete(); }
          refresh();
        },
      },
    });
    setInterval(refresh, 500);
  };

  var s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
})();
