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

// Load tasks and schedules
let tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`)) || [];
let schedules = JSON.parse(localStorage.getItem(`schedules_${currentUser}`)) || [];

// Auto-generate schedule if tasks exist and no schedule for current tasks
function autoGenerateSchedule() {
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    if (incompleteTasks.length === 0) return;
    
    const schedule = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        tasks: incompleteTasks.map(t => ({
            ...t,
            quadrant: categorizeTask(t)
        }))
    };
    
    schedules.push(schedule);
    localStorage.setItem(`schedules_${currentUser}`, JSON.stringify(schedules));
}

function categorizeTask(task) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const hoursUntil = (deadline - now) / (1000 * 60 * 60);
    const isUrgent = hoursUntil < 48;
    const isImportant = task.priority === 'high' || task.priority === 'medium';
    
    if (isUrgent && isImportant) return 1;
    if (!isUrgent && isImportant) return 2;
    if (isUrgent && !isImportant) return 3;
    return 4;
}

function renderScheduleList() {
    const container = document.getElementById('scheduleList');
    document.getElementById('matrixView').style.display = 'none';
    container.style.display = 'grid';
    
    if (schedules.length === 0) {
        container.innerHTML = '<p class="no-schedules">No schedules available. Schedules are automatically generated when you have tasks.</p>';
        return;
    }
    
    container.innerHTML = schedules.map((schedule, index) => `
        <div class="schedule-card">
            <div onclick="viewSchedule(${schedule.id})" style="cursor: pointer;">
                <h4>Schedule #${schedules.length - index}</h4>
                <p>Created: ${new Date(schedule.createdAt).toLocaleString()}</p>
                <p>Tasks: ${schedule.tasks.length}</p>
            </div>
            <button class="btn-delete-schedule" onclick="deleteSchedule(${schedule.id})">Delete</button>
        </div>
    `).join('');
}

function deleteSchedule(scheduleId) {
    if (confirm('Delete this schedule?')) {
        schedules = schedules.filter(s => s.id !== scheduleId);
        localStorage.setItem(`schedules_${currentUser}`, JSON.stringify(schedules));
        renderScheduleList();
    }
}

function viewSchedule(scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    document.getElementById('scheduleList').style.display = 'none';
    document.getElementById('matrixView').style.display = 'block';
    
    const q1 = schedule.tasks.filter(t => t.quadrant === 1);
    const q2 = schedule.tasks.filter(t => t.quadrant === 2);
    const q3 = schedule.tasks.filter(t => t.quadrant === 3);
    const q4 = schedule.tasks.filter(t => t.quadrant === 4);
    
    document.getElementById('q1').innerHTML = q1.map(t => `<div class="matrix-task" onclick="viewTaskDetail(${t.id})">${t.title}</div>`).join('') || '<p class="empty-quadrant">No tasks</p>';
    document.getElementById('q2').innerHTML = q2.map(t => `<div class="matrix-task" onclick="viewTaskDetail(${t.id})">${t.title}</div>`).join('') || '<p class="empty-quadrant">No tasks</p>';
    document.getElementById('q3').innerHTML = q3.map(t => `<div class="matrix-task" onclick="viewTaskDetail(${t.id})">${t.title}</div>`).join('') || '<p class="empty-quadrant">No tasks</p>';
    document.getElementById('q4').innerHTML = q4.map(t => `<div class="matrix-task" onclick="viewTaskDetail(${t.id})">${t.title}</div>`).join('') || '<p class="empty-quadrant">No tasks</p>';
}

function backToScheduleList() {
    document.getElementById('scheduleList').style.display = 'grid';
    document.getElementById('matrixView').style.display = 'none';
}

function viewTaskDetail(taskId) {
    const schedule = schedules.find(s => s.tasks.some(t => t.id === taskId));
    if (!schedule) return;
    
    const task = schedule.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const deadline = new Date(task.deadline);
    const statusText = task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Completed';
    
    alert(`Task Details:\n\nTitle: ${task.title}\nProject: ${task.project || 'N/A'}\nDescription: ${task.description || 'N/A'}\nDeadline: ${deadline.toLocaleString()}\nPriority: ${task.priority.toUpperCase()}\nStatus: ${statusText}`);
}

// Initialize
autoGenerateSchedule();
renderScheduleList();
