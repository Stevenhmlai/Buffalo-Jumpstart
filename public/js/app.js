// Small shared behaviours (no inline scripts, so the CSP can stay strict)
(function () {
  var t = document.querySelector('[data-menu-toggle]');
  var m = document.querySelector('[data-menu]');
  if (t && m) t.addEventListener('click', function () {
    var open = m.classList.toggle('open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Confirmations: <form data-confirm="Are you sure?">
  // Shown on the page rather than with window.confirm(), which some browsers and
  // embedded browser panes block silently (the click then does nothing at all).
  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    var box = null;
    f.addEventListener('submit', function (e) {
      if (f.dataset.confirmed === '1') { f.dataset.confirmed = ''; return; }
      e.preventDefault();
      var submitter = e.submitter || null;
      if (box) { box.querySelector('[data-yes]').focus(); return; }
      box = document.createElement('div');
      box.className = 'alert alert-warn confirm-box';
      box.setAttribute('role', 'alertdialog');
      var msg = document.createElement('p');
      msg.textContent = f.getAttribute('data-confirm');
      var row = document.createElement('div');
      row.className = 'row';
      var yes = document.createElement('button');
      yes.type = 'button'; yes.className = 'btn btn-sm'; yes.textContent = 'Yes, continue'; yes.setAttribute('data-yes', '');
      var no = document.createElement('button');
      no.type = 'button'; no.className = 'btn btn-ghost btn-sm'; no.textContent = 'Cancel';
      row.appendChild(yes); row.appendChild(no);
      box.appendChild(msg); box.appendChild(row);
      f.insertAdjacentElement('afterend', box);
      yes.addEventListener('click', function () {
        box.remove(); box = null;
        f.dataset.confirmed = '1';
        if (f.requestSubmit) f.requestSubmit(submitter && submitter.form === f ? submitter : undefined); else f.submit();
      });
      no.addEventListener('click', function () { box.remove(); box = null; });
      yes.focus();
    });
  });

  // Form problems (empty required box, bad email…) shown on the page, next to the field.
  // Browsers normally use a small pop-up bubble, which some browsers and embedded
  // browser panes never show, so the Save button just seemed to do nothing.
  var firstInvalidAt = 0;
  document.addEventListener('invalid', function (e) {
    var el = e.target;
    e.preventDefault();
    var holder = el.closest('.field') || el.closest('.opt-row') || el.parentNode;
    var msg = holder.querySelector(':scope > .field-msg');
    if (!msg) {
      msg = document.createElement('span');
      msg.className = 'field-msg';
      msg.setAttribute('role', 'alert');
      holder.appendChild(msg);
    }
    msg.textContent = el.validationMessage || 'Please check this field.';
    el.classList.add('is-invalid');
    var now = Date.now();
    if (now - firstInvalidAt > 300) {           // first problem of this submit attempt
      firstInvalidAt = now;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }, true);
  var clearInvalid = function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('is-invalid') || !el.checkValidity()) return;
    el.classList.remove('is-invalid');
    var holder = el.closest('.field') || el.closest('.opt-row') || el.parentNode;
    var msg = holder && holder.querySelector(':scope > .field-msg');
    if (msg) msg.remove();
  };
  document.addEventListener('input', clearInvalid, true);
  document.addEventListener('change', clearInvalid, true);

  // Busy state: <button data-busy="Adding…"> is disabled and relabelled once its form submits,
  // so a slow request can't be submitted twice and the admin can see something is happening.
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      if (e.defaultPrevented) return;
      var b = f.querySelector('button[data-busy]');
      if (!b) return;
      setTimeout(function () { b.disabled = true; b.textContent = b.getAttribute('data-busy'); }, 0);
    });
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
        if (d.found) { out.textContent = 'Your upline is ' + d.name + '.'; out.className = 'upline-check ok'; }
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
