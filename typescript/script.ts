type OwnHtmlEl = HTMLElement | null;
type OwnHtmlInput = HTMLInputElement | null;

type Task = {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  description: string;
  createdAt: string;
  status: string;
};

const addTaskBtn: OwnHtmlEl = document.getElementById("add-task-btn");
const modalOverlay: OwnHtmlEl = document.getElementById("modal-overlay");
const closeModalBtn: OwnHtmlEl = document.getElementById("close-modal-btn");
const cancelBtn: OwnHtmlEl = document.getElementById("cancel-btn");
const taskTitleForm = document.getElementById("task-title") as OwnHtmlInput;
const taskPriorityForm = document.getElementById(
  "task-priority",
) as HTMLSelectElement | null;
const taskDueDateForm = document.getElementById(
  "task-due-date",
) as HTMLInputElement | null;
const taskDescriptionForm = document.getElementById(
  "task-description",
) as HTMLTextAreaElement | null;
const charCount = document.getElementById("char-count");

const todoTasksCount: OwnHtmlEl = document.getElementById("todo-tasks-count");
const inProgressTasksCount: OwnHtmlEl = document.getElementById(
  "in-progress-tasks-count",
);
const completedTasksCount: OwnHtmlEl = document.getElementById(
  "completed-tasks-count",
);

const submitBtn: OwnHtmlEl = document.getElementById("submit-btn");
const submitBtnText: OwnHtmlEl = document.getElementById("submit-btn-text");
const modalTitle: OwnHtmlEl = document.getElementById("modal-title");
const modalIcon: OwnHtmlEl = document.getElementById("modal-icon");

const tasksTodo: OwnHtmlEl = document.getElementById("tasks-todo");
const tasksInProgress: OwnHtmlEl = document.getElementById("tasks-in-progress");
const tasksCompleted: OwnHtmlEl = document.getElementById("tasks-completed");
const columnsContainer: OwnHtmlEl =
  document.getElementById("columns-container");

let intervalId: number | null = null;
let editingTaskId: string | null = null;

let taskList: Task[] =
  JSON.parse(localStorage.getItem("tasks")!) ||
  [
    // {
    //   id: "task-1787341521235-5yjaz0e",
    //   title: "aaa",
    //   description: "",
    //   priority: "medium",
    //   dueDate: "",
    //   createdAt: "2026-08-21T19:45:21.235Z",
    //   status: "todo",
    // },
  ];

function hideErrors(): void {
  document.getElementById("title-error")?.classList.add("hidden");
  document.getElementById("date-error")?.classList.add("hidden");
  document.getElementById("description-error")?.classList.add("hidden");
}

// Function to open modal
function openModal(): void {
  intiFormValues();
  charCount!.textContent = "0/500";
  hideErrors();

  if (!modalOverlay) return;
  modalOverlay.classList.remove("hidden");
  modalOverlay.classList.add("flex");
}

// Function to open modal in edit mode
function openEditModal(task: Task): void {
  editingTaskId = task.id;
  hideErrors();

  // Populate form
  if (taskTitleForm) taskTitleForm.value = task.title;
  if (taskPriorityForm) taskPriorityForm.value = task.priority;

  if (taskDueDateForm) {
    const parsedDate = new Date(task.dueDate);
    if (!isNaN(parsedDate.getTime())) {
      taskDueDateForm.value = parsedDate.toISOString().split("T")[0];
    } else {
      taskDueDateForm.value = "";
    }
  }

  if (taskDescriptionForm) {
    taskDescriptionForm.value = task.description;
    if (charCount) {
      charCount.textContent = `${task.description.length}/500`;
    }
  }

  // Update Modal UI for Edit mode
  if (modalTitle) modalTitle.textContent = "Edit Task";
  if (modalIcon) {
    modalIcon.className = "fa-solid fa-pen-to-square text-indigo-500";
  }
  if (submitBtnText) submitBtnText.textContent = "Save Changes";
  const submitIcon = submitBtn?.querySelector("i");
  if (submitIcon) {
    submitIcon.className = "fa-solid fa-save";
  }

  if (!modalOverlay) return;
  modalOverlay.classList.remove("hidden");
  modalOverlay.classList.add("flex");
}

