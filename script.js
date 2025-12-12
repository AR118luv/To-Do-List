
// script.js - Complete To-Do List Application JavaScript

// Global variables
let tasks = [];
let currentFilter = 'all';
let currentSort = 'newest';
let editingTaskId = null;

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const searchInput = document.getElementById('searchTasks');
const sortSelect = document.getElementById('sortTasks');

// Statistics elements
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const overdueTasksEl = document.getElementById('overdueTasks');
const taskCountEl = document.getElementById('taskCount');

// Filter buttons
const filterButtons = {
    all: document.getElementById('filterAll'),
    pending: document.getElementById('filterPending'),
    completed: document.getElementById('filterCompleted'),
    overdue: document.getElementById('filterOverdue')
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('To-Do List App initialized');
    loadTasks();
    setupEventListeners();
    updateDisplay();
    updateStatistics();
});

// Setup all event listeners
function setupEventListeners() {
    // Task form submission
    if (taskForm) {
        taskForm.addEventListener('submit', handleAddTask);
    }

    // Edit form submission
    if (editForm) {
        editForm.addEventListener('submit', handleEditTask);
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    // Filter buttons
    Object.keys(filterButtons).forEach(filter => {
        if (filterButtons[filter]) {
            filterButtons[filter].addEventListener('click', () => setFilter(filter));
        }
    });

    // Modal close functionality
    const cancelEditBtn = document.getElementById('cancelEdit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }

    // Close modal when clicking outside
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    }

    // Export/Import functionality
    const exportBtn = document.getElementById('exportTasks');
    const importBtn = document.getElementById('importTasks');
    const importFile = document.getElementById('importFile');

    if (exportBtn) {
        exportBtn.addEventListener('click', exportTasks);
    }

    if (importBtn) {
        importBtn.addEventListener('click', () => importFile.click());
    }

    if (importFile) {
        importFile.addEventListener('change', importTasks);
    }

    // Profile form (if on profile page)
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        setupProfilePage();
    }

    // Contact form (if on contact page)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        setupContactPage();
    }
}

// Task Management Functions
function handleAddTask(e) {
    e.preventDefault();
    
    const formData = new FormData(taskForm);
    const taskData = {
        id: Date.now().toString(),
        name: formData.get('taskName').trim(),
        priority: formData.get('priority'),
        category: formData.get('category'),
        dueDate: formData.get('dueDate'),
        dueTime: formData.get('dueTime'),
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    if (!taskData.name) {
        showNotification('Please enter a task name!', 'error');
        return;
    }

    tasks.push(taskData);
    saveTasks();
    updateDisplay();
    updateStatistics();
    taskForm.reset();
    
    // Auto-fill today's date for next task
    const dateInput = document.getElementById('dueDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    showNotification('Task added successfully! 🎉', 'success');
}

function handleEditTask(e) {
    e.preventDefault();
    
    const formData = new FormData(editForm);
    const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
    
    if (taskIndex === -1) return;

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        name: formData.get('editTaskName').trim(),
        priority: formData.get('editPriority'),
        category: formData.get('editCategory'),
        dueDate: formData.get('editDueDate'),
        dueTime: formData.get('editDueTime')
    };

    saveTasks();
    updateDisplay();
    updateStatistics();
    closeEditModal();
    showNotification('Task updated successfully! ✅', 'success');
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    saveTasks();
    updateDisplay();
    updateStatistics();
    
    const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending ⏳';
    showNotification(message, 'success');
}

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    updateDisplay();
    updateStatistics();
    showNotification('Task deleted successfully! 🗑️', 'success');
}

