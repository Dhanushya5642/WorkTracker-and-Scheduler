// Check authentication
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.href = 'login.html';
}

// Display username
document.getElementById('userDisplay').textContent = `${currentUser}`;

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// User-specific tasks
let tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`)) || [];

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.body.classList.toggle('dark', currentTheme === 'dark');
themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
});

// Categories & Dynamic form logic
const taskCategorySelect = document.getElementById('taskCategory');
const dynamicFieldsContainer = document.getElementById('dynamicFieldsContainer');

const dynamicTemplates = {
    general: '',
    college: `
        <input type="text" id="collegeCourse" placeholder="Course Name (e.g. CS101)" style="flex:1;">
        <select id="collegeAssignmentType" style="flex:1;">
            <option value="assignment">Assignment / HW</option>
            <option value="project">Project</option>
            <option value="exam">Exam Prep</option>
        </select>
    `,
    investment: `
        <input type="number" id="investmentAmount" placeholder="Amount (e.g. 500)" step="0.01" style="flex:1;">
        <input type="text" id="investmentPlatform" placeholder="Platform (e.g. Mutual Fund)" style="flex:1;">
        <select id="investmentRecurrence" style="flex:1;">
            <option value="none">One-time / Mature</option>
            <option value="monthly">Monthly (SIP)</option>
            <option value="yearly">Yearly</option>
        </select>
    `,
    birthday: `
        <input type="text" id="birthdayPerson" placeholder="Relative / Friend Name" style="flex:1;">
        <select id="birthdayAction" style="flex:1;">
            <option value="wish">Send a Wish</option>
            <option value="gift">Send a Gift</option>
            <option value="party">Host/Attend Party</option>
        </select>
    `
};

taskCategorySelect.addEventListener('change', (e) => {
    const cat = e.target.value;
    if (dynamicTemplates[cat]) {
        dynamicFieldsContainer.innerHTML = dynamicTemplates[cat];
        dynamicFieldsContainer.style.display = cat === 'general' ? 'none' : 'flex';
    } else {
        dynamicFieldsContainer.style.display = 'none';
        dynamicFieldsContainer.innerHTML = '';
    }
});

// Add task
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const cat = document.getElementById('taskCategory').value;
    
    // Gather category-specific metadata
    let metadata = {};
    if (cat === 'college') {
        metadata.course = document.getElementById('collegeCourse') ? document.getElementById('collegeCourse').value : '';
        metadata.assignmentType = document.getElementById('collegeAssignmentType') ? document.getElementById('collegeAssignmentType').value : '';
    } else if (cat === 'investment') {
        metadata.amount = document.getElementById('investmentAmount') ? document.getElementById('investmentAmount').value : '';
        metadata.platform = document.getElementById('investmentPlatform') ? document.getElementById('investmentPlatform').value : '';
        metadata.recurrence = document.getElementById('investmentRecurrence') ? document.getElementById('investmentRecurrence').value : '';
    } else if (cat === 'birthday') {
        metadata.person = document.getElementById('birthdayPerson') ? document.getElementById('birthdayPerson').value : '';
        metadata.action = document.getElementById('birthdayAction') ? document.getElementById('birthdayAction').value : '';
    }

    const task = {
        id: Date.now(),
        category: cat,
        metadata: metadata,
        title: document.getElementById('taskTitle').value,
        project: document.getElementById('taskProject').value,
        description: document.getElementById('taskDesc').value,
        deadline: document.getElementById('taskDeadline').value,
        priority: document.getElementById('taskPriority').value,
        status: 'todo',
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    saveTasks();
    e.target.reset();
    
    // Reset dynamic fields
    dynamicFieldsContainer.style.display = 'none';
    dynamicFieldsContainer.innerHTML = '';
    
    renderTasks();
});

// Save tasks
function saveTasks() {
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
    syncTasksWithServer();
}

// Sync tasks with email server
function syncTasksWithServer() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === currentUser);
    
    if (user && user.email) {
        fetch('http://localhost:3000/api/sync-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser,
                email: user.email,
                tasks: tasks
            })
        }).catch(err => console.log('Server sync failed:', err));
    }
}

// Render tasks
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterCategory = document.getElementById('filterCategory') ? document.getElementById('filterCategory').value : 'all';
    const filterStatus = document.getElementById('filterStatus').value;
    const filterPriority = document.getElementById('filterPriority').value;

    let filtered = tasks.filter(task => {
        const matchSearch = task.title.toLowerCase().includes(searchTerm) || 
                          task.project.toLowerCase().includes(searchTerm);
        const taskCat = task.category || 'general';
        const matchCategory = filterCategory === 'all' || taskCat === filterCategory;
        const matchStatus = filterStatus === 'all' || task.status === filterStatus;
        const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
        return matchSearch && matchCategory && matchStatus && matchPriority;
    });

    const motivationalQuotes = [
        "Eat that frog! Tackle your hardest task first.",
        "The best time to start was yesterday. The next best time is now.",
        "Don't wait for the perfect moment. Take the moment and make it perfect.",
        "Action is the foundational key to all success.",
        "The secret of getting ahead is getting started.",
        "Do it now. Sometimes 'later' becomes 'never'.",
        "Your future self will thank you for finishing this today."
    ];

    container.innerHTML = filtered.map(task => {
        const deadline = new Date(task.deadline);
        const now = new Date();
        const hoursUntil = (deadline - now) / (1000 * 60 * 60);
        const isUrgent = hoursUntil < 24 && hoursUntil > 0;
        const isOverdue = hoursUntil < 0 && task.status !== 'completed';
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        
        const taskCat = task.category || 'general';
        let metadataHtml = '';
        if (taskCat === 'college' && task.metadata) {
            metadataHtml = `<div class="task-desc" style="font-size: 0.85rem;"><strong>Course:</strong> ${task.metadata.course} | <strong>Type:</strong> ${task.metadata.assignmentType}</div>`;
        } else if (taskCat === 'investment' && task.metadata) {
            metadataHtml = `<div class="task-desc" style="font-size: 0.85rem;"><strong>Platform:</strong> ${task.metadata.platform} | <strong>Amount:</strong> ₹${task.metadata.amount} | <strong>Recurrence:</strong> ${task.metadata.recurrence}</div>`;
        } else if (taskCat === 'birthday' && task.metadata) {
            metadataHtml = `<div class="task-desc" style="font-size: 0.85rem;"><strong>Relative:</strong> ${task.metadata.person} | <strong>Action:</strong> ${task.metadata.action}</div>`;
        }

        const titleIcon = taskCat === 'investment' ? '💰 ' : taskCat === 'birthday' ? '🎂 ' : taskCat === 'college' ? '📚 ' : '';

        return `
            <div class="task-card ${task.priority} ${task.status} ${isOverdue ? 'overdue' : ''}">
                <div class="task-header">
                    <div class="task-title">${titleIcon}${task.title}</div>
                </div>
                <div class="task-badges">
                    <span class="badge ${taskCat}">${taskCat.toUpperCase()}</span>
                    ${task.project ? `<span class="badge project">${task.project}</span>` : ''}
                    <span class="badge priority">${task.priority.toUpperCase()}</span>
                    <span class="badge status">${task.status.replace('inprogress', 'In Progress').toUpperCase()}</span>
                </div>
                ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                ${metadataHtml}
                <div class="task-deadline ${isUrgent ? 'urgent' : ''}">
                    ${deadline.toLocaleString()} ${isUrgent ? 'DUE SOON!' : ''}
                </div>
                ${isOverdue ? `<div class="overdue-warning">
                    DEADLINE PASSED! ${randomQuote}
                </div>` : ''}
                <div class="task-actions">
                    <button class="btn-status" onclick="cycleStatus(${task.id})">
                        ${task.status === 'todo' ? 'Start' : task.status === 'inprogress' ? 'Complete' : 'Reopen'}
                    </button>
                    <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    updateStats();
}

