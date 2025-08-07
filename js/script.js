// Data structure for tasks and lists
let lists = JSON.parse(localStorage.getItem('taskLists')) || [
    {
        id: 'default-list',
        name: 'My Tasks',
        tasks: []
    }
];

let currentListId = lists[0].id;
let currentTaskId = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// DOM Elements
const listsContainer = document.getElementById('lists-container');
const tasksContainer = document.getElementById('tasks-container');
const currentListName = document.getElementById('current-list-name');
const addTaskBtn = document.getElementById('add-task-btn');
const newListBtn = document.getElementById('new-list-btn');
const modalOverlay = document.getElementById('modal-overlay');
const listNameInput = document.getElementById('list-name-input');
const cancelModal = document.getElementById('cancel-modal');
const createModal = document.getElementById('create-modal');
const calendarContainer = document.getElementById('calendar-container');
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const sortSelect = document.getElementById('sort-select');
const calendarViewBtn = document.getElementById('calendar-view-btn');
const taskModalOverlay = document.getElementById('task-modal-overlay');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescriptionInput = document.getElementById('task-description-input');
const taskDueDateInput = document.getElementById('task-due-date');
const saveTaskBtn = document.getElementById('save-task-modal');
const cancelTaskBtn = document.getElementById('cancel-task-modal');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const taskModalTitle = document.getElementById('task-modal-title');

// Initialize the app
function init() {
    renderLists();
    renderTasks();
    renderCalendar();
    setupEventListeners();
}

// List Management
function renderLists() {
    listsContainer.innerHTML = '';
    
    lists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = `list-item ${list.id === currentListId ? 'active' : ''}`;
        listElement.dataset.id = list.id;
        
        listElement.innerHTML = `
            <i class="material-icons">list</i>
            <span>${list.name}</span>
            ${list.id !== 'default-list' ? `<button class="delete-list-btn" data-id="${list.id}"><i class="material-icons">delete</i></button>` : ''}
        `;
        
        listElement.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-list-btn')) {
                currentListId = list.id;
                renderLists();
                renderTasks();
                renderCalendar();
                currentListName.textContent = list.name;
            }
        });
        
        if (list.id !== 'default-list') {
            const deleteBtn = listElement.querySelector('.delete-list-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteList(list.id);
            });
        }
        
        listsContainer.appendChild(listElement);
    });
}

function deleteList(listId) {
    if (confirm('Are you sure you want to delete this list? All tasks in this list will be permanently deleted.')) {
        const listIndex = lists.findIndex(list => list.id === listId);
        
        if (listIndex !== -1) {
            if (currentListId === listId) {
                currentListId = 'default-list';
                currentListName.textContent = 'My Tasks';
            }
            
            lists.splice(listIndex, 1);
            saveToLocalStorage();
            renderLists();
            renderTasks();
            renderCalendar();
        }
    }
}

function createList(name) {
    const newList = {
        id: 'list-' + Date.now(),
        name: name,
        tasks: []
    };
    lists.push(newList);
    saveToLocalStorage();
    currentListId = newList.id;
    renderLists();
    renderTasks();
    renderCalendar();
    currentListName.textContent = name;
    closeModal();
}

// Task Management
function renderTasks() {
    const currentList = lists.find(list => list.id === currentListId);
    tasksContainer.innerHTML = '';
    
    if (!currentList.tasks.length) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="material-icons">check_circle</i>
                <h3>No tasks yet</h3>
                <p>Add your to-dos and keep track of them</p>
            </div>
        `;
        return;
    }
    
    const sortedTasks = [...currentList.tasks].sort((a, b) => {
        switch(sortSelect.value) {
            case 'dueDate':
                return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
            case 'createdAt':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'title':
                return a.title.localeCompare(b.title);
            case 'completed':
                return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
            default:
                return 0;
        }
    });

    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
    });
    
    if (currentList.tasks.length > 0) {
        const allCompleted = currentList.tasks.every(task => task.completed);
        if (allCompleted) {
            const completedMessage = document.createElement('div');
            completedMessage.className = 'empty-state';
            completedMessage.innerHTML = `<h3>All tasks complete</h3><p>Nice work!</p>`;
            tasksContainer.appendChild(completedMessage);
        }
    }
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.dataset.id = task.id;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDate = taskDate ? new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()) : null;
    
    let dateClass = '';
    if (dueDate) {
        if (taskDate < today) {
            dateClass = 'overdue';
        } else if (dueDate.getTime() === today.getTime()) {
            dateClass = 'today';
        }
    }
    
    taskElement.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
        <div class="task-content">
            <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            ${task.dueDate ? `
            <div class="task-details">
                <div class="task-date ${dateClass}">
                    <i class="material-icons">event</i>
                    <span>${formatDateTime(task.dueDate)}</span>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="task-actions">
            <button class="task-edit-btn" data-id="${task.id}">
                <i class="material-icons">edit</i>
            </button>
            <button class="task-delete-btn" data-id="${task.id}">
                <i class="material-icons">delete</i>
            </button>
        </div>
    `;
    
    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskCompletion(task.id);
    });

    const editBtn = taskElement.querySelector('.task-edit-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTaskModal(task.id);
    });

    const deleteBtn = taskElement.querySelector('.task-delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });

    taskElement.addEventListener('click', () => {
        openTaskModal(task.id);
    });
    
    return taskElement;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let dateStr = '';
    if (taskDate.getTime() === today.getTime()) {
        dateStr = 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
        dateStr = 'Tomorrow';
    } else {
        dateStr = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${dateStr}, ${timeStr}`;
}