// Function to close modal
function closeModal(): void {
  if (modalOverlay) {
    modalOverlay.classList.add("hidden");
    modalOverlay.classList.remove("flex");
  }

  // Reset Edit state
  editingTaskId = null;
  if (modalTitle) modalTitle.textContent = "Create New Task";
  if (modalIcon) {
    modalIcon.className = "fa-solid fa-plus-circle text-indigo-500";
  }
  if (submitBtnText) submitBtnText.textContent = "Add Task";
  const submitIcon = submitBtn?.querySelector("i");
  if (submitIcon) {
    submitIcon.className = "fa-solid fa-plus";
  }

  intiFormValues();
  hideErrors();
}
// Event listeners
if (addTaskBtn) {
  addTaskBtn.addEventListener("click", openModal);
}
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}
if (cancelBtn) {
  cancelBtn.addEventListener("click", closeModal);
}
// Close modal when clicking outside the modal content (on the overlay)
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

submitBtn?.addEventListener("click", () => {
  if (editingTaskId) {
    saveTask(editingTaskId);
  } else {
    addTask();
  }
});

// Event delegation for Edit, Delete, and Status Change buttons inside columns-container
columnsContainer?.addEventListener("click", (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  // 1. Delete button click
  const deleteBtn = target.closest(".delete-btn");
  if (deleteBtn) {
    const taskId = deleteBtn.getAttribute("data-task-id");
    if (taskId) {
      deleteTask(taskId);
    }
    return;
  }

  // 2. Edit button click
  const editBtn = target.closest(".edit-btn");
  if (editBtn) {
    const taskId = editBtn.getAttribute("data-task-id");
    if (taskId) {
      const task = taskList.find((t) => t.id === taskId);
      if (task) {
        openEditModal(task);
      }
    }
    return;
  }

  // 3. Status button click
  const statusBtn = target.closest(".status-btn");
  if (statusBtn) {
    const taskId = statusBtn.getAttribute("data-task-id");
    const newStatus = statusBtn.getAttribute("data-status");
    if (taskId && newStatus) {
      changeTaskStatus(taskId, newStatus);
    }
    return;
  }
});

displayTasks(taskList);

function addTask(): void {
  // Validate title is not empty
  if (!taskTitleForm?.value.trim()) {
    const titleError = document.getElementById("title-error");
    if (titleError) {
      titleError.textContent = "Task title is required";
      titleError.classList.remove("hidden");
    }
    return;
  } else {
    const titleError = document.getElementById("title-error");
    if (titleError) {
      titleError.classList.add("hidden");
    }
  }

  let formValue: Task = {
    id: `Task-${crypto.randomUUID()}`,
    title: taskTitleForm?.value!,
    priority: taskPriorityForm?.value!,
    dueDate: formatDate(taskDueDateForm?.value!),
    description: taskDescriptionForm?.value!,
    createdAt: new Date(Date.now()).toISOString(),
    status: "todo",
  };

  if (formValue.dueDate == "Invalid Date") {
    formValue.dueDate = formatDate(new Date().toISOString());
  }

  taskList.push(formValue);

  localStorage.setItem("tasks", JSON.stringify(taskList));

  closeModal();
  intiFormValues();

  displayTasks(taskList);
  manageInterval();
}

function saveTask(taskId: string): void {
  // Validate title is not empty
  if (!taskTitleForm?.value.trim()) {
    const titleError = document.getElementById("title-error");
    if (titleError) {
      titleError.textContent = "Task title is required";
      titleError.classList.remove("hidden");
    }
    return;
  } else {
    const titleError = document.getElementById("title-error");
    if (titleError) {
      titleError.classList.add("hidden");
    }
  }

  const task = taskList.find((t) => t.id === taskId);
  if (!task) return;

  task.title = taskTitleForm?.value!;
  task.priority = taskPriorityForm?.value || "medium";
  task.description = taskDescriptionForm?.value || "";

  if (taskDueDateForm?.value) {
    let formattedDate = formatDate(taskDueDateForm.value);
    if (formattedDate !== "Invalid Date") {
      task.dueDate = formattedDate;
    }
  }

  localStorage.setItem("tasks", JSON.stringify(taskList));

  closeModal();
  intiFormValues();

  displayTasks(taskList);
}

