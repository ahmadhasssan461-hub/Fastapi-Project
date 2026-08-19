// ---- state ----
const state = {
  token: localStorage.getItem('blogapi_token') || null,
  username: localStorage.getItem('blogapi_username') || null,
  page: 1,
  limit: 5,
  search: '',
  editingId: null,
};

// ---- element refs ----
const el = {
  authSlot: document.getElementById('auth-slot'),
  bannerRegion: document.getElementById('banner-region'),
  composer: document.getElementById('composer'),
  composerForm: document.getElementById('composer-form'),
  composerError: document.getElementById('composer-error'),
  postTitle: document.getElementById('post-title'),
  postContent: document.getElementById('post-content'),
  lockedHint: document.getElementById('locked-hint'),
  feed: document.getElementById('feed'),
  emptyState: document.getElementById('empty-state'),
  pager: document.getElementById('pager'),
  pagerLabel: document.getElementById('pager-label'),
  pagerPrev: document.getElementById('pager-prev'),
  pagerNext: document.getElementById('pager-next'),
  searchInput: document.getElementById('search-input'),
  authBackdrop: document.getElementById('auth-backdrop'),
  btnOpenAuth: document.getElementById('btn-open-auth'),
  modalClose: document.getElementById('modal-close'),
  tabSignin: document.getElementById('tab-signin'),
  tabRegister: document.getElementById('tab-register'),
  signinForm: document.getElementById('signin-form'),
  registerForm: document.getElementById('register-form'),
  signinError: document.getElementById('signin-error'),
  registerError: document.getElementById('register-error'),
};

// ---- api helper ----
async function api(path, { method = 'GET', body = null, form = false, auth = false } = {}) {
  const headers = {};
  let payload = body;

  if (body && form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(body).toString();
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  if (auth && state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const res = await fetch(path, { method, headers, body: payload });

  if (res.status === 401 && auth) {
    signOut();
    showBanner('error', "Your session expired. Sign in again.");
  }

  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }

  if (!res.ok) {
    const detail = (data && data.detail) ? data.detail : 'Something went wrong.';
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong.');
  }
  return data;
}

// ---- banners ----
function showBanner(type, message) {
  const bar = document.createElement('div');
  bar.className = `banner banner-${type}`;
  bar.innerHTML = `<span></span><button aria-label="Dismiss">×</button>`;
  bar.querySelector('span').textContent = message;
  bar.querySelector('button').onclick = () => bar.remove();
  el.bannerRegion.appendChild(bar);
  setTimeout(() => bar.remove(), 5000);
}

// ---- auth UI ----
function renderAuthSlot() {
  el.authSlot.innerHTML = '';
  if (state.token && state.username) {
    const span = document.createElement('span');
    span.className = 'auth-user';
    span.innerHTML = `signed in as <strong>${escapeHtml(state.username)}</strong>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.textContent = 'sign out';
    btn.onclick = signOut;
    el.authSlot.appendChild(span);
    el.authSlot.appendChild(btn);
    el.composer.hidden = false;
    el.lockedHint.hidden = true;
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.id = 'btn-open-auth';
    btn.textContent = 'sign in';
    btn.onclick = () => openAuthModal('signin');
    el.authSlot.appendChild(btn);
    el.composer.hidden = true;
    el.lockedHint.hidden = false;
  }
}

function signOut() {
  state.token = null;
  state.username = null;
  localStorage.removeItem('blogapi_token');
  localStorage.removeItem('blogapi_username');
  renderAuthSlot();
  loadBlogs();
}

function openAuthModal(mode) {
  el.authBackdrop.hidden = false;
  switchAuthTab(mode);
  (mode === 'signin' ? document.getElementById('signin-username') : document.getElementById('register-username')).focus();
}

// NEW
function openAuthModal(mode) {
  el.authBackdrop.hidden = false;
  el.authBackdrop.style.display = 'flex';
  switchAuthTab(mode);
  (mode === 'signin' ? document.getElementById('signin-username') : document.getElementById('register-username')).focus();
}

function closeAuthModal() {
  el.authBackdrop.hidden = true;
  el.authBackdrop.style.display = 'none';
  el.signinError.textContent = '';
  el.registerError.textContent = '';
  el.signinForm.reset();
  el.registerForm.reset();
}

el.btnOpenAuth.addEventListener('click', () => openAuthModal('signin'));
el.modalClose.addEventListener('click', closeAuthModal);
el.authBackdrop.addEventListener('click', (e) => { if (e.target === el.authBackdrop) closeAuthModal(); });
el.tabSignin.addEventListener('click', () => switchAuthTab('signin'));
el.tabRegister.addEventListener('click', () => switchAuthTab('register'));

el.signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.signinError.textContent = '';
  const username = document.getElementById('signin-username').value.trim();
  const password = document.getElementById('signin-password').value;
  if (!username || !password) {
    el.signinError.textContent = 'Enter a username and password.';
    return;
  }
  try {
    const data = await api('/login', { method: 'POST', form: true, body: { username, password } });
    state.token = data.access_token;
    state.username = username;
    localStorage.setItem('blogapi_token', state.token);
    localStorage.setItem('blogapi_username', username);
    closeAuthModal();
    renderAuthSlot();
    showBanner('success', `Signed in as ${username}.`);
    loadBlogs();
  } catch (err) {
    el.signinError.textContent = err.message;
  }
});

el.registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.registerError.textContent = '';
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  if (username.length < 3) {
    el.registerError.textContent = 'Username needs at least 3 characters.';
    return;
  }
  if (password.length < 6) {
    el.registerError.textContent = 'Password needs at least 6 characters.';
    return;
  }
  try {
    await api('/register', { method: 'POST', body: { username, password } });
    showBanner('success', 'Account created. Sign in to continue.');
    switchAuthTab('signin');
    document.getElementById('signin-username').value = username;
    document.getElementById('signin-password').focus();
  } catch (err) {
    el.registerError.textContent = err.message;
  }
});

// ---- composer (create) ----
el.composerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.composerError.textContent = '';
  const title = el.postTitle.value.trim();
  const content = el.postContent.value.trim();
  if (!title || !content) {
    el.composerError.textContent = 'Both a title and some content are needed.';
    return;
  }
  try {
    await api('/blogs', { method: 'POST', auth: true, body: { title, content } });
    el.composerForm.reset();
    showBanner('success', 'Entry published.');
    state.page = 1;
    loadBlogs();
  } catch (err) {
    el.composerError.textContent = err.message;
  }
});

// ---- feed ----
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function buildQuery() {
  const params = new URLSearchParams({ page: state.page, limit: state.limit });
  if (state.search) params.set('search', state.search);
  return params.toString();
}

async function loadBlogs() {
  el.feed.innerHTML = '';
  let blogs = [];
  try {
    blogs = await api(`/blogs?${buildQuery()}`);
  } catch (err) {
    showBanner('error', "Couldn't load entries. Check the API is running.");
    return;
  }

  if (blogs.length === 0 && state.page > 1) {
    state.page -= 1;
    return loadBlogs();
  }

  el.emptyState.hidden = blogs.length > 0;
  blogs.forEach((blog) => el.feed.appendChild(renderEntry(blog)));

  el.pager.hidden = false;
  el.pagerLabel.textContent = `page ${state.page}`;
  el.pagerPrev.disabled = state.page <= 1;
  el.pagerNext.disabled = blogs.length < state.limit;
}

function renderEntry(blog) {
  const card = document.createElement('article');
  card.className = 'entry';

  const idTag = `#${String(blog.id).padStart(3, '0')}`;
  const isAuthed = Boolean(state.token);

  card.innerHTML = `
    <div class="entry-head">
      <span class="entry-id">${idTag}</span>
      <h3 class="entry-title">${escapeHtml(blog.title)}</h3>
    </div>
    <p class="entry-body">${escapeHtml(blog.content)}</p>
    ${isAuthed ? `<div class="entry-foot">
      <button class="btn-edit-text" data-action="edit">edit</button>
      <button class="btn-danger-text" data-action="delete">delete</button>
    </div>` : ''}
  `;

  if (isAuthed) {
    card.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(card, blog));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => confirmDelete(blog.id));
  }

  return card;
}

