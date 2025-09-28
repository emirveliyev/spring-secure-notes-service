document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const perPageEl = document.getElementById('perPage');
    const sortByEl = document.getElementById('sortBy');
    const notesContainer = document.getElementById('notesContainer');
    const pager = document.getElementById('pager');
    const toastEl = new bootstrap.Toast(document.getElementById('toast'));
    const toastBody = document.getElementById('toastBody');

    let notes = [];
    let filtered = [];
    let currentPage = 1;
    let perPage = parseInt(perPageEl.value, 10) || 10;
    let currentEditId = null;

    function showToast(text) {
        toastBody.textContent = text;
        toastEl.show();
    }

    function formatDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleString('ru-RU', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
        } catch (e) {
            return iso;
        }
    }

    async function fetchNotes() {
        try {
            const res = await fetch('/api/notes');
            if (!res.ok) throw new Error('Ошибка загрузки');
            notes = await res.json();
            applyFilters();
        } catch (e) {
            showToast('Ошибка: не удалось получить заметки');
        }
    }

    function applyFilters() {
        const q = (searchInput.value || '').trim().toLowerCase();
        filtered = notes.filter(n => {
            const text = (n.text || '').toString().toLowerCase();
            const author = (n.author || '').toString().toLowerCase();
            return text.includes(q) || author.includes(q);
        });
        const sort = sortByEl.value;
        if (sort === 'createdDesc') {
            filtered.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sort === 'createdAsc') {
            filtered.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'author') {
            filtered.sort((a,b)=> (a.author||'').localeCompare(b.author||''));
        }
        currentPage = 1;
        perPage = parseInt(perPageEl.value,10) || 10;
        renderNotes();
    }

    function renderNotes() {
        notesContainer.innerHTML = '';
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / perPage));
        if (currentPage > pages) currentPage = pages;
        const start = (currentPage-1)*perPage;
        const pageItems = filtered.slice(start, start+perPage);
        if (pageItems.length === 0) {
            notesContainer.innerHTML = '<div class="col-12"><div class="alert alert-secondary">Заметок пока нет</div></div>';
        } else {
            for (const note of pageItems) {
                const col = document.createElement('div');
                col.className = 'col-12';
                col.innerHTML = `
                    <div class="card shadow-sm">
                        <div class="card-body d-flex flex-column flex-md-row justify-content-between gap-2">
                            <div class="note-main">
                                <div class="note-text mb-2">${escapeHtml(note.text)}</div>
                                <div class="note-meta">
                                    <span class="me-3"><i class="bi bi-person-circle"></i> ${escapeHtml(note.author || 'Аноним')}</span>
                                    <span><i class="bi bi-clock"></i> ${formatDate(note.createdAt)}</span>
                                </div>
                            </div>
                            <div class="note-actions d-flex align-items-start gap-2">
                                <button class="btn btn-sm btn-outline-primary" data-id="${note.id}" data-action="edit" title="Редактировать"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger" data-id="${note.id}" data-action="delete" title="Удалить"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                notesContainer.appendChild(col);
            }
        }
        renderPager(pages);
        attachCardHandlers();
    }

    function renderPager(pages) {
        pager.innerHTML = '';
        const makeItem = (p, text, active=false, disabled=false) => {
            const li = document.createElement('li');
            li.className = 'page-item' + (active ? ' active' : '') + (disabled ? ' disabled' : '');
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = text;
            a.addEventListener('click', (e)=> {
                e.preventDefault();
                if (!disabled) {
                    currentPage = p;
                    renderNotes();
                }
            });
            li.appendChild(a);
            return li;
        };
        pager.appendChild(makeItem(1, '«', currentPage===1, false));
        for (let i=1;i<=pages;i++) {
            pager.appendChild(makeItem(i, i, currentPage===i, false));
        }
        pager.appendChild(makeItem(pages, '»', currentPage===pages, false));
    }

    function attachCardHandlers() {
        notesContainer.querySelectorAll('button[data-action]').forEach(btn=>{
            btn.onclick = async ()=> {
                const id = btn.getAttribute('data-id');
                const action = btn.getAttribute('data-action');
                if (action === 'delete') {
                    if (!confirm('Удалить заметку?')) return;
                    await deleteNote(id);
                } else if (action === 'edit') {
                    openEditModal(id);
                }
            };
        });
    }

    async function deleteNote(id) {
        try {
            const res = await fetch('/api/notes/' + id, {method:'DELETE'});
            if (res.status === 204) {
                await fetchNotes();
                showToast('Заметка удалена');
            } else {
                showToast('Ошибка удаления');
            }
        } catch (e) {
            showToast('Ошибка удаления');
        }
    }

    function openEditModal(id) {
        const note = notes.find(n=> n.id == id);
        if (!note) return;
        currentEditId = id;
        document.getElementById('editText').value = note.text || '';
        document.getElementById('editAuthor').value = note.author || '';
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    }

    document.getElementById('editForm').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const text = document.getElementById('editText').value.trim();
        const author = document.getElementById('editAuthor').value.trim();
        if (!text) {
            showToast('Текст не может быть пустым');
            return;
        }
        try {
            const res = await fetch('/api/notes/' + currentEditId, {
                method:'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({text, author})
            });
            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                await fetchNotes();
                showToast('Заметка обновлена');
            } else {
                showToast('Ошибка обновления');
            }
        } catch (e) {
            showToast('Ошибка обновления');
        }
    });

    document.getElementById('addForm').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const text = document.getElementById('textInput').value.trim();
        const author = document.getElementById('authorInput').value.trim();
        if (!text) return;
        try {
            const res = await fetch('/api/notes', {
                method:'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({text, author})
            });
            if (res.status === 201) {
                document.getElementById('textInput').value = '';
                document.getElementById('authorInput').value = '';
                await fetchNotes();
                showToast('Заметка добавлена');
            } else {
                showToast('Ошибка добавления');
            }
        } catch (e) {
            showToast('Ошибка добавления');
        }
    });

    document.getElementById('clearBtn').addEventListener('click', ()=>{
        searchInput.value = '';
        perPageEl.value = '10';
        sortByEl.value = 'createdDesc';
        applyFilters();
    });

    document.getElementById('refreshBtn').addEventListener('click', ()=> fetchNotes());
    searchInput.addEventListener('input', debounce(()=> applyFilters(), 250));
    perPageEl.addEventListener('change', ()=> applyFilters());
    sortByEl.addEventListener('change', ()=> applyFilters());

    function debounce(fn, wait) {
        let t;
        return (...args)=> {
            clearTimeout(t);
            t = setTimeout(()=> fn.apply(this, args), wait);
        };
    }

    function escapeHtml(s) {
        if (!s) return '';
        return s
            .replaceAll('&','&amp;')
            .replaceAll('<','&lt;')
            .replaceAll('>','&gt;')
            .replaceAll('"','&quot;')
            .replaceAll("'",'&#039;')
            .replaceAll('\n','<br/>');
    }

    fetchNotes();
});