function deleteTask(taskId: string): void {
  taskList = taskList.filter((task) => task.id !== taskId);
  localStorage.setItem("tasks", JSON.stringify(taskList));
  displayTasks(taskList);
  manageInterval();
}

function changeTaskStatus(taskId: string, newStatus: string): void {
  const task = taskList.find((t) => t.id === taskId);
  if (task) {
    task.status = newStatus;
    localStorage.setItem("tasks", JSON.stringify(taskList));
    displayTasks(taskList);
  }
}

function intiFormValues() {
  taskTitleForm!.value = "";
  taskPriorityForm!.value = "medium";
  taskDueDateForm!.value = "";
  taskDescriptionForm!.value = "";
}

function displayEmptyMessage(listContainer: OwnHtmlEl) {
  if (!listContainer) return;
  listContainer.innerHTML = `<div
              class="flex flex-col items-center justify-center py-12 text-slate-400"
              >
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
            </div>`;
}

function renderTaskCard(task: Task, index: number): string {
  const taskIndex = String(index + 1).padStart(3, "0");

  let statusDotColor = "";
  if (task.status === "todo") {
    statusDotColor = "bg-slate-300";
  } else if (task.status === "in-progress") {
    statusDotColor = "bg-amber-500";
  } else if (task.status === "completed") {
    statusDotColor = "bg-emerald-500";
  }

  let priorityBadgeColor = "";
  let priorityDotColor = "";
  if (task.priority === "high") {
    priorityBadgeColor = "bg-rose-50 text-rose-600 border border-rose-100";
    priorityDotColor = "bg-rose-500";
  } else if (task.priority === "medium") {
    priorityBadgeColor = "bg-amber-50 text-amber-600 border border-amber-100";
    priorityDotColor = "bg-amber-500";
  } else {
    priorityBadgeColor = "bg-blue-50 text-blue-600 border border-blue-100";
    priorityDotColor = "bg-blue-500";
  }

  let actionButtonsHtml = "";
  if (task.status === "todo") {
    actionButtonsHtml = `
      <button class="status-btn text-[11px] px-3 py-2 rounded-[7px] font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-amber-100 text-amber-700 hover:bg-amber-200" data-task-id="${task.id}" data-status="in-progress">
        <i class="fa-solid fa-play pointer-events-none"></i> <span class="pointer-events-none">Start</span>
      </button>
      <button class="status-btn text-[11px] px-3 py-2 rounded-[7px] font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-emerald-100 text-emerald-700 hover:bg-emerald-200" data-task-id="${task.id}" data-status="completed">
        <i class="fa-solid fa-check pointer-events-none"></i> <span class="pointer-events-none">Complete</span>
      </button>
    `;
  } else if (task.status === "in-progress") {
    actionButtonsHtml = `
      <button class="status-btn text-[11px] px-3 py-2 rounded-[7px] font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200" data-task-id="${task.id}" data-status="todo">
        <i class="fa-solid fa-undo pointer-events-none"></i> <span class="pointer-events-none">To Do</span>
      </button>
      <button class="status-btn text-[11px] px-3 py-2 rounded-[7px] font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-emerald-100 text-emerald-700 hover:bg-emerald-200" data-task-id="${task.id}" data-status="completed">
        <i class="fa-solid fa-check pointer-events-none"></i> <span class="pointer-events-none">Complete</span>
      </button>
    `;
  } else if (task.status === "completed") {
    actionButtonsHtml = `

      <button class="status-btn text-[11px] px-3 py-2 rounded-[7px] font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200" data-task-id="${task.id}" data-status="todo">
        <i class="fa-solid fa-undo pointer-events-none"></i> <span class="pointer-events-none">To Do</span>
      </button>

      <button class="status-btn text-[11px] px-3 py-2 rounded-[7px] font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-amber-100 text-amber-700 hover:bg-amber-200" data-task-id="${task.id}" data-status="in-progress">
        <i class="fa-solid fa-play pointer-events-none"></i> <span class="pointer-events-none">Start</span>
      </button>
    `;
  }

  const descriptionHtml = task.description.trim()
    ? `<p class="text-xs text-slate-500 mb-3 line-clamp-2">${task.description}</p>`
    : "";

  return `<div class="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200" data-task-id="${task.id}">
        <!-- Top Bar -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${statusDotColor}"></span>
            <span class="text-2xs font-medium text-slate-400 uppercase tracking-wider">#${taskIndex}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Edit task">
              <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
              </button>
            <button class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Delete task">
              <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
            </button>
          </div>
        </div>

        <!-- Title -->
        <h3 class="${task.status === "completed" ? "line-through  " : ""}font-semibold  mb-2 leading-snug wrap-break-word">
          ${task.title}
        </h3>

        <!-- Description -->
        ${descriptionHtml}

        <!-- Tags Row -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <!-- Priority Badge -->
          <span class="${priorityBadgeColor} text-2xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-1.5 h-1.5 rounded-full ${priorityDotColor}"></span>
            ${task.priority}
          </span>
        </div>

        <!-- Meta Info -->
        <div class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
          <div class="flex items-center gap-1.5">
            <i class="fa-regular fa-calendar"></i>
            <span>${task.dueDate}</span>
          </div>
          <div class="flex items-center gap-1.5" title="Created ${new Date(task.createdAt).toLocaleString()}">
            <i class="fa-regular fa-clock"></i>
            <span>${timeAgo(task.createdAt)}</span>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-2">
          ${actionButtonsHtml}
        </div>
      </div>`;
}

