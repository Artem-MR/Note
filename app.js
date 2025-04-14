// Класс для работы с заметками
class Notepad {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.trash = JSON.parse(localStorage.getItem('trash')) || [];
        this.currentNoteId = null;
        this.isEditing = false;
    }

    saveToLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
        localStorage.setItem('trash', JSON.stringify(this.trash));
    }

    createNote(title, content) {
        const newNote = {
            id: Date.now(),
            title,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.notes.push(newNote);
        this.saveToLocalStorage();
        return newNote;
    }

    updateNote(id, title, content) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            this.notes[noteIndex] = {
                ...this.notes[noteIndex],
                title,
                content,
                updatedAt: new Date().toISOString()
            };
            this.saveToLocalStorage();
            return this.notes[noteIndex];
        }
        return null;
    }

    deleteNote(id) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            const [deletedNote] = this.notes.splice(noteIndex, 1);
            this.trash.push(deletedNote);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    permanentlyDeleteNote(id) {
        const noteIndex = this.trash.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            this.trash.splice(noteIndex, 1);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    restoreNote(id) {
        const noteIndex = this.trash.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            const [restoredNote] = this.trash.splice(noteIndex, 1);
            this.notes.push(restoredNote);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    emptyTrash() {
        this.trash = [];
        this.saveToLocalStorage();
    }

    restoreAllNotes() {
        this.notes = [...this.notes, ...this.trash];
        this.trash = [];
        this.saveToLocalStorage();
    }

    searchNotes(query, inTrash = false) {
        const source = inTrash ? this.trash : this.notes;
        if (!query) return source;
        
        const lowerQuery = query.toLowerCase();
        return source.filter(note => 
            note.title.toLowerCase().includes(lowerQuery) || 
            note.content.toLowerCase().includes(lowerQuery)
        );
    }

    getNoteById(id, inTrash = false) {
        const source = inTrash ? this.trash : this.notes;
        return source.find(note => note.id === id);
    }
}

// Инициализация приложения
const notepad = new Notepad();
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    document.documentElement.style.setProperty('--hover-transition', '0.1s');
    document.body.classList.add('mobile-device');
}

// DOM элементы
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const saveNoteBtn = document.getElementById('save-note');
const clearNoteBtn = document.getElementById('clear-note');
const notesList = document.getElementById('notes-list');
const trashList = document.getElementById('trash-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchTrashInput = document.getElementById('search-trash-input');
const searchTrashBtn = document.getElementById('search-trash-btn');
const emptyTrashBtn = document.getElementById('empty-trash');
const restoreAllBtn = document.getElementById('restore-all');

// Функция для отображения заметок
function displayNotes(notes = notepad.notes, container = notesList) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-sticky-note"></i>
                <p>${container === notesList ? 'Нет заметок' : 'Корзина пуста'}</p>
            </div>
        `;
        return;
    }
    
    notes.forEach(note => {
        const isTrash = container === trashList;
        const noteDate = new Date(note.updatedAt || note.createdAt);
        const formattedDate = noteDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card' + (isMobile ? ' mobile-note' : '');
        noteCard.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <div class="note-date">${formattedDate}</div>
            <div class="note-actions">
                ${isTrash ? `
                    <button class="restore-btn" data-id="${note.id}">
                        <i class="fas fa-undo"></i> Восстановить
                    </button>
                    <button class="permanent-delete-btn" data-id="${note.id}">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                ` : `
                    <button class="edit-btn" data-id="${note.id}">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="delete-btn" data-id="${note.id}">
                        <i class="fas fa-trash-alt"></i> Удалить
                    </button>
                `}
            </div>
        `;
        
        container.appendChild(noteCard);
    });
    
    addNoteActionsEventListeners(container);
}

function addNoteActionsEventListeners(container) {
    if (!container) return;
    
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = parseInt(e.currentTarget.getAttribute('data-id'));
            const note = notepad.getNoteById(noteId);
            
            if (note) {
                notepad.currentNoteId = noteId;
                notepad.isEditing = true;
                noteTitleInput.value = note.title;
                noteContentInput.value = note.content;
                noteTitleInput.focus();
                
                if (isMobile) {
                    setTimeout(() => {
                        noteTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            }
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = parseInt(e.currentTarget.getAttribute('data-id'));
            if (confirm('Вы уверены, что хотите переместить заметку в корзину?')) {
                notepad.deleteNote(noteId);
                displayNotes();
                
                if (trashList) {
                    displayNotes(notepad.trash, trashList);
                }
            }
        });
    });
    
    container.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = parseInt(e.currentTarget.getAttribute('data-id'));
            notepad.restoreNote(noteId);
            displayNotes(notepad.trash, trashList);
            
            if (notesList) {
                displayNotes();
            }
        });
    });
    
    container.querySelectorAll('.permanent-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = parseInt(e.currentTarget.getAttribute('data-id'));
            if (confirm('Вы уверены, что хотите окончательно удалить заметку? Это действие нельзя отменить.')) {
                notepad.permanentlyDeleteNote(noteId);
                displayNotes(notepad.trash, trashList);
            }
        });
    });
}

function showMobileToast(message) {
    if (!isMobile) {
        alert(message);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 10);
}

function resetNoteForm() {
    noteTitleInput.value = '';
    noteContentInput.value = '';
    notepad.currentNoteId = null;
    notepad.isEditing = false;
}

// Обработчики событий для главной страницы
if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', () => {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        
        if (!title || !content) {
            showMobileToast('Заголовок и содержание заметки не могут быть пустыми');
            return;
        }
        
        if (notepad.isEditing) {
            const updatedNote = notepad.updateNote(notepad.currentNoteId, title, content);
            if (updatedNote) {
                showMobileToast('Заметка обновлена');
            }
        } else {
            notepad.createNote(title, content);
            showMobileToast('Заметка создана');
        }
        
        resetNoteForm();
        displayNotes();
    });
}

if (clearNoteBtn) {
    clearNoteBtn.addEventListener('click', resetNoteForm);
}

if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        const results = notepad.searchNotes(query);
        displayNotes(results);
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            const results = notepad.searchNotes(query);
            displayNotes(results);
        }
    });
}

// Обработчики событий для страницы корзины
if (searchTrashInput && searchTrashBtn) {
    searchTrashBtn.addEventListener('click', () => {
        const query = searchTrashInput.value.trim();
        const results = notepad.searchNotes(query, true);
        displayNotes(results, trashList);
    });
    
    searchTrashInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const query = searchTrashInput.value.trim();
            const results = notepad.searchNotes(query, true);
            displayNotes(results, trashList);
        }
    });
}

if (emptyTrashBtn) {
    emptyTrashBtn.addEventListener('click', () => {
        if (notepad.trash.length === 0) {
            showMobileToast('Корзина уже пуста');
            return;
        }
        
        if (confirm('Вы уверены, что хотите полностью очистить корзину? Это действие нельзя отменить.')) {
            notepad.emptyTrash();
            displayNotes(notepad.trash, trashList);
            showMobileToast('Корзина очищена');
        }
    });
}

if (restoreAllBtn) {
    restoreAllBtn.addEventListener('click', () => {
        if (notepad.trash.length === 0) {
            showMobileToast('В корзине нет заметок для восстановления');
            return;
        }
        
        notepad.restoreAllNotes();
        displayNotes(notepad.trash, trashList);
        
        if (notesList) {
            displayNotes();
        }
        
        showMobileToast('Все заметки восстановлены');
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (notesList) {
        displayNotes();
    }
    
    if (trashList) {
        displayNotes(notepad.trash, trashList);
    }
});