function openTaskModal(taskId = null) {
    currentTaskId = taskId;
    const currentList = lists.find(list => list.id === currentListId);
    
    if (taskId) {
        const task = currentList.tasks.find(t => t.id === taskId);
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description || '';
        taskDueDateInput.value = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '';
        taskModalTitle.textContent = 'Edit Task';
        deleteTaskBtn.style.display = 'block';
    } else {
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskDueDateInput.value = '';
        taskModalTitle.textContent = 'Add Task';
        deleteTaskBtn.style.display = 'none';
    }
    
    taskModalOverlay.style.display = 'flex';
    taskTitleInput.focus();
}

function saveTask() {
    const title = taskTitleInput.value.trim();
    if (!title) return;
    
    const description = taskDescriptionInput.value.trim();
    const dueDate = taskDueDateInput.value;
    
    const currentList = lists.find(list => list.id === currentListId);
    
    if (currentTaskId) {
        const task = currentList.tasks.find(t => t.id === currentTaskId);
        task.title = title;
        task.description = description;
        task.dueDate = dueDate;
    } else {
        const newTask = {
            id: 'task-' + Date.now(),
            title: title,
            description: description,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        currentList.tasks.unshift(newTask);
    }
    
    saveToLocalStorage();
    renderTasks();
    renderCalendar();
    closeTaskModal();
}

function deleteTask(taskId) {
    const currentList = lists.find(list => list.id === currentListId);
    currentList.tasks = currentList.tasks.filter(task => task.id !== taskId);
    saveToLocalStorage();
    renderTasks();
    renderCalendar();
    closeTaskModal();
}

function closeTaskModal() {
    taskModalOverlay.style.display = 'none';
    currentTaskId = null;
}

function toggleTaskCompletion(taskId) {
    const currentList = lists.find(list => list.id === currentListId);
    const task = currentList.tasks.find(task => task.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveToLocalStorage();
        renderTasks();
        renderCalendar();
    }
}

// Calendar Management
function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day-header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = createCalendarDay(day, today);
        calendarGrid.appendChild(dayCell);
    }
    
    currentMonthYear.textContent = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
}

function createCalendarDay(day, today) {
    const dateStr = `${currentYear}-${currentMonth + 1}-${day}`;
    const dateObj = new Date(currentYear, currentMonth, day);
    
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.dataset.date = dateStr;
    
    if (dateObj.getTime() === today.getTime()) {
        dayCell.classList.add('today');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);
    
    const currentList = lists.find(list => list.id === currentListId);
    const tasksForDay = currentList.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getDate() === day && 
               taskDate.getMonth() === currentMonth && 
               taskDate.getFullYear() === currentYear;
    });
    
    if (tasksForDay.length > 0) {
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'day-tasks';
        
        tasksForDay.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `calendar-task ${task.completed ? 'completed' : ''}`;
            taskElement.textContent = task.title;
            taskElement.title = task.title;
            taskElement.dataset.id = task.id;
            tasksContainer.appendChild(taskElement);
            
            taskElement.addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });
        });
        
        dayCell.appendChild(tasksContainer);
    }
    
    dayCell.addEventListener('click', () => {
        taskDueDateInput.value = `${dateStr}T12:00`;
        openTaskModal();
    });
    
    return dayCell;
}

// Utility Functions
function saveToLocalStorage() {
    localStorage.setItem('taskLists', JSON.stringify(lists));
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

function toggleView() {
    if (calendarContainer.style.display === 'none') {
        tasksContainer.style.display = 'none';
        calendarContainer.style.display = 'block';
        calendarViewBtn.innerHTML = '<i class="material-icons">list</i><span>List</span>';
    } else {
        tasksContainer.style.display = 'block';
        calendarContainer.style.display = 'none';
        calendarViewBtn.innerHTML = '<i class="material-icons">calendar_today</i><span>Calendar</span>';
    }
}

// Event Listeners
function setupEventListeners() {
    // Task Actions
    addTaskBtn.addEventListener('click', () => openTaskModal());
    
    // List Actions
    newListBtn.addEventListener('click', () => {
        listNameInput.value = '';
        createModal.disabled = true;
        modalOverlay.style.display = 'flex';
        listNameInput.focus();
    });
    
    listNameInput.addEventListener('input', () => {
        createModal.disabled = !listNameInput.value.trim();
    });
    
    createModal.addEventListener('click', () => {
        if (listNameInput.value.trim()) {
            createList(listNameInput.value.trim());
        }
    });
    
    cancelModal.addEventListener('click', closeModal);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    listNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && listNameInput.value.trim()) {
            createList(listNameInput.value.trim());
        }
    });
    
    // Calendar Navigation
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
    
    // View Controls
    sortSelect.addEventListener('change', renderTasks);
    calendarViewBtn.addEventListener('click', toggleView);
    
    // Task Modal
    saveTaskBtn.addEventListener('click', saveTask);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    deleteTaskBtn.addEventListener('click', () => {
        if (currentTaskId) deleteTask(currentTaskId);
    });
    
    taskModalOverlay.addEventListener('click', (e) => {
        if (e.target === taskModalOverlay) {
            closeTaskModal();
        }
    });
}

// Initialize the app
init();