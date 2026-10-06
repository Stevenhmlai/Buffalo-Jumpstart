// Small shared behaviours (no inline scripts, so the CSP can stay strict)
(function () {
  var t = document.querySelector('[data-menu-toggle]');
  var m = document.querySelector('[data-menu]');
  if (t && m) t.addEventListener('click', function () {
    var open = m.classList.toggle('open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Confirm dialogs: <form data-confirm="Are you sure?">
  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    f.addEventListener('submit', function (e) { if (!confirm(f.getAttribute('data-confirm'))) e.preventDefault(); });
  });

  // Upline lookup on the registration form
  var up = document.querySelector('[data-upline-input]');
  var out = document.querySelector('[data-upline-result]');
  if (up && out) {
    var timer;
    var check = function () {
      var code = up.value.trim();
      if (code.length < 3) { out.textContent = ''; out.className = 'upline-check'; return; }
      fetch('/api/upline?code=' + encodeURIComponent(code)).then(function (r) { return r.json(); }).then(function (d) {
        if (d.found) { out.textContent = 'Your upline: ' + d.name + '. Is this correct?'; out.className = 'upline-check ok'; }
        else { out.textContent = "We couldn't find this code. You can still register, and an admin will check it."; out.className = 'upline-check no'; }
      }).catch(function () {});
    };
    up.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(check, 400); });
    if (up.value) check();
  }

  // Quiz: question type switch in admin form
  document.querySelectorAll('[data-qform]').forEach(function (f) {
    var sel = f.querySelector('select[name=qtype]');
    var mc = f.querySelector('[data-mc]');
    var tf = f.querySelector('[data-tf]');
    var sync = function () {
      var isTf = sel.value === 'tf';
      mc.hidden = isTf; tf.hidden = !isTf;
      mc.querySelectorAll('input').forEach(function (i) { i.disabled = isTf; });
      tf.querySelectorAll('input').forEach(function (i) { i.disabled = !isTf; });
    };
    sel.addEventListener('change', sync); sync();
  });

  // Live check-in counter on the QR screen
  var counter = document.querySelector('[data-count-url]');
  if (counter) setInterval(function () {
    fetch(counter.getAttribute('data-count-url')).then(function (r) { return r.json(); })
      .then(function (d) { counter.textContent = d.count; }).catch(function () {});
  }, 5000);
})();