function startEdit(card, blog) {
  card.innerHTML = `
    <div class="entry-head"><span class="entry-id">#${String(blog.id).padStart(3, '0')}</span></div>
    <form class="entry-edit-form">
      <input type="text" value="${escapeHtml(blog.title)}" required maxlength="255">
      <textarea rows="4" required>${escapeHtml(blog.content)}</textarea>
      <span class="field-error"></span>
      <div class="entry-edit-actions">
        <button type="submit" class="btn btn-accent">save</button>
        <button type="button" class="btn btn-ghost" data-action="cancel">cancel</button>
      </div>
    </form>
  `;
  const form = card.querySelector('form');
  const titleInput = form.querySelector('input');
  const contentInput = form.querySelector('textarea');
  const errorEl = form.querySelector('.field-error');

  form.querySelector('[data-action="cancel"]').addEventListener('click', () => loadBlogs());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      errorEl.textContent = 'Both a title and some content are needed.';
      return;
    }
    try {
      await api(`/blogs/${blog.id}`, { method: 'PUT', auth: true, body: { title, content } });
      showBanner('success', 'Entry updated.');
      loadBlogs();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

async function confirmDelete(id) {
  if (!window.confirm('Delete this entry? This can\'t be undone.')) return;
  try {
    await api(`/blogs/${id}`, { method: 'DELETE', auth: true });
    showBanner('success', 'Entry deleted.');
    loadBlogs();
  } catch (err) {
    showBanner('error', err.message);
  }
}

// ---- search + pagination ----
let searchTimer = null;
el.searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = el.searchInput.value.trim();
    state.page = 1;
    loadBlogs();
  }, 350);
});

el.pagerPrev.addEventListener('click', () => {
  if (state.page > 1) { state.page -= 1; loadBlogs(); }
});
el.pagerNext.addEventListener('click', () => {
  state.page += 1; loadBlogs();
});

// ---- init ----
renderAuthSlot();
loadBlogs();
