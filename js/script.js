"use strict";
const addTaskBtn = document.getElementById("add-task-btn");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelBtn = document.getElementById("cancel-btn");
const taskTitleForm = document.getElementById("task-title");
const taskPriorityForm = document.getElementById("task-priority");
const taskDueDateForm = document.getElementById("task-due-date");
const taskDescriptionForm = document.getElementById("task-description");
const charCount = document.getElementById("char-count");
const submitBtn = document.getElementById("submit-btn");
const tasksTodo = document.getElementById("tasks-todo");
const tasksInProgress = document.getElementById("tasks-in-progress");
const tasksCompleted = document.getElementById("tasks-completed");
let intervalId = null;
let taskList = JSON.parse(localStorage.getItem("tasks")) ||
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
// Function to open modal
function openModal() {
    intiFormValues();
    charCount.textContent = "0/500";
    if (!modalOverlay)
        return;
    modalOverlay.classList.remove("hidden");
    modalOverlay.classList.add("flex");
}
// Function to close modal
function closeModal() {
    if (modalOverlay) {
        modalOverlay.classList.add("hidden");
        modalOverlay.classList.remove("flex");
    }
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
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
}
submitBtn?.addEventListener("click", addTask);
displayTasks(taskList);
function addTask() {
    let formValue = {
        id: `Task-${crypto.randomUUID()}`,
        title: taskTitleForm?.value,
        priority: taskPriorityForm?.value,
        dueDate: formatDate(taskDueDateForm?.value),
        description: taskDescriptionForm?.value,
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
function intiFormValues() {
    taskTitleForm.value = "";
    taskPriorityForm.value = "";
    taskDueDateForm.value = "";
    taskDescriptionForm.value = "";
}
function displayTasks(tasksArray) {
    if (tasksArray.length === 0) {
        tasksTodo.innerHTML = `<div
              class="flex flex-col items-center justify-center py-12 text-slate-400"
              >
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
            </div>`;
        return;
    }
    tasksTodo.innerHTML = tasksArray
        .map((task, index) => {
        let taskIndex = index + 1;
        if (taskIndex > 10) {
            taskIndex = `00${taskIndex}`;
        }
        else if (taskIndex <= 10 && taskIndex > 100) {
            taskIndex = `0${taskIndex}`;
        }
        return `<div class="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200  " data-task-id="${task.id}">
        <!-- Top Bar -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-slate-300"></span>
            <span class="text-2xs font-medium text-slate-400 uppercase tracking-wider">#00${taskIndex}</span>
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
        <h3 class="font-semibold text-slate-800 mb-2 leading-snug ">
          ${task.title}
        </h3>

        <!-- Description -->
        

        <!-- Tags Row -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <!-- Priority Badge -->
          <span class="bg-amber-50 text-amber-600 text-2xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            ${task.priority}
          </span>
        </div>

        <!-- Meta Info -->
          <div class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
          
            <div class="flex items-center gap-1.5 ">
              <i class="fa-regular fa-calendar"></i>
              <span>${task.dueDate}</span>
            </div>
          
          <div class="flex items-center gap-1.5" title="Created 8/21/2026, 11:02:03 PM">
            <i class="fa-regular fa-clock"></i>
            <span>${timeAgo(task.createdAt)}</span>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-2">
          
        <button class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-amber-100 text-amber-700 hover:bg-amber-200" data-task-id="task-1787341521235-5yjaz0e" data-status="in-progress">
          <i class="fa-solid fa-play pointer-events-none"></i> <span class="pointer-events-none">Start</span>
        </button>
      
        <button class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-emerald-100 text-emerald-700 hover:bg-emerald-200" data-task-id="task-1787341521235-5yjaz0e" data-status="completed">
          <i class="fa-solid fa-check pointer-events-none"></i> <span class="pointer-events-none">Complete</span>
        </button>
      
        </div>
      </div>`;
    })
        .join("");
    console.log("update");
}
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
function timeAgo(date) {
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
function manageInterval() {
    if (taskList.length > 0 && intervalId === null) {
        intervalId = window.setInterval(updateApp, 60000);
    }
    if (taskList.length === 0 && intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
manageInterval();
// main app update function
function updateApp() {
    displayTasks(taskList);
    // updateTaskTimes();
    // updateSomethingElse();
}
// update char count
taskDescriptionForm.addEventListener("input", () => {
    updateTextAreaLength();
});
// update text area length
function updateTextAreaLength() {
    charCount.textContent = `${taskDescriptionForm?.value.length}/500`;
}
