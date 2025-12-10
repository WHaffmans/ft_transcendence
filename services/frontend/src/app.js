"use strict";
// API Base URL - uses relative path since we're behind Traefik
const API_BASE = '/api';
// API Functions
async function fetchUsers() {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.users || [];
}
async function createUser(username) {
    const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create user');
    }
    return data.user;
}
async function updateUser(id, username) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to update user');
    }
    return data.user;
}
async function deleteUser(id) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
    }
}
// DOM Elements
const usersList = document.getElementById('usersList');
const emptyState = document.getElementById('emptyState');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const createUserForm = document.getElementById('createUserForm');
const usernameInput = document.getElementById('usernameInput');
const createMessage = document.getElementById('createMessage');
const refreshBtn = document.getElementById('refreshBtn');
// Edit Modal Elements
const editModal = document.getElementById('editModal');
const editUserForm = document.getElementById('editUserForm');
const editUserId = document.getElementById('editUserId');
const editUsernameInput = document.getElementById('editUsernameInput');
const editMessage = document.getElementById('editMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
// UI Helper Functions
function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
}
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 5000);
}
function showMessage(element, message, isError = false) {
    element.textContent = `✨ ${message}`;
    element.className = `mt-3 text-sm ${isError ? 'text-red-600' : 'text-green-600'}`;
    setTimeout(() => element.textContent = '', 3000);
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}
// Render Functions
function renderUsers(users) {
    usersList.innerHTML = '';
    if (users.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors';
        userCard.innerHTML = `
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-800">${escapeHtml(user.username)}</h3>
        <p class="text-sm text-gray-500">ID: ${user.id} • Created: ${formatDate(user.createdAt)}</p>
      </div>
      <div class="flex gap-2">
        <button 
          class="edit-btn px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          data-id="${user.id}"
          data-username="${escapeHtml(user.username)}"
        >
          ✏️ Edit
        </button>
        <button 
          class="delete-btn px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          data-id="${user.id}"
          data-username="${escapeHtml(user.username)}"
        >
          🗑️ Delete
        </button>
      </div>
    `;
        usersList.appendChild(userCard);
    });
    // Attach event listeners to buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// Event Handlers
async function loadUsers() {
    try {
        showLoading(true);
        const users = await fetchUsers();
        renderUsers(users);
    }
    catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to load users');
    }
    finally {
        showLoading(false);
    }
}
async function handleCreateUser(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username)
        return;
    try {
        await createUser(username);
        showMessage(createMessage, 'User created successfully!');
        usernameInput.value = '';
        await loadUsers();
    }
    catch (error) {
        showMessage(createMessage, error instanceof Error ? error.message : 'Failed to create user', true);
    }
}
function handleEdit(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const username = btn.dataset.username;
    editUserId.value = id;
    editUsernameInput.value = username;
    editMessage.textContent = '';
    editModal.classList.remove('hidden');
    editUsernameInput.focus();
}
async function handleEditSubmit(e) {
    e.preventDefault();
    const id = parseInt(editUserId.value);
    const username = editUsernameInput.value.trim();
    if (!username)
        return;
    try {
        await updateUser(id, username);
        showMessage(editMessage, 'User updated successfully!');
        setTimeout(() => {
            editModal.classList.add('hidden');
            loadUsers();
        }, 1000);
    }
    catch (error) {
        showMessage(editMessage, error instanceof Error ? error.message : 'Failed to update user', true);
    }
}
async function handleDelete(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    const username = btn.dataset.username;
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
        return;
    }
    try {
        await deleteUser(id);
        await loadUsers();
    }
    catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to delete user');
    }
}
function closeEditModal() {
    editModal.classList.add('hidden');
    editMessage.textContent = '';
}
// Event Listeners
createUserForm.addEventListener('submit', handleCreateUser);
editUserForm.addEventListener('submit', handleEditSubmit);
cancelEditBtn.addEventListener('click', closeEditModal);
refreshBtn.addEventListener('click', loadUsers);
// Close modal on background click
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});
// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
        closeEditModal();
    }
});
// Initial load
loadUsers();