function duplicateTask(taskId) {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const duplicatedTask = {
        ...originalTask,
        id: Date.now().toString(),
        name: `${originalTask.name} (Copy)`,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.push(duplicatedTask);
    saveTasks();
    updateDisplay();
    updateStatistics();
    showNotification('Task duplicated successfully! 📋', 'success');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    
    // Populate edit form
    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editPriority').value = task.priority;
    document.getElementById('editCategory').value = task.category;
    document.getElementById('editDueDate').value = task.dueDate || '';
    document.getElementById('editDueTime').value = task.dueTime || '';

    // Show modal
    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
    editModal.setAttribute('aria-hidden', 'false');
    document.getElementById('editTaskName').focus();
}

function closeEditModal() {
    editModal.classList.add('hidden');
    editModal.classList.remove('flex');
    editModal.setAttribute('aria-hidden', 'true');
    editingTaskId = null;
    editForm.reset();
}

// Display Functions
function updateDisplay() {
    if (!taskList) return;

    const filteredTasks = getFilteredTasks();
    const sortedTasks = getSortedTasks(filteredTasks);

    if (sortedTasks.length === 0) {
        taskList.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    } else {
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        renderTasks(sortedTasks);
    }

    updateTaskCount(sortedTasks.length);
}

function renderTasks(tasksToRender) {
    taskList.innerHTML = tasksToRender.map(task => createTaskHTML(task)).join('');
}

function createTaskHTML(task) {
    const isOverdue = isTaskOverdue(task);
    const priorityColors = {
        high: 'border-red-400 bg-red-50',
        medium: 'border-yellow-400 bg-yellow-50',
        low: 'border-green-400 bg-green-50'
    };

    const categoryIcons = {
        personal: '👤',
        work: '💼',
        shopping: '🛒',
        health: '🏥',
        other: '📝'
    };

    const dueDateText = task.dueDate ? formatDate(task.dueDate, task.dueTime) : '';
    const overdueClass = isOverdue ? 'border-red-500 bg-red-100' : '';

    return `
        <div class="task-item border-l-4 ${priorityColors[task.priority]} ${overdueClass} rounded-lg p-4 hover:shadow-md transition-all duration-300 ${task.completed ? 'opacity-75' : ''}" 
             role="listitem" 
             data-task-id="${task.id}">
            <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 flex-1">
                    <button 
                        onclick="toggleTask('${task.id}')" 
                        class="mt-1 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-indigo-500 transition-colors duration-200 ${task.completed ? 'bg-green-500 border-green-500' : ''}"
                        aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
                    >
                        ${task.completed ? '<span class="text-white text-xs">✓</span>' : ''}
                    </button>
                    
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h4 class="font-medium text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}">${escapeHtml(task.name)}</h4>
                            <span class="text-lg">${categoryIcons[task.category]}</span>
                            <span class="px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(task.priority)}">${getPriorityText(task.priority)}</span>
                            ${isOverdue ? '<span class="px-2 py-1 text-xs bg-red-500 text-white rounded-full">🚨 Overdue</span>' : ''}
                        </div>
                        
                        <div class="flex items-center gap-4 text-sm text-gray-600">
                            <span class="flex items-center gap-1">
                                📂 <span class="capitalize">${task.category}</span>
                            </span>
                            ${dueDateText ? `<span class="flex items-center gap-1">📅 ${dueDateText}</span>` : ''}
                            <span class="flex items-center gap-1">
                                🕐 <span>Created ${formatRelativeTime(task.createdAt)}</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    <button 
                        onclick="editTask('${task.id}')" 
                        class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 tooltip"
                        data-tooltip="Edit task"
                        aria-label="Edit task"
                    >
                        ✏️
                    </button>
                    <button 
                        onclick="duplicateTask('${task.id}')" 
                        class="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200 tooltip"
                        data-tooltip="Duplicate task"
                        aria-label="Duplicate task"
                    >
                        📋
                    </button>
                    <button 
                        onclick="deleteTask('${task.id}')" 
                        class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200 tooltip"
                        data-tooltip="Delete task"
                        aria-label="Delete task"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Filter and Search Functions
function getFilteredTasks() {
    let filtered = tasks;

    // Apply search filter
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (searchTerm) {
        filtered = filtered.filter(task => 
            task.name.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply status filter
    switch (currentFilter) {
        case 'completed':
            filtered = filtered.filter(task => task.completed);
            break;
        case 'pending':
            filtered = filtered.filter(task => !task.completed);
            break;
        case 'overdue':
            filtered = filtered.filter(task => !task.completed && isTaskOverdue(task));
            break;
        default:
            // 'all' - no additional filtering
            break;
    }

    return filtered;
}

function getSortedTasks(tasksToSort) {
    const sorted = [...tasksToSort];

    switch (currentSort) {
        case 'oldest':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'dueDate':
            sorted.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                
                const dateA = new Date(a.dueDate + (a.dueTime ? ` ${a.dueTime}` : ''));
                const dateB = new Date(b.dueDate + (b.dueTime ? ` ${b.dueTime}` : ''));
                return dateA - dateB;
            });
            break;
        case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            break;
        case 'alphabetical':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default: // 'newest'
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }

    return sorted;
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Update button styles
    Object.keys(filterButtons).forEach(key => {
        if (filterButtons[key]) {
            if (key === filter) {
                filterButtons[key].className = 'filter-btn bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-300 font-medium button-bounce tooltip';
            } else {
                filterButtons[key].className = 'filter-btn bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium button-bounce tooltip';
            }
        }
    });

    updateDisplay();
}

function handleSearch() {
    updateDisplay();
}

function handleSort() {
    currentSort = sortSelect.value;
    updateDisplay();
}

// Statistics Functions
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.filter(task => !task.completed).length;
    const overdue = tasks.filter(task => !task.completed && isTaskOverdue(task)).length;

    if (totalTasksEl) totalTasksEl.textContent = total;
    if (completedTasksEl) completedTasksEl.textContent = completed;
    if (pendingTasksEl) pendingTasksEl.textContent = pending;
    if (overdueTasksEl) overdueTasksEl.textContent = overdue;

    // Update profile statistics if on profile page
    const profileTotal = document.getElementById('profileTotalTasks');
    const profileCompleted = document.getElementById('profileCompletedTasks');
    const profileRate = document.getElementById('profileCompletionRate');
    const profileDays = document.getElementById('profileDaysActive');

    if (profileTotal) profileTotal.textContent = total;
    if (profileCompleted) profileCompleted.textContent = completed;
    if (profileRate) {
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        profileRate.textContent = `${rate}%`;
    }
    if (profileDays) {
        // Calculate days since first task
        if (tasks.length > 0) {
            const firstTask = tasks.reduce((oldest, task) => 
                new Date(task.createdAt) < new Date(oldest.createdAt) ? task : oldest
            );
            const daysSince = Math.ceil((Date.now() - new Date(firstTask.createdAt)) / (1000 * 60 * 60 * 24));
            profileDays.textContent = daysSince;
        } else {
            profileDays.textContent = '0';
        }
    }
}

function updateTaskCount(count) {
    if (taskCountEl) {
        taskCountEl.textContent = `${count} task${count !== 1 ? 's' : ''}`;
    }
}

// Utility Functions
function isTaskOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    
    const now = new Date();
    const dueDateTime = new Date(task.dueDate + (task.dueTime ? ` ${task.dueTime}` : ' 23:59'));
    
    return now > dueDateTime;
}

function formatDate(dateStr, timeStr) {
    const date = new Date(dateStr);
    const dateOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    };
    
    let formatted = date.toLocaleDateString('en-US', dateOptions);
    
    if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes));
        formatted += ` at ${time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        })}`;
    }
    
    return formatted;
}

function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPriorityBadgeClass(priority) {
    const classes = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-green-100 text-green-700'
    };
    return classes[priority] || classes.medium;
}

function getPriorityText(priority) {
    const texts = {
        high: '🔴 High',
        medium: '🟡 Medium',
        low: '🟢 Low'
    };
    return texts[priority] || texts.medium;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Data Management Functions
function saveTasks() {
    try {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
        showNotification('Error saving tasks. Please try again.', 'error');
    }
}

function loadTasks() {
    try {
        const saved = localStorage.getItem('todoTasks');
        if (saved) {
            tasks = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
        showNotification('Error loading saved tasks.', 'error');
    }
}

function exportTasks() {
    try {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Tasks exported successfully! 📤', 'success');
    } catch (error) {
        console.error('Error exporting tasks:', error);
        showNotification('Error exporting tasks. Please try again.', 'error');
    }
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedTasks)) {
                throw new Error('Invalid file format');
            }

            // Validate task structure
            const validTasks = importedTasks.filter(task => 
                task && typeof task === 'object' && task.name && task.id
            );

            if (validTasks.length === 0) {
                throw new Error('No valid tasks found in file');
            }

            // Merge with existing tasks (avoid duplicates)
            const existingIds = new Set(tasks.map(task => task.id));
            const newTasks = validTasks.filter(task => !existingIds.has(task.id));

            tasks.push(...newTasks);
            saveTasks();
            updateDisplay();
            updateStatistics();
            
            showNotification(`Imported ${newTasks.length} tasks successfully! 📥`, 'success');
        } catch (error) {
            console.error('Error importing tasks:', error);
            showNotification('Error importing tasks. Please check the file format.', 'error');
        }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    // Set colors based on type
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        warning: 'bg-yellow-500 text-black'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Profile Page Functions
function setupProfilePage() {
    const profileForm = document.getElementById('profileForm');
    const avatarButtons = document.querySelectorAll('.avatar-btn');
    const clearProfileBtn = document.getElementById('clearProfile');

    // Load saved profile data
    loadProfile();

    // Avatar selection
    avatarButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const avatar = this.dataset.avatar;
            
            // Update selection
            avatarButtons.forEach(b => b.classList.remove('border-indigo-500', 'bg-indigo-50'));
            this.classList.add('border-indigo-500', 'bg-indigo-50');
            
            document.getElementById('selectedAvatar').value = avatar;
        });
    });

    // Profile form submission
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfile();
    });

    // Clear profile
    if (clearProfileBtn) {
        clearProfileBtn.addEventListener('click', clearProfile);
    }
}

function loadProfile() {
    try {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
            const profile = JSON.parse(saved);
            
            document.getElementById('userName').value = profile.name || '';
            document.getElementById('userEmail').value = profile.email || '';
            document.getElementById('userTheme').value = profile.theme || 'default';
            document.getElementById('showWelcome').checked = profile.showWelcome !== false;
            document.getElementById('soundNotifications').checked = profile.soundNotifications || false;
            document.getElementById('autoSave').checked = profile.autoSave !== false;
            
            // Set avatar
            const avatar = profile.avatar || '👤';
            document.getElementById('selectedAvatar').value = avatar;
            
            // Update avatar button selection
            document.querySelectorAll('.avatar-btn').forEach(btn => {
                btn.classList.remove('border-indigo-500', 'bg-indigo-50');
                if (btn.dataset.avatar === avatar) {
                    btn.classList.add('border-indigo-500', 'bg-indigo-50');
                }
            });

            // Update welcome message if enabled
            updateWelcomeMessage(profile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function saveProfile() {
    try {
        const profile = {
            name: document.getElementById('userName').value.trim(),
            email: document.getElementById('userEmail').value.trim(),
            avatar: document.getElementById('selectedAvatar').value,
            theme: document.getElementById('userTheme').value,
            showWelcome: document.getElementById('showWelcome').checked,
            soundNotifications: document.getElementById('soundNotifications').checked,
            autoSave: document.getElementById('autoSave').checked,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('userProfile', JSON.stringify(profile));
        updateWelcomeMessage(profile);
        showNotification('Profile saved successfully! 💾', 'success');
    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Error saving profile. Please try again.', 'error');
    }
}

function clearProfile() {
    if (confirm('Are you sure you want to clear your profile? This cannot be undone.')) {
        localStorage.removeItem('userProfile');
        document.getElementById('profileForm').reset();
        document.getElementById('selectedAvatar').value = '👤';
        
        // Reset avatar selection
        document.querySelectorAll('.avatar-btn').forEach(btn => {
            btn.classList.remove('border-indigo-500', 'bg-indigo-50');
        });
        document.querySelector('[data-avatar="👤"]').classList.add('border-indigo-500', 'bg-indigo-50');
        
        showNotification('Profile cleared successfully! 🗑️', 'success');
    }
}

function updateWelcomeMessage(profile) {
    const welcomeEl = document.getElementById('userWelcome');
    const messageEl = document.getElementById('welcomeMessage');
    
    if (welcomeEl && messageEl && profile.showWelcome && profile.name) {
        messageEl.textContent = `Welcome back, ${profile.name}!`;
        welcomeEl.classList.remove('hidden');
    } else if (welcomeEl) {
        welcomeEl.classList.add('hidden');
    }
}

// Contact Page Functions
function setupContactPage() {
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('contactSuccess');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simulate form submission
        const formData = new FormData(contactForm);
        const contactData = {
            name: formData.get('contactName'),
            email: formData.get('contactEmail'),
            subject: formData.get('contactSubject'),
            message: formData.get('contactMessage'),
            timestamp: new Date().toISOString()
        };

        // In a real app, you would send this to a server
        console.log('Contact form submitted:', contactData);

        // Show success message
        contactForm.style.display = 'none';
        successMessage.classList.remove('hidden');

        // Reset form after delay
        setTimeout(() => {
            contactForm.reset();
            contactForm.style.display = 'block';
            successMessage.classList.add('hidden');
        }, 5000);

        showNotification('Message sent successfully! 📧', 'success');
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to add task (when in task name field)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const taskNameInput = document.getElementById('taskName');
        if (document.activeElement === taskNameInput && taskNameInput.value.trim()) {
            taskForm.dispatchEvent(new Event('submit'));
        }
    }

    // Escape to close modal
    if (e.key === 'Escape' && editModal && !editModal.classList.contains('hidden')) {
        closeEditModal();
    }

    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
});

// Tooltip functionality
document.addEventListener('mouseover', function(e) {
    if (e.target.classList.contains('tooltip')) {
        const tooltip = e.target.dataset.tooltip;
        if (tooltip) {
            showTooltip(e.target, tooltip);
        }
    }
});

document.addEventListener('mouseout', function(e) {
    if (e.target.classList.contains('tooltip')) {
        hideTooltip();
    }
});

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-gray-800 text-white px-2 py-1 rounded text-sm z-50 pointer-events-none';
    tooltip.textContent = text;
    tooltip.id = 'tooltip';
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Auto-save functionality
let autoSaveTimeout;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (profile.autoSave !== false) {
            saveTasks();
        }
    }, 1000);
}

// Call scheduleAutoSave whenever tasks are modified
const originalPush = tasks.push;
tasks.push = function(...args) {
    const result = originalPush.apply(this, args);
    scheduleAutoSave();
    return result;
};
