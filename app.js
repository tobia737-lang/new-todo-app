// ============================================================
// TASKFLOW — app.js
// ============================================================

'use strict';

// ---------- State ----------
let tasks = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
let currentFilter = 'all';
let selectedPriority = 'low';

// ---------- DOM refs ----------
const input          = document.getElementById('todo-input');
const addBtn         = document.getElementById('add-btn');
const taskList       = document.getElementById('task-list');
const emptyState     = document.getElementById('empty-state');
const appFooter      = document.getElementById('app-footer');
const statsText      = document.getElementById('stats-text');
const completedCount = document.getElementById('completed-count');
const progressBar    = document.getElementById('progress-bar');
const clearBtn       = document.getElementById('clear-completed-btn');

const filterBtns   = document.querySelectorAll('.filter-btn');
const priorityBtns = document.querySelectorAll('.priority-btn');

// ---------- Helpers ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function save() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// ---------- Render ----------
function render() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'active')    return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true;
  });

  taskList.innerHTML = '';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' completed' : ''}`;
    li.dataset.priority = task.priority;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input
        type="checkbox"
        class="task-checkbox"
        id="chk-${task.id}"
        aria-label="Mark task as ${task.done ? 'incomplete' : 'complete'}"
        ${task.done ? 'checked' : ''}
      />
      <label class="task-text" for="chk-${task.id}">${escapeHTML(task.text)}</label>
      <span class="task-badge ${task.priority}">${task.priority}</span>
      <button class="delete-btn" aria-label="Delete task" title="Delete">✕</button>
    `;

    // Checkbox toggle
    li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));

    // Delete
    li.querySelector('.delete-btn').addEventListener('click', () => removeTask(task.id, li));

    taskList.appendChild(li);
  });

  updateMeta();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateMeta() {
  const total     = tasks.length;
  const done      = tasks.filter(t => t.done).length;
  const remaining = total - done;

  // Stats
  statsText.textContent = remaining === 1
    ? '1 task remaining'
    : `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;

  // Completed count
  completedCount.textContent = done === 1 ? '1 completed' : `${done} completed`;

  // Progress bar
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  progressBar.style.width = `${pct}%`;

  // Empty state
  const filtered = tasks.filter(t => {
    if (currentFilter === 'active')    return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true;
  });

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
    emptyState.setAttribute('aria-hidden', 'false');

    // Contextual empty messages
    if (currentFilter === 'completed' && done === 0) {
      emptyState.querySelector('.empty-icon').textContent  = '🏆';
      emptyState.querySelector('.empty-title').textContent = 'No completed tasks yet';
      emptyState.querySelector('.empty-sub').textContent   = 'Check off tasks to see them here.';
    } else if (currentFilter === 'active' && remaining === 0 && total > 0) {
      emptyState.querySelector('.empty-icon').textContent  = '🎉';
      emptyState.querySelector('.empty-title').textContent = 'All done!';
      emptyState.querySelector('.empty-sub').textContent   = 'You crushed every task!';
    } else {
      emptyState.querySelector('.empty-icon').textContent  = '🎯';
      emptyState.querySelector('.empty-title').textContent = 'All clear!';
      emptyState.querySelector('.empty-sub').textContent   = 'Add a task above to get started.';
    }
  } else {
    emptyState.classList.remove('visible');
    emptyState.setAttribute('aria-hidden', 'true');
  }

  // Footer visibility
  if (total > 0) {
    appFooter.classList.add('visible');
  } else {
    appFooter.classList.remove('visible');
  }
}

// ---------- Actions ----------
function addTask() {
  const text = input.value.trim();
  if (!text) {
    // Shake animation
    input.style.animation = 'none';
    input.offsetHeight; // reflow
    input.style.animation = 'shake 0.4s ease';
    return;
  }

  const task = { id: uid(), text, priority: selectedPriority, done: false };
  tasks.unshift(task);
  save();
  render();

  input.value = '';
  input.focus();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    save();
    render();
  }
}

function removeTask(id, liEl) {
  liEl.classList.add('removing');
  liEl.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }, { once: true });
}

function clearCompleted() {
  const completed = taskList.querySelectorAll('.task-item.completed');
  if (completed.length === 0) return;

  completed.forEach(li => {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== li.dataset.id);
      save();
      render();
    }, { once: true });
  });
}

// ---------- Event listeners ----------
addBtn.addEventListener('click', addTask);

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

priorityBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    priorityBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPriority = btn.dataset.priority;
  });
});

clearBtn.addEventListener('click', clearCompleted);

// ---------- Shake keyframe (injected) ----------
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
`;
document.head.appendChild(styleEl);

// ---------- Init ----------
render();
