// ===============================================
// CONFIGURATION & CONSTANTS
// ===============================================

const CONFIG = {
    PEEKALINK_API: 'https://api.peekalink.io/',
    PEEKALINK_KEY: '', // Will be set from environment
    ICONHORSE_API: 'https://icon.horse/icon/',
    MICROLINK_API: 'https://api.microlink.io',
    STORAGE_KEY: 'researchItems',
    UNDO_STACK_KEY: 'undoStack',
    MAX_UNDO: 10,
    TOAST_DURATION: 5000,
    AUTO_SAVE_DELAY: 500,
};

// ===============================================
// STATE MANAGEMENT
// ===============================================

let state = {
    resources: [],
    filteredResources: [],
    currentView: 'grid',
    currentSort: 'date-desc',
    currentFilter: 'all',
    searchQuery: '',
    selectedItems: new Set(),
    isSelectMode: false,
    undoStack: [],
    currentEditIndex: -1,
    autoSaveTimer: null,
    tags: new Set(),
};

// ===============================================
// DOM ELEMENTS
// ===============================================

const elements = {
    // Header
    itemCount: document.getElementById('item-count'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    viewBtns: document.querySelectorAll('.view-btn'),
    sortBtn: document.getElementById('sort-btn'),
    sortMenu: document.getElementById('sort-menu'),
    sortOptions: document.querySelectorAll('.sort-option'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    importFileInput: document.getElementById('import-file-input'),
    themeToggle: document.getElementById('theme-toggle'),
    addBtn: document.getElementById('add-item-button'),
    filterTags: document.getElementById('filter-tags'),
    
    // Main
    itemsSection: document.getElementById('items-section'),
    
    // Drawer
    drawerOverlay: document.getElementById('drawer-overlay'),
    drawer: document.getElementById('drawer'),
    drawerTitle: document.getElementById('drawer-title'),
    drawerClose: document.getElementById('drawer-close'),
    form: document.getElementById('form'),
    
    // Form inputs
    resourceLink: document.getElementById('resource-link'),
    autoFillBtn: document.getElementById('auto-fill-btn'),
    urlPreview: document.getElementById('url-preview'),
    resourceName: document.getElementById('resource-name'),
    description: document.getElementById('description'),
    charCount: document.getElementById('char-count'),
    tagsInput: document.getElementById('tags-input'),
    tagsDisplay: document.getElementById('tags-display'),
    tagSuggestions: document.querySelectorAll('.tag-suggestion'),
    favoriteCheckbox: document.getElementById('favorite-checkbox'),
    editIndex: document.getElementById('edit-index'),
    submitButton: document.getElementById('submitButton'),
    cancelBtn: document.getElementById('cancel-btn'),
    
    // Error messages
    linkError: document.getElementById('link-error'),
    nameError: document.getElementById('name-error'),
    descriptionError: document.getElementById('description-error'),
    
    // Delete modal
    deleteOverlay: document.getElementById('delete-confirmation-overlay'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    
    // Bulk actions
    bulkActionsBar: document.getElementById('bulk-actions-bar'),
    selectedCount: document.getElementById('selected-count'),
    bulkExportBtn: document.getElementById('bulk-export-btn'),
    bulkDeleteBtn: document.getElementById('bulk-delete-btn'),
    bulkCancelBtn: document.getElementById('bulk-cancel-btn'),
    
    // Toast
    toastContainer: document.getElementById('toast-container'),
};

// ===============================================
// INITIALIZATION
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadResources();
    loadTheme();
    setupEventListeners();
    updateItemCount();
    renderResources();
    initializeSortable();
    checkFirstVisit();
    
    // Add scroll event for header
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

function checkFirstVisit() {
    if (!localStorage.getItem('hasVisited')) {
        showOnboardingToast();
        localStorage.setItem('hasVisited', 'true');
    }
}

function showOnboardingToast() {
    showToast({
        type: 'info',
        title: 'Welcome to Resource Bank! 🎉',
        message: 'Start organizing your research resources beautifully.',
        duration: 6000,
    });
}

// ===============================================
// EVENT LISTENERS
// ===============================================

function setupEventListeners() {
    // Header actions
    elements.addBtn.addEventListener('click', openAddDrawer);
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearSearch.addEventListener('click', clearSearch);
    elements.viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));
    elements.sortBtn.addEventListener('click', toggleSortMenu);
    elements.sortOptions.forEach(option => option.addEventListener('click', handleSort));
    elements.exportBtn.addEventListener('click', exportData);
    elements.importBtn.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', handleImport);
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Drawer
    elements.drawerOverlay.addEventListener('click', (e) => {
        if (e.target === elements.drawerOverlay) closeDrawer();
    });
    elements.drawerClose.addEventListener('click', closeDrawer);
    elements.cancelBtn.addEventListener('click', closeDrawer);
    
    // Form
    elements.form.addEventListener('submit', handleSubmit);
    elements.autoFillBtn.addEventListener('click', autoFillFromURL);
    elements.resourceLink.addEventListener('input', debounce(handleURLInput, 500));
    elements.description.addEventListener('input', updateCharCount);
    elements.tagsInput.addEventListener('keydown', handleTagInput);
    elements.tagSuggestions.forEach(btn => {
        btn.addEventListener('click', () => addTag(btn.dataset.tag));
    });
    
    // Delete modal
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    
    // Bulk actions
    elements.bulkExportBtn.addEventListener('click', exportSelected);
    elements.bulkDeleteBtn.addEventListener('click', deleteSelected);
    elements.bulkCancelBtn.addEventListener('click', exitSelectMode);
    
    // Close sort menu on outside click
    document.addEventListener('click', (e) => {
        if (!elements.sortBtn.contains(e.target) && !elements.sortMenu.contains(e.target)) {
            elements.sortMenu.classList.remove('active');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===============================================
// DATA MANAGEMENT
// ===============================================

function loadResources() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (stored) {
        try {
            state.resources = JSON.parse(stored);
            state.filteredResources = [...state.resources];
            extractAllTags();
        } catch (error) {
            console.error('Error loading resources:', error);
            state.resources = [];
            state.filteredResources = [];
        }
    }
}

function saveResources() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.resources));
        updateItemCount();
    } catch (error) {
        console.error('Error saving resources:', error);
        showToast({
            type: 'error',
            title: 'Save Failed',
            message: 'Could not save resources. Storage might be full.',
        });
    }
}