function displayTasks(tasksArray: Task[]) {
  // 1. Todo tasks
  const todoTasks = tasksArray.filter((task) => task.status === "todo");
  if (todoTasksCount) todoTasksCount.textContent = `${todoTasks.length} tasks`;
  if (todoTasks.length === 0) {
    displayEmptyMessage(tasksTodo);
  } else {
    tasksTodo!.innerHTML = todoTasks
      .map((task, index) => renderTaskCard(task, index))
      .join("");
  }

  // 2. In progress tasks
  const inProgressTasks = tasksArray.filter(
    (task) => task.status === "in-progress",
  );
  if (inProgressTasksCount)
    inProgressTasksCount.textContent = `${inProgressTasks.length} tasks`;
  if (inProgressTasks.length === 0) {
    displayEmptyMessage(tasksInProgress);
  } else {
    tasksInProgress!.innerHTML = inProgressTasks
      .map((task, index) => renderTaskCard(task, index))
      .join("");
  }

  // 3. Completed tasks
  const completedTasks = tasksArray.filter(
    (task) => task.status === "completed",
  );
  if (completedTasksCount)
    completedTasksCount.textContent = `${completedTasks.length} tasks`;
  if (completedTasks.length === 0) {
    displayEmptyMessage(tasksCompleted);
  } else {
    tasksCompleted!.innerHTML = completedTasks
      .map((task, index) => renderTaskCard(task, index))
      .join("");
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(date: string | number | Date): string {
  const now = Date.now();
  const past = new Date(date).getTime();

  const diff = now - past;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 30) {
    return `${days}d ago`;
  }

  if (days < 365) {
    return `${months}mo ago`;
  }

  return `${years}y ago`;
}

function manageInterval(): void {
  if (taskList.length > 0 && intervalId === null) {
    intervalId = window.setInterval(updateApp, 60_000);
  }

  if (taskList.length === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

manageInterval();

// main app update function
function updateApp(): void {
  displayTasks(taskList);
}

// update char count
taskDescriptionForm?.addEventListener("input", () => {
  updateTextAreaLength();
});

// update text area length
function updateTextAreaLength() {
  charCount!.textContent = `${taskDescriptionForm?.value.length}/500`;
}
