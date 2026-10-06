// YouTube player: tells the portal when the member reaches the end of the video.
(function () {
  var el = document.getElementById('yt');
  if (!el) return;
  var done = false;
  var player;

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
      if (after) after.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function () { done = false; });
  }

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('yt', {
      videoId: el.getAttribute('data-video-id'),
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) markComplete();
        },
      },
    });
    // Also count it if the member is within the last 3 seconds (some players stop just short of ENDED)
    setInterval(function () {
      if (!player || done || !player.getDuration) return;
      var d = player.getDuration(), t = player.getCurrentTime();
      if (d > 0 && t >= d - 3) markComplete();
    }, 2000);
  };

  var s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
})();