function addToUndoStack(action) {
    state.undoStack.push({
        action,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(state.resources)),
    });
    
    if (state.undoStack.length > CONFIG.MAX_UNDO) {
        state.undoStack.shift();
    }
    
    localStorage.setItem(CONFIG.UNDO_STACK_KEY, JSON.stringify(state.undoStack));
}

function undo() {
    if (state.undoStack.length === 0) return;
    
    const lastAction = state.undoStack.pop();
    state.resources = lastAction.data;
    saveResources();
    renderResources();
    
    showToast({
        type: 'info',
        title: 'Undo Successful',
        message: `Reverted ${lastAction.action}`,
    });
}

// ===============================================
// RESOURCE OPERATIONS
// ===============================================

function createResource(data) {
    const resource = {
        id: generateId(),
        name: data.name,
        url: data.url,
        description: data.description,
        tags: data.tags || [],
        favorite: data.favorite || false,
        favicon: data.favicon || '',
        dominantColor: data.dominantColor || '#667eea',
        dateAdded: Date.now(),
        lastEdited: null,
        metadata: data.metadata || {},
    };
    
    return resource;
}

function addResource(resource) {
    addToUndoStack('add resource');
    state.resources.unshift(resource);
    saveResources();
    applyFilters();
    renderResources();
    
    // Animate the new card
    setTimeout(() => {
        const card = document.querySelector(`[data-id="${resource.id}"]`);
        if (card) {
            card.classList.add('highlight-new');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
    
    showToast({
        type: 'success',
        title: 'Resource Added! ✨',
        message: `${resource.name} has been added to your library.`,
        actions: [
            { label: 'Undo', action: undo }
        ],
    });
}

function updateResource(index, data) {
    if (index < 0 || index >= state.resources.length) return;
    
    addToUndoStack('update resource');
    const resource = state.resources[index];
    
    state.resources[index] = {
        ...resource,
        ...data,
        lastEdited: Date.now(),
    };
    
    saveResources();
    applyFilters();
    renderResources();
    
    setTimeout(() => {
        const card = document.querySelector(`[data-id="${state.resources[index].id}"]`);
        if (card) {
            card.classList.add('highlight-edited');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
    
    showToast({
        type: 'success',
        title: 'Resource Updated! 📝',
        message: `${data.name} has been updated.`,
        actions: [
            { label: 'Undo', action: undo }
        ],
    });
}

let currentDeleteIndex = null;

function deleteResource(index) {
    if (index < 0 || index >= state.resources.length) return;
    
    currentDeleteIndex = index;
    elements.deleteOverlay.classList.add('visible');
}

function confirmDelete() {
    if (currentDeleteIndex === null) return;
    
    addToUndoStack('delete resource');
    const deleted = state.resources.splice(currentDeleteIndex, 1)[0];
    
    saveResources();
    applyFilters();
    renderResources();
    closeDeleteModal();
    
    showToast({
        type: 'success',
        title: 'Resource Deleted 🗑️',
        message: `${deleted.name} has been removed.`,
        actions: [
            { label: 'Undo', action: undo }
        ],
    });
    
    currentDeleteIndex = null;
}

function closeDeleteModal() {
    elements.deleteOverlay.classList.remove('visible');
    currentDeleteIndex = null;
}

// ===============================================
// DRAWER MANAGEMENT
// ===============================================

function openAddDrawer() {
    state.currentEditIndex = -1;
    elements.editIndex.value = -1;
    elements.drawerTitle.textContent = 'Add Resource';
    elements.submitButton.innerHTML = '<i class="fas fa-check"></i><span>Add Resource</span>';
    resetForm();
    openDrawer();
}

function openEditDrawer(index) {
    state.currentEditIndex = index;
    const resource = state.resources[index];
    
    elements.editIndex.value = index;
    elements.drawerTitle.textContent = 'Edit Resource';
    elements.submitButton.innerHTML = '<i class="fas fa-save"></i><span>Save Changes</span>';
    
    // Populate form
    elements.resourceLink.value = resource.url;
    elements.resourceName.value = resource.name;
    elements.description.value = resource.description;
    elements.favoriteCheckbox.checked = resource.favorite;
    
    // Populate tags
    elements.tagsDisplay.innerHTML = '';
    resource.tags.forEach(tag => renderTag(tag));
    
    updateCharCount();
    openDrawer();
}

function openDrawer() {
    elements.drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    setTimeout(() => elements.resourceLink.focus(), 300);
}

function closeDrawer() {
    elements.drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
}

function resetForm() {
    elements.form.reset();
    elements.tagsDisplay.innerHTML = '';
    elements.urlPreview.classList.remove('active');
    elements.urlPreview.innerHTML = '';
    clearErrors();
    updateCharCount();
}

function clearErrors() {
    elements.linkError.classList.remove('active');
    elements.nameError.classList.remove('active');
    elements.descriptionError.classList.remove('active');
    
    elements.resourceLink.classList.remove('input-error');
    elements.resourceName.classList.remove('input-error');
    elements.description.classList.remove('input-error');
}

// ===============================================
// FORM HANDLING
// ===============================================

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const tags = Array.from(elements.tagsDisplay.querySelectorAll('.tag-item'))
        .map(tag => tag.textContent.replace('×', '').trim());
    
    const data = {
        name: elements.resourceName.value.trim(),
        url: elements.resourceLink.value.trim(),
        description: elements.description.value.trim(),
        tags,
        favorite: elements.favoriteCheckbox.checked,
        favicon: await getFavicon(elements.resourceLink.value.trim()),
    };
    
    // Try to get dominant color
    try {
        const colorData = await getDominantColor(data.url);
        if (colorData) {
            data.dominantColor = colorData;
        }
    } catch (error) {
        console.log('Could not get dominant color:', error);
    }
    
    const editIndex = parseInt(elements.editIndex.value);
    
    if (editIndex >= 0) {
        updateResource(editIndex, data);
    } else {
        const resource = createResource(data);
        addResource(resource);
    }
    
    closeDrawer();
}

function validateForm() {
    clearErrors();
    let isValid = true;
    
    // Validate URL
    const url = elements.resourceLink.value.trim();
    if (!url) {
        showError(elements.linkError, elements.resourceLink, 'URL is required');
        isValid = false;
    } else if (!isValidURL(url)) {
        showError(elements.linkError, elements.resourceLink, 'Please enter a valid URL (include https://)');
        isValid = false;
    }
    
    // Validate name
    const name = elements.resourceName.value.trim();
    if (!name) {
        showError(elements.nameError, elements.resourceName, 'Resource name is required');
        isValid = false;
    }
    
    // Validate description
    const description = elements.description.value.trim();
    if (!description) {
        showError(elements.descriptionError, elements.description, 'Description is required');
        isValid = false;
    }
    
    return isValid;
}

function showError(errorElement, inputElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('active');
    inputElement.classList.add('input-error');
}

function updateCharCount() {
    const count = elements.description.value.length;
    elements.charCount.textContent = count;
    
    if (count > 450) {
        elements.charCount.style.color = 'var(--color-warning)';
    } else {
        elements.charCount.style.color = 'var(--color-text-tertiary)';
    }
}

// ===============================================
// AUTO-FILL & METADATA
// ===============================================

async function handleURLInput() {
    const url = elements.resourceLink.value.trim();
    
    if (!url || !isValidURL(url)) {
        elements.urlPreview.classList.remove('active');
        return;
    }
    
    // Show loading state
    elements.urlPreview.classList.add('active');
    elements.urlPreview.innerHTML = '<div class="url-preview-content"><i class="fas fa-spinner fa-spin"></i> Fetching preview...</div>';
    
    try {
        const metadata = await fetchMetadata(url);
        if (metadata) {
            displayURLPreview(metadata);
        }
    } catch (error) {
        elements.urlPreview.classList.remove('active');
    }
}

async function autoFillFromURL() {
    const url = elements.resourceLink.value.trim();
    
    if (!url || !isValidURL(url)) {
        showToast({
            type: 'error',
            title: 'Invalid URL',
            message: 'Please enter a valid URL first.',
        });
        return;
    }
    
    elements.autoFillBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    elements.autoFillBtn.disabled = true;
    
    try {
        const metadata = await fetchMetadata(url);
        
        if (metadata) {
            if (metadata.title && !elements.resourceName.value) {
                elements.resourceName.value = metadata.title;
            }
            
            if (metadata.description && !elements.description.value) {
                elements.description.value = metadata.description;
                updateCharCount();
            }
            
            showToast({
                type: 'success',
                title: 'Auto-filled! ✨',
                message: 'Metadata has been fetched from the URL.',
            });
        }
    } catch (error) {
        showToast({
            type: 'error',
            title: 'Auto-fill Failed',
            message: 'Could not fetch metadata from this URL.',
        });
    } finally {
        elements.autoFillBtn.innerHTML = '<i class="fas fa-magic"></i>';
        elements.autoFillBtn.disabled = false;
    }
}

async function fetchMetadata(url) {
    try {
        // Try Microlink API first (more reliable)
        const response = await fetch(`${CONFIG.MICROLINK_API}?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            return {
                title: data.data.title || '',
                description: data.data.description || '',
                image: data.data.image?.url || '',
                favicon: data.data.logo?.url || '',
            };
        }
    } catch (error) {
        console.log('Microlink fetch failed:', error);
    }
    
    // Fallback: try basic fetch
    try {
        const response = await fetch(url, { mode: 'no-cors' });
        return null; // Will use Icon Horse for favicon
    } catch (error) {
        console.log('Direct fetch failed:', error);
        return null;
    }
}

function displayURLPreview(metadata) {
    const favicon = metadata.favicon || getFavicon(elements.resourceLink.value);
    
    elements.urlPreview.innerHTML = `
        <div class="url-preview-content">
            <img src="${favicon}" alt="" class="url-preview-favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔗</text></svg>'">
            <div class="url-preview-text">
                <h4>${metadata.title || 'No title available'}</h4>
                <p>${metadata.description ? metadata.description.substring(0, 100) + '...' : 'No description'}</p>
            </div>
        </div>
    `;
}

function getFavicon(url) {
    try {
        const domain = new URL(url).hostname;
        return `${CONFIG.ICONHORSE_API}${domain}`;
    } catch {
        return 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔗</text></svg>';
    }
}

async function getDominantColor(url) {
    try {
        const response = await fetch(`${CONFIG.MICROLINK_API}?url=${encodeURIComponent(url)}&palette=true`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data.palette) {
            return data.data.palette[0] || '#667eea';
        }
    } catch (error) {
        console.log('Could not get dominant color:', error);
    }
    
    return '#667eea';
}

// ===============================================
// TAGS MANAGEMENT
// ===============================================

function handleTagInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = elements.tagsInput.value.trim();
        if (tag) {
            addTag(tag);
            elements.tagsInput.value = '';
        }
    }
}

function addTag(tagName) {
    // Check if tag already exists
    const existingTags = Array.from(elements.tagsDisplay.querySelectorAll('.tag-item'))
        .map(tag => tag.textContent.replace('×', '').trim());
    
    if (existingTags.includes(tagName)) {
        return;
    }
    
    renderTag(tagName);
}

function renderTag(tagName) {
    const tagElement = document.createElement('div');
    tagElement.className = 'tag-item';
    tagElement.innerHTML = `
        ${tagName}
        <button type="button" class="tag-remove">×</button>
    `;
    
    tagElement.querySelector('.tag-remove').addEventListener('click', () => {
        tagElement.remove();
    });
    
    elements.tagsDisplay.appendChild(tagElement);
}

function extractAllTags() {
    state.tags.clear();
    state.resources.forEach(resource => {
        if (resource.tags) {
            resource.tags.forEach(tag => state.tags.add(tag));
        }
    });
    renderFilterTags();
}

function renderFilterTags() {
    const allTag = elements.filterTags.querySelector('[data-tag="all"]');
    elements.filterTags.innerHTML = '';
    elements.filterTags.appendChild(allTag);
    
    Array.from(state.tags).sort().forEach(tag => {
        const button = document.createElement('button');
        button.className = 'tag-filter';
        button.dataset.tag = tag;
        button.textContent = tag;
        button.addEventListener('click', () => filterByTag(tag));
        elements.filterTags.appendChild(button);
    });
}

function filterByTag(tag) {
    state.currentFilter = tag;
    
    // Update active state
    elements.filterTags.querySelectorAll('.tag-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tag === tag);
    });
    
    applyFilters();
    renderResources();
}

// ===============================================
// SEARCH & FILTER
// ===============================================

function handleSearch(e) {
    state.searchQuery = e.target.value.trim().toLowerCase();
    
    if (state.searchQuery) {
        elements.clearSearch.style.display = 'block';
    } else {
        elements.clearSearch.style.display = 'none';
    }
    
    applyFilters();
    renderResources();
}

function clearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.style.display = 'none';
    applyFilters();
    renderResources();
}

function applyFilters() {
    let filtered = [...state.resources];
    
    // Apply tag filter
    if (state.currentFilter !== 'all') {
        filtered = filtered.filter(resource => 
            resource.tags && resource.tags.includes(state.currentFilter)
        );
    }
    
    // Apply search
    if (state.searchQuery) {
        filtered = filtered.filter(resource => 
            resource.name.toLowerCase().includes(state.searchQuery) ||
            resource.description.toLowerCase().includes(state.searchQuery) ||
            resource.url.toLowerCase().includes(state.searchQuery) ||
            (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(state.searchQuery)))
        );
    }
    
    // Apply sort
    applySorting(filtered);
    
    state.filteredResources = filtered;
}

function applySorting(resources) {
    switch (state.currentSort) {
        case 'date-desc':
            resources.sort((a, b) => b.dateAdded - a.dateAdded);
            break;
        case 'date-asc':
            resources.sort((a, b) => a.dateAdded - b.dateAdded);
            break;
        case 'name-asc':
            resources.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            resources.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'edited':
            resources.sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0));
            break;
    }
    
    // Favorites always on top
    resources.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
}

// ===============================================
// SORTING
// ===============================================

function toggleSortMenu() {
    elements.sortMenu.classList.toggle('active');
}

function handleSort(e) {
    const sortType = e.currentTarget.dataset.sort;
    state.currentSort = sortType;
    
    // Update active state
    elements.sortOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.sort === sortType);
    });
    
    elements.sortMenu.classList.remove('active');
    
    applyFilters();
    renderResources();
}

// ===============================================
// VIEW MANAGEMENT
// ===============================================

function handleViewChange(e) {
    const view = e.currentTarget.dataset.view;
    state.currentView = view;
    
    // Update active state
    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update grid class
    elements.itemsSection.classList.remove('list-view', 'compact-view');
    if (view === 'list') {
        elements.itemsSection.classList.add('list-view');
    } else if (view === 'compact') {
        elements.itemsSection.classList.add('compact-view');
    }
}

// ===============================================
// RENDERING
// ===============================================

function renderResources() {
    elements.itemsSection.innerHTML = '';
    
    if (state.filteredResources.length === 0) {
        renderEmptyState();
        return;
    }
    
    state.filteredResources.forEach((resource, index) => {
        const card = createResourceCard(resource, index);
        elements.itemsSection.appendChild(card);
    });
    
    // Stagger animation
    gsap.from('.resource-card', {
        opacity: 0,
        y: 20,
        stagger: 0.05,
        duration: 0.4,
        ease: 'power2.out',
    });
    
    updateItemCount();
    extractAllTags();
}

function createResourceCard(resource, index) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.dataset.id = resource.id;
    card.dataset.index = index;
    
    if (resource.favorite) {
        card.classList.add('favorite');
    }
    
    if (state.isSelectMode) {
        card.classList.add('select-mode');
    }
    
    // Add status badge
    let statusBadge = '';
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (resource.dateAdded && (now - resource.dateAdded) < dayInMs * 7) {
        statusBadge = '<span class="status-badge new"><i class="fas fa-sparkles"></i> New</span>';
    } else if (resource.lastEdited && (now - resource.lastEdited) < dayInMs) {
        statusBadge = '<span class="status-badge edited"><i class="fas fa-pen"></i> Edited</span>';
    }
    
    const favicon = resource.favicon || getFavicon(resource.url);
    const tags = resource.tags ? resource.tags.map(tag => 
        `<span class="card-tag" onclick="filterByTag('${tag}')">${tag}</span>`
    ).join('') : '';
    
    const date = new Date(resource.dateAdded).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    
    card.innerHTML = `
        ${state.isSelectMode ? `<input type="checkbox" class="card-select-checkbox" data-index="${index}">` : ''}
        <div class="card-header">
            <img src="${favicon}" alt="" class="card-favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔗</text></svg>'">
            <div class="card-title-section">
                <a href="${resource.url}" target="_blank" class="card-title-link" title="${resource.name}">
                    ${resource.name}
                </a>
                <div class="card-url">${getDomain(resource.url)}</div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn share" title="Share" onclick="shareResource(${index})">
                    <i class="fas fa-share-nodes"></i>
                </button>
                <button class="card-action-btn edit" title="Edit" onclick="editResource(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="card-action-btn delete" title="Delete" onclick="deleteResourceClick(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="card-description">${resource.description}</div>
        <div class="card-footer">
            <div class="card-tags">${tags}</div>
            <div class="card-meta">
                ${statusBadge}
                <span><i class="far fa-calendar"></i> ${date}</span>
            </div>
        </div>
    `;
    
    // Add card border color based on dominant color
    if (resource.dominantColor) {
        card.style.setProperty('--card-accent', resource.dominantColor);
    }
    
    return card;
}

function renderEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    const hasSearch = state.searchQuery || state.currentFilter !== 'all';
    
    if (hasSearch) {
        emptyState.innerHTML = `
            <div class="empty-icon">🔍</div>
            <h2>No Results Found</h2>
            <p>Try adjusting your search or filters</p>
            <div class="empty-actions">
                <button class="empty-action-btn" onclick="clearAllFilters()">
                    <i class="fas fa-times"></i>
                    Clear Filters
                </button>
            </div>
        `;
    } else {
        emptyState.innerHTML = `
            <div class="empty-icon">📚</div>
            <h2>Start Your Resource Library</h2>
            <p>Organize and manage your research resources in one beautiful place. Add your first resource to get started!</p>
            <div class="empty-actions">
                <button class="empty-action-btn primary" onclick="openAddDrawer()">
                    <i class="fas fa-plus"></i>
                    Add First Resource
                </button>
                <button class="empty-action-btn" onclick="importData()">
                    <i class="fas fa-upload"></i>
                    Import Resources
                </button>
            </div>
        `;
    }
    
    elements.itemsSection.appendChild(emptyState);
}

function updateItemCount() {
    elements.itemCount.textContent = state.resources.length;
}

// ===============================================
// EXPORT & IMPORT
// ===============================================

function exportData() {
    if (state.resources.length === 0) {
        showToast({
            type: 'warning',
            title: 'Nothing to Export',
            message: 'Add some resources first.',
        });
        return;
    }
    
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        resources: state.resources,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource-bank-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast({
        type: 'success',
        title: 'Export Successful! 📦',
        message: `Exported ${state.resources.length} resources.`,
    });
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (data.resources && Array.isArray(data.resources)) {
                addToUndoStack('import resources');
                
                const importCount = data.resources.length;
                data.resources.forEach(resource => {
                    if (!resource.id) {
                        resource.id = generateId();
                    }
                    state.resources.push(resource);
                });
                
                saveResources();
                applyFilters();
                renderResources();
                
                showToast({
                    type: 'success',
                    title: 'Import Successful! 📥',
                    message: `Imported ${importCount} resources.`,
                    actions: [
                        { label: 'Undo', action: undo }
                    ],
                });
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: 'Import Failed',
                message: 'Invalid file format. Please use a valid JSON export.',
            });
        }
    };
    
    reader.readAsText(file);
    e.target.value = '';
}

function exportSelected() {
    if (state.selectedItems.size === 0) return;
    
    const selectedResources = Array.from(state.selectedItems).map(index => 
        state.resources[index]
    );
    
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        resources: selectedResources,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource-bank-selected-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast({
        type: 'success',
        title: 'Export Successful! 📦',
        message: `Exported ${selectedResources.length} selected resources.`,
    });
}

// ===============================================
// BULK OPERATIONS
// ===============================================

function enterSelectMode() {
    state.isSelectMode = true;
    renderResources();
    elements.bulkActionsBar.classList.add('active');
}

function exitSelectMode() {
    state.isSelectMode = false;
    state.selectedItems.clear();
    renderResources();
    elements.bulkActionsBar.classList.remove('active');
    updateSelectedCount();
}

function toggleSelect(index) {
    if (state.selectedItems.has(index)) {
        state.selectedItems.delete(index);
    } else {
        state.selectedItems.add(index);
    }
    updateSelectedCount();
}

function updateSelectedCount() {
    elements.selectedCount.textContent = state.selectedItems.size;
    
    if (state.selectedItems.size === 0 && state.isSelectMode) {
        exitSelectMode();
    }
}

function deleteSelected() {
    if (state.selectedItems.size === 0) return;
    
    if (confirm(`Delete ${state.selectedItems.size} selected resources?`)) {
        addToUndoStack('bulk delete');
        
        const indices = Array.from(state.selectedItems).sort((a, b) => b - a);
        indices.forEach(index => {
            state.resources.splice(index, 1);
        });
        
        saveResources();
        exitSelectMode();
        applyFilters();
        renderResources();
        
        showToast({
            type: 'success',
            title: 'Resources Deleted',
            message: `Deleted ${indices.length} resources.`,
            actions: [
                { label: 'Undo', action: undo }
            ],
        });
    }
}

// ===============================================
// DRAG & DROP REORDERING
// ===============================================

function initializeSortable() {
    new Sortable(elements.itemsSection, {
        animation: 200,
        ghostClass: 'dragging',
        handle: '.resource-card',
        onEnd: function(evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            if (oldIndex !== newIndex) {
                addToUndoStack('reorder resources');
                const item = state.filteredResources.splice(oldIndex, 1)[0];
                state.filteredResources.splice(newIndex, 0, item);
                
                // Update main resources array
                state.resources = [...state.filteredResources];
                saveResources();
                
                showToast({
                    type: 'info',
                    title: 'Reordered',
                    message: 'Resources have been reordered.',
                });
            }
        },
    });
}

// ===============================================
// SHARING
// ===============================================

function shareResource(index) {
    const resource = state.resources[index];
    
    const shareData = {
        title: resource.name,
        text: resource.description,
        url: resource.url,
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(err => {
            console.log('Share failed:', err);
            copyToClipboard(resource.url);
        });
    } else {
        // Fallback: copy link
        copyToClipboard(resource.url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast({
            type: 'success',
            title: 'Copied! 📋',
            message: 'Link copied to clipboard.',
        });
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

// ===============================================
// THEME
// ===============================================

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    
    showToast({
        type: 'info',
        title: `${next === 'dark' ? '🌙' : '☀️'} Theme Changed`,
        message: `Switched to ${next} mode.`,
    });
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===============================================
// TOAST NOTIFICATIONS
// ===============================================

function showToast({ type = 'info', title, message, duration = CONFIG.TOAST_DURATION, actions = [] }) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    
    let actionsHTML = '';
    if (actions.length > 0) {
        actionsHTML = '<div class="toast-actions">' + 
            actions.map(action => `<button class="toast-btn" onclick="${action.action.name}()">${action.label}</button>`).join('') +
            '</div>';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${iconMap[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        ${actionsHTML}
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    if (toast && toast.parentNode) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }
}

// ===============================================
// KEYBOARD SHORTCUTS
// ===============================================

function handleKeyboardShortcuts(e) {
    // Cmd/Ctrl + K: Focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        elements.searchInput.focus();
    }
    
    // Cmd/Ctrl + N: New resource
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openAddDrawer();
    }
    
    // Cmd/Ctrl + Z: Undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
        if (elements.drawerOverlay.classList.contains('active')) {
            closeDrawer();
        }
        if (elements.deleteOverlay.classList.contains('visible')) {
            closeDeleteModal();
        }
    }
    
    // Cmd/Ctrl + Enter: Submit form
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (elements.drawerOverlay.classList.contains('active')) {
            elements.form.dispatchEvent(new Event('submit'));
        }
    }
}

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function clearAllFilters() {
    state.currentFilter = 'all';
    state.searchQuery = '';
    elements.searchInput.value = '';
    elements.clearSearch.style.display = 'none';
    
    elements.filterTags.querySelectorAll('.tag-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tag === 'all');
    });
    
    applyFilters();
    renderResources();
}

// ===============================================
// GLOBAL FUNCTIONS (for onclick handlers)
// ===============================================

window.editResource = function(index) {
    openEditDrawer(index);
};

window.deleteResourceClick = function(index) {
    deleteResource(index);
};

window.shareResource = shareResource;
window.filterByTag = filterByTag;
window.openAddDrawer = openAddDrawer;
window.importData = () => elements.importBtn.click();
window.clearAllFilters = clearAllFilters;