// Cycle task status
function cycleStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task.status === 'todo') {
        task.status = 'inprogress';
    } else if (task.status === 'inprogress') {
        task.status = 'completed';
        handleRecurrence(task);
    } else {
        task.status = 'todo';
    }
    saveTasks();
    renderTasks();
}

function handleRecurrence(task) {
    let shouldRecur = false;
    let nextDate = new Date(task.deadline);
    
    if (task.category === 'birthday') {
        shouldRecur = true;
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else if (task.category === 'investment' && task.metadata) {
        if (task.metadata.recurrence === 'monthly') {
            shouldRecur = true;
            nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (task.metadata.recurrence === 'yearly') {
            shouldRecur = true;
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
    }

    if (shouldRecur) {
        // preserve local timezone format for auto generated task
        const tzOffset = nextDate.getTimezoneOffset() * 60000;
        const localISO = new Date(nextDate.getTime() - tzOffset).toISOString().slice(0, 16);
        
        const newTask = {
            ...task,
            id: Date.now() + Math.floor(Math.random() * 1000),
            status: 'todo',
            deadline: localISO,
            createdAt: new Date().toISOString()
        };
        
        setTimeout(() => {
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            if (Notification.permission === 'granted') {
                new Notification('Task Recurred', {
                    body: `"${task.title}" has been automatically rescheduled for ${new Date(localISO).toLocaleString()}!`
                });
            }
        }, 100);
    }
}

// Delete task
function deleteTask(id) {
    if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }
}

// Update stats
function updateStats() {
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('pendingTasks').textContent = tasks.filter(t => t.status !== 'completed').length;
    document.getElementById('completedTasks').textContent = tasks.filter(t => t.status === 'completed').length;
    
    const now = new Date();
    const dueSoon = tasks.filter(t => {
        const deadline = new Date(t.deadline);
        const hours = (deadline - now) / (1000 * 60 * 60);
        return hours < 24 && hours > 0 && t.status !== 'completed';
    }).length;
    document.getElementById('upcomingDeadlines').textContent = dueSoon;
}

// Check deadlines and send notifications
function checkDeadlines() {
    const now = new Date();
    tasks.forEach(task => {
        if (task.status === 'completed') return;
        
        const deadline = new Date(task.deadline);
        const hoursUntil = (deadline - now) / (1000 * 60 * 60);
        
        if ((hoursUntil < 24 && hoursUntil > 23.5) || (hoursUntil < 1 && hoursUntil > 0.5)) {
            if (Notification.permission === 'granted') {
                new Notification('Deadline Reminder', {
                    body: `"${task.title}" is due ${hoursUntil < 1 ? 'in 1 hour' : 'in 24 hours'}!`
                });
            }
        }
    });
}

// Search and filter
document.getElementById('searchInput').addEventListener('input', renderTasks);
document.getElementById('filterStatus').addEventListener('change', renderTasks);
document.getElementById('filterPriority').addEventListener('change', renderTasks);

// Check deadlines every 30 minutes
setInterval(checkDeadlines, 30 * 60 * 1000);

// Initial render
renderTasks();
checkDeadlines();
