// javascript
/**
 * script.js
 * Main functionality for the To-Do Application.
 *
 * This script manages project and task creation, deletion, and completion states,
 * persisting data to localStorage. It aims for a modern, responsive, and user-friendly
 * experience with smooth animations and robust error handling.
 */

// --- DOM Element Caching ---
const projectListElement = document.getElementById('project-list');
const newProjectForm = document.getElementById('new-project-form');
const newProjectInput = document.getElementById('new-project-input');
const currentProjectTitle = document.getElementById('current-project-title');
const projectActions = document.getElementById('project-actions');
const deleteProjectBtn = document.getElementById('delete-project-btn');
const taskListElement = document.getElementById('task-list');
const newTaskForm = document.getElementById('new-task-form');
const newTaskInput = document.getElementById('new-task-input');

// --- Constants & Local Storage Keys ---
const LOCAL_STORAGE_PROJECTS_KEY = 'todoApp.projects';
const LOCAL_STORAGE_SELECTED_PROJECT_ID_KEY = 'todoApp.selectedProjectId';

// --- Global State ---
let projects = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY)) || [];
let selectedProjectId = localStorage.getItem(LOCAL_STORAGE_SELECTED_PROJECT_ID_KEY);

// --- Helper Functions ---

// /**
//  * Generates a unique ID using a combination of timestamp and random number.
//  * @returns {string} A unique ID string.
//  */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// /**
//  * Saves the current projects array and selected project ID to localStorage.
//  * This function should be called after any state change.
//  * @returns {void}
//  */
function saveState() {
    try {
        localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
        localStorage.setItem(LOCAL_STORAGE_SELECTED_PROJECT_ID_KEY, selectedProjectId);
    } catch (error) {
        console.error('Error saving state to localStorage:', error);
        showAlert('Failed to save data. Please check your browser settings.', 'error');
    }
}

// /**
// //  * Clears all child elements from a given parent element.
// //  * @param {HTMLElement} element The parent element to clear.
// //  * @returns {void}
// //  */
function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// /**
//  * Displays a temporary alert message to the user.
// //   @param {string} message The message to display.
// //  * @param {'success'|'error'|'info'} type The type of alert (for styling).
// //  * @returns {void}
// //  */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.textContent = message;
}