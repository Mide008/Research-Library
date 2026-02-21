// ===============================================
// CONFIGURATION & CONSTANTS
// ===============================================

const CONFIG = {
    ANTHROPIC_API: 'https://api.anthropic.com/v1/messages',
    CLAUDE_MODEL: 'claude-sonnet-4-20250514',
    ICONHORSE_API: 'https://icon.horse/icon/',
    MICROLINK_API: 'https://api.microlink.io',
    STORAGE_KEY: 'researchItems_v2',
    UNDO_STACK_KEY: 'undoStack_v2',
    MAX_UNDO: 10,
    TOAST_DURATION: 5000,
};

// ===============================================
// STATE
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
    tags: new Set(),
    digestData: null,
    activeDigestTab: 'overview',
    currentDeleteIndex: null,
};

// ===============================================
// DOM ELEMENTS
// ===============================================

// el is populated inside DOMContentLoaded — see initEl() below
const el = {};

function initEl() {
    el.itemCount = document.getElementById('item-count');
    el.searchInput = document.getElementById('search-input');
    el.clearSearch = document.getElementById('clear-search');
    el.viewBtns = document.querySelectorAll('.view-btn');
    el.sortBtn = document.getElementById('sort-btn');
    el.sortMenu = document.getElementById('sort-menu');
    el.sortOptions = document.querySelectorAll('.sort-option');
    el.exportBtn = document.getElementById('export-btn');
    el.importBtn = document.getElementById('import-btn');
    el.importFileInput = document.getElementById('import-file-input');
    el.digestBtn = document.getElementById('digest-btn');
    el.themeToggle = document.getElementById('theme-toggle');
    el.apiKeyBtn = document.getElementById('api-key-btn');
    el.addBtn = document.getElementById('add-item-button');
    el.filterTags = document.getElementById('filter-tags');
    el.itemsSection = document.getElementById('items-section');
    el.drawerOverlay = document.getElementById('drawer-overlay');
    el.drawer = document.getElementById('drawer');
    el.drawerTitle = document.getElementById('drawer-title');
    el.drawerClose = document.getElementById('drawer-close');
    el.form = document.getElementById('form');
    el.resourceLink = document.getElementById('resource-link');
    el.autoFillBtn = document.getElementById('auto-fill-btn');
    el.urlPreview = document.getElementById('url-preview');
    el.resourceName = document.getElementById('resource-name');
    el.description = document.getElementById('description');
    el.charCount = document.getElementById('char-count');
    el.genDescBtn = document.getElementById('gen-description-btn');
    el.genTagsBtn = document.getElementById('gen-tags-btn');
    el.insightsGroup = document.getElementById('insights-group');
    el.insightsDisplay = document.getElementById('insights-display');
    el.insightsData = document.getElementById('insights-data');
    el.tagsInput = document.getElementById('tags-input');
    el.tagsDisplay = document.getElementById('tags-display');
    el.tagSuggestions = document.querySelectorAll('.tag-suggestion');
    el.favoriteCheckbox = document.getElementById('favorite-checkbox');
    el.editIndex = document.getElementById('edit-index');
    el.submitButton = document.getElementById('submitButton');
    el.cancelBtn = document.getElementById('cancel-btn');
    el.linkError = document.getElementById('link-error');
    el.nameError = document.getElementById('name-error');
    el.descriptionError = document.getElementById('description-error');
    el.duplicateWarning = document.getElementById('duplicate-warning');
    el.duplicateDetail = document.getElementById('duplicate-detail');
    el.dismissDuplicate = document.getElementById('dismiss-duplicate');
    el.citationPreview = document.getElementById('citation-preview');
    el.citationText = document.getElementById('citation-text');
    el.copyCitationBtn = document.getElementById('copy-citation-btn');
    el.deleteOverlay = document.getElementById('delete-confirmation-overlay');
    el.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    el.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    el.digestOverlay = document.getElementById('digest-overlay');
    el.digestPanel = document.getElementById('digest-panel');
    el.digestClose = document.getElementById('digest-close');
    el.digestBody = document.getElementById('digest-body');
    el.digestLoading = document.getElementById('digest-loading');
    el.digestContent = document.getElementById('digest-content');
    el.digestRunBtn = document.getElementById('digest-run-btn');
    el.digestExportBtn = document.getElementById('digest-export-notebooklm');
    el.digestTabs = document.querySelectorAll('.digest-tab');
    el.bulkActionsBar = document.getElementById('bulk-actions-bar');
    el.selectedCount = document.getElementById('selected-count');
    el.bulkExportBtn = document.getElementById('bulk-export-btn');
    el.bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    el.bulkCancelBtn = document.getElementById('bulk-cancel-btn');
    el.toastContainer = document.getElementById('toast-container');
}

// ===============================================
// INIT
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    initEl();
    loadResources();
    loadTheme();
    setupEventListeners();
    updateItemCount();
    renderResources();
    initializeSortable();
    checkFirstVisit();

    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.pageYOffset > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });
});

function checkFirstVisit() {
    if (!localStorage.getItem('hasVisited_v2')) {
        showToast({ type: 'info', title: 'Welcome to Resource Bank! 🎉', message: 'Now with AI-powered research intelligence. Add resources to get started.', duration: 7000 });
        localStorage.setItem('hasVisited_v2', 'true');
    }
    // Update API key button appearance based on whether key is saved
    updateApiKeyBtnState();
}

function updateApiKeyBtnState() {
    if (!el.apiKeyBtn) return;
    const hasKey = !!localStorage.getItem('rb_api_key');
    el.apiKeyBtn.title = hasKey ? 'AI Key Configured ✓ — Click to update' : 'Configure AI API Key';
    el.apiKeyBtn.style.color = hasKey ? 'var(--color-success)' : '';
    el.apiKeyBtn.style.borderColor = hasKey ? 'var(--color-success)' : '';
}

// ===============================================
// EVENT LISTENERS
// ===============================================

function setupEventListeners() {
    el.addBtn.addEventListener('click', openAddDrawer);
    el.searchInput.addEventListener('input', handleSearch);
    el.clearSearch.addEventListener('click', clearSearch);
    el.viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));
    el.sortBtn.addEventListener('click', toggleSortMenu);
    el.sortOptions.forEach(opt => opt.addEventListener('click', handleSort));
    el.exportBtn.addEventListener('click', exportData);
    el.importBtn.addEventListener('click', () => el.importFileInput.click());
    el.importFileInput.addEventListener('change', handleImport);
    el.digestBtn.addEventListener('click', openDigestPanel);
    el.themeToggle.addEventListener('click', toggleTheme);
    el.apiKeyBtn.addEventListener('click', promptForApiKey);

    el.drawerOverlay.addEventListener('click', (e) => { if (e.target === el.drawerOverlay) closeDrawer(); });
    el.drawerClose.addEventListener('click', closeDrawer);
    el.cancelBtn.addEventListener('click', closeDrawer);

    el.form.addEventListener('submit', handleSubmit);
    el.autoFillBtn.addEventListener('click', autoFillFromURL);
    el.resourceLink.addEventListener('input', debounce(handleURLInput, 600));
    el.resourceLink.addEventListener('blur', checkForDuplicates);
    el.description.addEventListener('input', updateCharCount);
    el.tagsInput.addEventListener('keydown', handleTagInput);
    el.tagSuggestions.forEach(btn => btn.addEventListener('click', () => addTag(btn.dataset.tag)));
    el.genDescBtn.addEventListener('click', generateDescription);
    el.genTagsBtn.addEventListener('click', generateTags);
    el.dismissDuplicate.addEventListener('click', () => { el.duplicateWarning.style.display = 'none'; });
    el.copyCitationBtn.addEventListener('click', copyCitation);

    el.confirmDeleteBtn.addEventListener('click', confirmDelete);
    el.cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    el.digestClose.addEventListener('click', closeDigestPanel);
    el.digestOverlay.addEventListener('click', (e) => { if (e.target === el.digestOverlay) closeDigestPanel(); });
    el.digestRunBtn.addEventListener('click', runDigestAnalysis);
    el.digestExportBtn.addEventListener('click', exportForNotebookLM);
    el.digestTabs.forEach(tab => tab.addEventListener('click', handleDigestTab));

    el.bulkExportBtn.addEventListener('click', exportSelected);
    el.bulkDeleteBtn.addEventListener('click', deleteSelected);
    el.bulkCancelBtn.addEventListener('click', exitSelectMode);

    document.addEventListener('click', (e) => {
        if (!el.sortBtn.contains(e.target) && !el.sortMenu.contains(e.target)) {
            el.sortMenu.classList.remove('active');
        }
    });

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
        } catch {
            state.resources = [];
            state.filteredResources = [];
        }
    }
}

function saveResources() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.resources));
        updateItemCount();
    } catch {
        showToast({ type: 'error', title: 'Save Failed', message: 'Storage might be full.' });
    }
}

function addToUndoStack(action) {
    state.undoStack.push({
        action,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(state.resources)),
    });
    if (state.undoStack.length > CONFIG.MAX_UNDO) state.undoStack.shift();
}

function undo() {
    if (state.undoStack.length === 0) return;
    const last = state.undoStack.pop();
    state.resources = last.data;
    saveResources();
    applyFilters();
    renderResources();
    showToast({ type: 'info', title: 'Undo Successful', message: `Reverted: ${last.action}` });
}

// ===============================================
// RESOURCE OPERATIONS
// ===============================================

function createResource(data) {
    return {
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
        insights: data.insights || [],
        summary: data.summary || '',
        metadata: data.metadata || {},
    };
}

function addResource(resource) {
    addToUndoStack('add resource');
    state.resources.unshift(resource);
    saveResources();
    applyFilters();
    renderResources();
    setTimeout(() => {
        const card = document.querySelector(`[data-id="${resource.id}"]`);
        if (card) { card.classList.add('highlight-new'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, 100);
    showToast({ type: 'success', title: 'Resource Added! ✨', message: `${resource.name} added to your library.`, actions: [{ label: 'Undo', action: undo }] });
}

function updateResource(index, data) {
    if (index < 0 || index >= state.resources.length) return;
    addToUndoStack('update resource');
    state.resources[index] = { ...state.resources[index], ...data, lastEdited: Date.now() };
    saveResources();
    applyFilters();
    renderResources();
    setTimeout(() => {
        const card = document.querySelector(`[data-id="${state.resources[index].id}"]`);
        if (card) { card.classList.add('highlight-edited'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, 100);
    showToast({ type: 'success', title: 'Resource Updated! 📝', message: `${data.name} updated.`, actions: [{ label: 'Undo', action: undo }] });
}

function deleteResource(index) {
    if (index < 0 || index >= state.resources.length) return;
    state.currentDeleteIndex = index;
    el.deleteOverlay.classList.add('visible');
}

function confirmDelete() {
    if (state.currentDeleteIndex === null) return;
    addToUndoStack('delete resource');
    const deleted = state.resources.splice(state.currentDeleteIndex, 1)[0];
    saveResources();
    applyFilters();
    renderResources();
    closeDeleteModal();
    showToast({ type: 'success', title: 'Deleted 🗑️', message: `${deleted.name} removed.`, actions: [{ label: 'Undo', action: undo }] });
    state.currentDeleteIndex = null;
}

function closeDeleteModal() {
    el.deleteOverlay.classList.remove('visible');
    state.currentDeleteIndex = null;
}

// ===============================================
// DRAWER
// ===============================================

function openAddDrawer() {
    state.currentEditIndex = -1;
    el.editIndex.value = -1;
    el.drawerTitle.textContent = 'Add Resource';
    el.submitButton.innerHTML = '<i class="fas fa-check"></i><span>Add Resource</span>';
    resetForm();
    openDrawer();
}

function openEditDrawer(index) {
    state.currentEditIndex = index;
    const r = state.resources[index];
    el.editIndex.value = index;
    el.drawerTitle.textContent = 'Edit Resource';
    el.submitButton.innerHTML = '<i class="fas fa-save"></i><span>Save Changes</span>';
    el.resourceLink.value = r.url;
    el.resourceName.value = r.name;
    el.description.value = r.description;
    el.favoriteCheckbox.checked = r.favorite;
    el.tagsDisplay.innerHTML = '';
    (r.tags || []).forEach(tag => renderTag(tag));
    if (r.insights && r.insights.length > 0) showInsights(r.insights);
    updateCharCount();
    generateCitation(r);
    openDrawer();
}

function openDrawer() {
    el.drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => el.resourceLink.focus(), 300);
}

function closeDrawer() {
    el.drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
}

function resetForm() {
    el.form.reset();
    el.tagsDisplay.innerHTML = '';
    el.urlPreview.classList.remove('active');
    el.urlPreview.innerHTML = '';
    el.insightsGroup.style.display = 'none';
    el.insightsDisplay.innerHTML = '';
    el.insightsData.value = '[]';
    el.citationPreview.style.display = 'none';
    el.citationText.textContent = '';
    el.duplicateWarning.style.display = 'none';
    clearErrors();
    updateCharCount();
}

function clearErrors() {
    [el.linkError, el.nameError, el.descriptionError].forEach(e => e.classList.remove('active'));
    [el.resourceLink, el.resourceName, el.description].forEach(e => e.classList.remove('input-error'));
}

// ===============================================
// FORM HANDLING
// ===============================================

async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const tags = Array.from(el.tagsDisplay.querySelectorAll('.tag-item')).map(t => t.textContent.replace('×', '').trim());
    let insightsArr = [];
    try { insightsArr = JSON.parse(el.insightsData.value || '[]'); } catch {}

    const data = {
        name: el.resourceName.value.trim(),
        url: el.resourceLink.value.trim(),
        description: el.description.value.trim(),
        tags,
        favorite: el.favoriteCheckbox.checked,
        favicon: getFavicon(el.resourceLink.value.trim()),
        insights: insightsArr,
    };

    try {
        const colorData = await getDominantColor(data.url);
        if (colorData) data.dominantColor = colorData;
    } catch {}

    const editIndex = parseInt(el.editIndex.value);
    if (editIndex >= 0) updateResource(editIndex, data);
    else { const r = createResource(data); addResource(r); }
    closeDrawer();
}

function validateForm() {
    clearErrors();
    let valid = true;
    const url = el.resourceLink.value.trim();
    if (!url) { showError(el.linkError, el.resourceLink, 'URL is required'); valid = false; }
    else if (!isValidURL(url)) { showError(el.linkError, el.resourceLink, 'Please enter a valid URL (include https://)'); valid = false; }
    const name = el.resourceName.value.trim();
    if (!name) { showError(el.nameError, el.resourceName, 'Resource name is required'); valid = false; }
    const desc = el.description.value.trim();
    if (!desc) { showError(el.descriptionError, el.description, 'Description is required'); valid = false; }
    return valid;
}

function showError(errorEl, inputEl, msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('active');
    inputEl.classList.add('input-error');
}

function updateCharCount() {
    const count = el.description.value.length;
    el.charCount.textContent = count;
    el.charCount.style.color = count > 450 ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
}

// ===============================================
// AUTO-FILL & METADATA
// ===============================================

async function handleURLInput() {
    const url = el.resourceLink.value.trim();
    if (!url || !isValidURL(url)) { el.urlPreview.classList.remove('active'); return; }
    el.urlPreview.classList.add('active');
    el.urlPreview.innerHTML = '<div class="url-preview-content"><i class="fas fa-spinner fa-spin"></i> Fetching preview…</div>';
    try {
        const meta = await fetchMetadata(url);
        if (meta) displayURLPreview(meta);
    } catch { el.urlPreview.classList.remove('active'); }
}

async function autoFillFromURL() {
    const url = el.resourceLink.value.trim();
    if (!url || !isValidURL(url)) { showToast({ type: 'error', title: 'Invalid URL', message: 'Please enter a valid URL first.' }); return; }
    el.autoFillBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    el.autoFillBtn.disabled = true;
    try {
        const meta = await fetchMetadata(url);
        if (meta) {
            if (meta.title && !el.resourceName.value) el.resourceName.value = meta.title;
            if (meta.description && !el.description.value) { el.description.value = meta.description; updateCharCount(); }
            showToast({ type: 'success', title: 'Auto-filled! ✨', message: 'Metadata fetched from the URL.' });
            generateCitation({ name: el.resourceName.value, url });
        }
    } catch { showToast({ type: 'error', title: 'Auto-fill Failed', message: 'Could not fetch metadata.' }); }
    finally { el.autoFillBtn.innerHTML = '<i class="fas fa-magic"></i>'; el.autoFillBtn.disabled = false; }
}

async function fetchMetadata(url) {
    try {
        const res = await fetch(`${CONFIG.MICROLINK_API}?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.status === 'success' && data.data) {
            return { title: data.data.title || '', description: data.data.description || '', image: data.data.image?.url || '', favicon: data.data.logo?.url || '' };
        }
    } catch {}
    return null;
}

function displayURLPreview(meta) {
    const favicon = meta.favicon || getFavicon(el.resourceLink.value);
    el.urlPreview.innerHTML = `
        <div class="url-preview-content">
            <img src="${favicon}" alt="" class="url-preview-favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2218%22 font-size=%2218%22>🔗</text></svg>'">
            <div class="url-preview-text">
                <h4>${meta.title || 'No title'}</h4>
                <p>${meta.description ? meta.description.substring(0, 120) + '…' : 'No description'}</p>
            </div>
        </div>`;
}

function getFavicon(url) {
    try { return `${CONFIG.ICONHORSE_API}${new URL(url).hostname}`; }
    catch { return ''; }
}

async function getDominantColor(url) {
    try {
        const res = await fetch(`${CONFIG.MICROLINK_API}?url=${encodeURIComponent(url)}&palette=true`);
        const data = await res.json();
        if (data.status === 'success' && data.data.palette) return data.data.palette[0] || '#667eea';
    } catch {}
    return '#667eea';
}

// ===============================================
// AI FEATURE 1 — AUTO TAG SUGGESTION
// ===============================================

async function generateTags() {
    const name = el.resourceName.value.trim();
    const desc = el.description.value.trim();
    const url = el.resourceLink.value.trim();

    if (!name && !desc && !url) {
        showToast({ type: 'warning', title: 'Not enough info', message: 'Add a URL, name, or description first.' });
        return;
    }

    el.genTagsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking…';
    el.genTagsBtn.disabled = true;

    try {
        const prompt = `You are a research librarian. Based on the following resource details, suggest 4-6 concise, useful tags (single words or short phrases, title-case). Return ONLY a JSON array of strings, nothing else.

Resource Name: ${name || 'Unknown'}
URL: ${url || 'Unknown'}
Description: ${desc || 'Not provided'}

Existing tags in library: ${Array.from(state.tags).join(', ') || 'none'}

Return format: ["Tag1", "Tag2", "Tag3", "Tag4"]`;

        const tags = await callClaude(prompt, 200);
        let parsed = [];
        try { parsed = JSON.parse(tags.trim()); } catch { parsed = tags.split(',').map(t => t.trim().replace(/['"[\]]/g, '')).filter(Boolean); }

        if (parsed.length > 0) {
            parsed.forEach(tag => { if (tag) addTag(tag); });
            showToast({ type: 'success', title: 'Tags suggested! 🏷️', message: `${parsed.length} tags added. Remove any you don't need.` });
        }
    } catch (err) {
        showToast({ type: 'error', title: 'AI unavailable', message: 'Could not generate tags. Check your API key.' });
    } finally {
        el.genTagsBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> AI Suggest';
        el.genTagsBtn.disabled = false;
    }
}

// ===============================================
// AI FEATURE 2 — DESCRIPTION GENERATION
// ===============================================

async function generateDescription() {
    const name = el.resourceName.value.trim();
    const url = el.resourceLink.value.trim();

    if (!name && !url) {
        showToast({ type: 'warning', title: 'Need more info', message: 'Add a URL or resource name first.' });
        return;
    }

    el.genDescBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Writing…';
    el.genDescBtn.disabled = true;

    try {
        let contextStr = `Resource Name: ${name || 'Unknown'}\nURL: ${url || 'Unknown'}`;

        // Try to get metadata to give AI more context
        if (url && isValidURL(url)) {
            try {
                const meta = await fetchMetadata(url);
                if (meta && meta.description) contextStr += `\nPage Description: ${meta.description}`;
                if (meta && meta.title) contextStr += `\nPage Title: ${meta.title}`;
            } catch {}
        }

        const prompt = `You are helping a researcher document their resources. Write a clear, informative 2-3 sentence description for this resource that explains what it is, what it covers, and why it would be useful. Be specific and concise. Do NOT include the URL in the description. Return only the description text, no quotes or preamble.

${contextStr}`;

        const desc = await callClaude(prompt, 300);
        if (desc) {
            el.description.value = desc.trim();
            updateCharCount();
            showToast({ type: 'success', title: 'Description generated! ✍️', message: 'Review and edit as needed.' });
        }
    } catch {
        showToast({ type: 'error', title: 'AI unavailable', message: 'Could not generate description. Check your API key.' });
    } finally {
        el.genDescBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> AI Generate';
        el.genDescBtn.disabled = false;
    }
}

// ===============================================
// AI FEATURE 3 — DUPLICATE DETECTION
// ===============================================

async function checkForDuplicates() {
    const url = el.resourceLink.value.trim();
    if (!url || !isValidURL(url) || state.resources.length === 0) return;

    const editIdx = parseInt(el.editIndex.value);
    const hostname = getDomain(url);

    // 1. Exact URL match
    const exactMatch = state.resources.find((r, i) => i !== editIdx && r.url === url);
    if (exactMatch) {
        showDuplicateWarning(`Exact match: "${exactMatch.name}" already exists.`);
        return;
    }

    // 2. Same domain match
    const domainMatches = state.resources.filter((r, i) => i !== editIdx && getDomain(r.url) === hostname);
    if (domainMatches.length >= 2) {
        showDuplicateWarning(`You already have ${domainMatches.length} resources from ${hostname}. Check: ${domainMatches.slice(0, 2).map(r => `"${r.name}"`).join(', ')}.`);
        return;
    }

    // 3. AI semantic similarity check (only if library is small enough to be fast)
    if (state.resources.length > 0 && state.resources.length <= 50) {
        const name = el.resourceName.value.trim();
        const desc = el.description.value.trim();
        if (!name && !desc) return;

        try {
            const librarySnippet = state.resources
                .filter((r, i) => i !== editIdx)
                .slice(0, 20)
                .map(r => `"${r.name}": ${r.description.substring(0, 80)}`)
                .join('\n');

            const prompt = `A researcher is adding this resource:
Name: ${name || 'Unknown'}
URL: ${url}
Description: ${desc || 'Not yet written'}

Their existing library contains:
${librarySnippet}

Is there a very similar (not just same-domain) resource already in their library? Answer with ONLY: "yes: [reason under 15 words]" or "no". Be strict - only flag genuine near-duplicates.`;

            const result = await callClaude(prompt, 60);
            if (result && result.toLowerCase().startsWith('yes:')) {
                const reason = result.substring(4).trim();
                showDuplicateWarning(`Possible duplicate: ${reason}`);
            }
        } catch {} // Silently fail — duplicate check is optional
    }
}

function showDuplicateWarning(message) {
    el.duplicateDetail.textContent = message;
    el.duplicateWarning.style.display = 'flex';
}

// ===============================================
// AI FEATURE 4 — KEY INSIGHT EXTRACTION
// ===============================================

async function extractInsights(name, description, url) {
    if (!description || description.length < 50) return [];

    try {
        const prompt = `Extract 3-4 key insights or takeaways from this research resource. Each insight should be a single clear sentence. Return ONLY a JSON array of strings.

Resource: ${name}
Description: ${description}

Return format: ["Insight 1", "Insight 2", "Insight 3"]`;

        const result = await callClaude(prompt, 300);
        let parsed = [];
        try { parsed = JSON.parse(result.trim()); } catch {
            parsed = result.split('\n').filter(l => l.trim()).map(l => l.replace(/^[-*\d."]+\s*/, '').trim()).filter(Boolean);
        }
        return parsed.slice(0, 4);
    } catch { return []; }
}

function showInsights(insights) {
    if (!insights || insights.length === 0) { el.insightsGroup.style.display = 'none'; return; }
    el.insightsGroup.style.display = 'block';
    el.insightsDisplay.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <i class="fas fa-lightbulb"></i>
            <span>${insight}</span>
        </div>`).join('');
    el.insightsData.value = JSON.stringify(insights);
}

// ===============================================
// AI FEATURE 5 — CITATION GENERATION
// ===============================================

function generateCitation(resource) {
    if (!resource || !resource.url) { el.citationPreview.style.display = 'none'; return; }
    const date = new Date();
    const accessed = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = resource.name || el.resourceName.value || 'Untitled Resource';
    const domain = getDomain(resource.url);

    const citation = `${name}. Retrieved ${accessed}, from ${resource.url} [${domain}]`;
    el.citationText.textContent = citation;
    el.citationPreview.style.display = 'block';
}

function copyCitation() {
    const text = el.citationText.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast({ type: 'success', title: 'Citation copied! 📋', message: 'Paste it into your document.' });
    });
}

// ===============================================
// AI FEATURE 6 — WEEKLY DIGEST / RESEARCH INTELLIGENCE
// ===============================================

function openDigestPanel() {
    if (state.resources.length === 0) {
        showToast({ type: 'warning', title: 'No resources yet', message: 'Add some resources before running analysis.' });
        return;
    }
    el.digestOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (!state.digestData) {
        el.digestContent.innerHTML = `
            <div class="digest-empty">
                <div class="digest-empty-icon">🧠</div>
                <h3>Ready to analyse your library</h3>
                <p>Click "Generate Analysis" to have AI extract themes, identify research gaps, surface contradictions, and cluster your ${state.resources.length} resources.</p>
            </div>`;
    } else {
        renderDigestTab(state.activeDigestTab);
    }
}

function closeDigestPanel() {
    el.digestOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function handleDigestTab(e) {
    const tab = e.currentTarget.dataset.tab;
    state.activeDigestTab = tab;
    el.digestTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (state.digestData) renderDigestTab(tab);
}

async function runDigestAnalysis() {
    if (state.resources.length === 0) return;

    el.digestLoading.style.display = 'flex';
    el.digestContent.innerHTML = '';
    el.digestRunBtn.disabled = true;
    el.digestRunBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analysing…';

    try {
        const libraryText = state.resources.map((r, i) =>
            `[${i + 1}] Title: ${r.name}\nURL: ${r.url}\nTags: ${(r.tags || []).join(', ') || 'none'}\nDescription: ${r.description}`
        ).join('\n\n---\n\n');

        const prompt = `You are a research analyst. Analyse this research library and return a structured JSON response with these exact keys:

1. "summary": A 2-3 sentence overview of the entire library's focus and breadth.
2. "themes": Array of objects [{name, description, resourceIndices}] — 3-6 main themes (resourceIndices are 1-based).
3. "clusters": Array of objects [{label, resources, insight}] — group similar resources (use resource titles).
4. "keyInsights": Array of 5-8 strings — the most important takeaways across all resources.
5. "contradictions": Array of strings — any contradictory viewpoints or conflicting information found.
6. "gaps": Array of strings — 4-6 research gaps or topics notably missing from this library.
7. "recommendations": Array of strings — 3-5 next research directions.

Library (${state.resources.length} resources):
${libraryText}

Return ONLY valid JSON, no markdown, no preamble.`;

        const result = await callClaude(prompt, 2000);
        let data = null;
        try {
            const clean = result.replace(/```json|```/g, '').trim();
            data = JSON.parse(clean);
        } catch {
            // Try to extract JSON from the response
            const match = result.match(/\{[\s\S]*\}/);
            if (match) {
                try { data = JSON.parse(match[0]); } catch {}
            }
        }

        if (!data) throw new Error('Invalid response from AI');

        state.digestData = data;
        el.digestLoading.style.display = 'none';
        renderDigestTab(state.activeDigestTab);
        showToast({ type: 'success', title: 'Analysis complete! 🧠', message: 'Your research intelligence report is ready.' });
    } catch (err) {
        el.digestLoading.style.display = 'none';
        el.digestContent.innerHTML = `
            <div class="digest-error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Analysis Failed</h3>
                <p>Could not connect to AI. Make sure your API key is configured in the app settings, or check your network connection.</p>
                <p class="error-detail">${err.message}</p>
            </div>`;
    } finally {
        el.digestRunBtn.disabled = false;
        el.digestRunBtn.innerHTML = '<i class="fas fa-play"></i> Generate Analysis';
    }
}

function renderDigestTab(tab) {
    const d = state.digestData;
    if (!d) return;

    switch (tab) {
        case 'overview':
            el.digestContent.innerHTML = `
                <div class="digest-section">
                    <div class="digest-summary-card">
                        <h3><i class="fas fa-book-open"></i> Library Overview</h3>
                        <p>${d.summary || 'No summary available.'}</p>
                    </div>
                    <h4 class="digest-subtitle"><i class="fas fa-lightbulb"></i> Key Insights Across Your Library</h4>
                    <div class="insights-grid">
                        ${(d.keyInsights || []).map(i => `<div class="insight-card">${i}</div>`).join('')}
                    </div>
                    ${d.recommendations && d.recommendations.length > 0 ? `
                    <h4 class="digest-subtitle"><i class="fas fa-compass"></i> Recommended Next Steps</h4>
                    <div class="recs-list">
                        ${d.recommendations.map((r, i) => `<div class="rec-item"><span class="rec-num">${i + 1}</span><p>${r}</p></div>`).join('')}
                    </div>` : ''}
                </div>`;
            break;

        case 'clusters':
            el.digestContent.innerHTML = `
                <div class="digest-section">
                    <h4 class="digest-subtitle"><i class="fas fa-layer-group"></i> Thematic Clusters</h4>
                    <div class="clusters-grid">
                        ${(d.themes || []).map((t, i) => `
                            <div class="cluster-card" style="--cluster-hue: ${(i * 60) % 360}">
                                <div class="cluster-name">${t.name}</div>
                                <p class="cluster-desc">${t.description || ''}</p>
                                ${t.resourceIndices ? `<div class="cluster-count">${t.resourceIndices.length} resource${t.resourceIndices.length !== 1 ? 's' : ''}</div>` : ''}
                            </div>`).join('')}
                    </div>
                    ${d.clusters && d.clusters.length > 0 ? `
                    <h4 class="digest-subtitle" style="margin-top:var(--space-8)"><i class="fas fa-sitemap"></i> Resource Groupings</h4>
                    <div class="groupings-list">
                        ${d.clusters.map(c => `
                            <div class="grouping-item">
                                <div class="grouping-label">${c.label}</div>
                                <p class="grouping-insight">${c.insight || ''}</p>
                                <div class="grouping-resources">${(c.resources || []).map(r => `<span class="grouping-res-tag">${r}</span>`).join('')}</div>
                            </div>`).join('')}
                    </div>` : ''}
                </div>`;
            break;

        case 'insights':
            el.digestContent.innerHTML = `
                <div class="digest-section">
                    <h4 class="digest-subtitle"><i class="fas fa-lightbulb"></i> Extracted Insights</h4>
                    <div class="insights-full-list">
                        ${(d.keyInsights || []).map((ins, i) => `
                            <div class="insight-full-item">
                                <div class="insight-num">${i + 1}</div>
                                <p>${ins}</p>
                            </div>`).join('')}
                    </div>
                    ${d.contradictions && d.contradictions.length > 0 ? `
                    <h4 class="digest-subtitle" style="margin-top:var(--space-8)"><i class="fas fa-balance-scale"></i> Contradictions & Tensions</h4>
                    <div class="contradictions-list">
                        ${d.contradictions.map(c => `<div class="contradiction-item"><i class="fas fa-arrows-left-right"></i><p>${c}</p></div>`).join('')}
                    </div>` : ''}
                </div>`;
            break;

        case 'gaps':
            el.digestContent.innerHTML = `
                <div class="digest-section">
                    <h4 class="digest-subtitle"><i class="fas fa-search-minus"></i> Research Gaps Identified</h4>
                    <p class="digest-intro">Topics and angles missing from your current library:</p>
                    <div class="gaps-list">
                        ${(d.gaps || []).map((g, i) => `
                            <div class="gap-item">
                                <div class="gap-icon"><i class="fas fa-plus-circle"></i></div>
                                <div>
                                    <p>${g}</p>
                                </div>
                            </div>`).join('')}
                    </div>
                    ${d.recommendations && d.recommendations.length > 0 ? `
                    <h4 class="digest-subtitle" style="margin-top:var(--space-8)"><i class="fas fa-road"></i> Research Directions</h4>
                    <div class="recs-list">
                        ${d.recommendations.map((r, i) => `<div class="rec-item"><span class="rec-num">${i + 1}</span><p>${r}</p></div>`).join('')}
                    </div>` : ''}
                </div>`;
            break;

        case 'export-ai':
            const exportText = buildNotebookLMExport();
            el.digestContent.innerHTML = `
                <div class="digest-section">
                    <h4 class="digest-subtitle"><i class="fas fa-file-arrow-down"></i> AI-Ready Export</h4>
                    <p class="digest-intro">Copy this structured export to paste into NotebookLM, ChatGPT, or any AI tool as context:</p>
                    <div class="export-preview">
                        <pre id="export-text-content">${exportText}</pre>
                    </div>
                    <div class="export-actions">
                        <button class="digest-run-btn" onclick="copyExportText()"><i class="fas fa-copy"></i> Copy to Clipboard</button>
                        <button class="digest-run-btn secondary" onclick="downloadExportText()"><i class="fas fa-download"></i> Download .txt</button>
                    </div>
                </div>`;
            break;
    }
}

// ===============================================
// AI FEATURE 7 — EXPORT FOR AI TOOLS
// ===============================================

function buildNotebookLMExport() {
    const header = `# Research Library Export
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Total Resources: ${state.resources.length}

`;

    const body = state.resources.map((r, i) => `## Resource ${i + 1}: ${r.name}
URL: ${r.url}
Tags: ${(r.tags || []).join(', ') || 'None'}
Added: ${new Date(r.dateAdded).toLocaleDateString()}
${r.favorite ? '★ Favorite' : ''}

${r.description}
${r.insights && r.insights.length > 0 ? '\nKey Insights:\n' + r.insights.map(ins => `- ${ins}`).join('\n') : ''}
`).join('\n---\n\n');

    const analysisSection = state.digestData ? `\n\n# AI Analysis Summary

## Library Overview
${state.digestData.summary || ''}

## Key Themes
${(state.digestData.themes || []).map(t => `- ${t.name}: ${t.description}`).join('\n')}

## Research Gaps
${(state.digestData.gaps || []).map(g => `- ${g}`).join('\n')}
` : '';

    return header + body + analysisSection;
}

function exportForNotebookLM() {
    const content = buildNotebookLMExport();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-library-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Exported! 📄', message: 'Ready to upload to NotebookLM or any AI tool.' });
}

window.copyExportText = function() {
    const text = document.getElementById('export-text-content')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        showToast({ type: 'success', title: 'Copied! 📋', message: 'Paste into your AI tool.' });
    });
};

window.downloadExportText = function() {
    exportForNotebookLM();
};

// ===============================================
// CLAUDE API HELPER
// ===============================================

// ===============================================
// CLAUDE API — routes through /api/ai serverless function
// The API key lives in ANTHROPIC_API_KEY env var on Vercel/Netlify.
// For local development only, a key can be stored in localStorage.
// ===============================================

async function callClaude(prompt, maxTokens = 500) {
    // 1. Try the server-side proxy first (Vercel / Netlify deployment)
    try {
        const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, maxTokens }),
        });

        // If the endpoint exists (deployed) use it
        if (res.status !== 404) {
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Server error ${res.status}`);
            }
            const data = await res.json();
            return data.text || '';
        }
        // 404 means we're running locally without the serverless function — fall through
    } catch (err) {
        // Network errors on the proxy call: rethrow unless it's a "not found" situation
        if (!err.message.includes('404') && !err.message.includes('Failed to fetch')) {
            throw err;
        }
    }

    // 2. Fallback: direct browser call with user-supplied key (local dev only)
    const apiKey = localStorage.getItem('rb_api_key');
    if (!apiKey) {
        promptForApiKey();
        throw new Error('No API key. Configure one for local development.');
    }

    const response = await fetch(CONFIG.ANTHROPIC_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: CONFIG.CLAUDE_MODEL,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 401) {
            localStorage.removeItem('rb_api_key');
            updateApiKeyBtnState();
            throw new Error('Invalid API key. Click the 🔑 button to update it.');
        }
        throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    return (data.content || []).find(c => c.type === 'text')?.text || '';
}

function getApiKey() {
    return localStorage.getItem('rb_api_key') || '';
}

function promptForApiKey() {
    // Remove stale modal if present
    const stale = document.getElementById('api-key-modal');
    if (stale) stale.remove();

    const modal = document.createElement('div');
    modal.id = 'api-key-modal';
    modal.style.cssText = [
        'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.65)',
        'backdrop-filter:blur(8px)', 'display:flex', 'align-items:center',
        'justify-content:center', 'z-index:9999'
    ].join(';');

    modal.innerHTML = `
        <div style="background:var(--color-surface);border-radius:var(--radius-xl);
                    padding:2rem;max-width:460px;width:90%;box-shadow:var(--shadow-2xl);">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
                <span style="font-size:1.8rem">🔑</span>
                <h3 style="font-family:var(--font-display);font-size:1.25rem;font-weight:800;margin:0;color:var(--color-text-primary)">
                    Local Dev — API Key Required
                </h3>
            </div>
            <p style="color:var(--color-text-secondary);font-size:.875rem;margin-bottom:.5rem;line-height:1.6">
                On <strong>Vercel / Netlify</strong>, set <code style="background:var(--color-border-light);padding:2px 6px;border-radius:4px;font-size:.8rem">ANTHROPIC_API_KEY</code>
                as an environment variable — users won't need to enter anything.
            </p>
            <p style="color:var(--color-text-secondary);font-size:.875rem;margin-bottom:1rem;line-height:1.6">
                For <strong>local development</strong>, enter your key below. It stays in your browser only.
            </p>
            <a href="https://console.anthropic.com/keys" target="_blank" rel="noopener"
               style="color:var(--color-ai);font-size:.875rem;font-weight:600;display:inline-block;margin-bottom:1rem;text-decoration:none">
               Get a key at console.anthropic.com →
            </a>
            <input type="password" id="api-key-input" placeholder="sk-ant-api03-..."
                style="width:100%;padding:.75rem 1rem;border:2px solid var(--color-border);
                       border-radius:.5rem;background:var(--color-surface);color:var(--color-text-primary);
                       font-size:.875rem;font-family:var(--font-body);margin-bottom:1rem;
                       box-sizing:border-box;outline:none;">
            <div style="display:flex;gap:.75rem">
                <button id="api-key-save"
                    style="flex:1;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;
                           border:none;padding:.75rem 1rem;border-radius:.5rem;cursor:pointer;
                           font-weight:600;font-family:var(--font-body);font-size:.875rem">
                    Save Key
                </button>
                <button id="api-key-cancel"
                    style="background:var(--color-surface);border:2px solid var(--color-border);
                           color:var(--color-text-primary);padding:.75rem 1rem;border-radius:.5rem;
                           cursor:pointer;font-weight:600;font-family:var(--font-body);font-size:.875rem">
                    Cancel
                </button>
            </div>
            <p style="color:var(--color-text-tertiary);font-size:.75rem;margin-top:.75rem;line-height:1.5">
                🔒 Stored in <code>localStorage</code> only. Never transmitted except to Anthropic's API.
            </p>
        </div>`;

    document.body.appendChild(modal);

    const input = modal.querySelector('#api-key-input');
    setTimeout(() => input.focus(), 50);

    modal.querySelector('#api-key-save').addEventListener('click', () => {
        const key = input.value.trim();
        if (!key || !key.startsWith('sk-ant-')) {
            input.style.borderColor = 'var(--color-error)';
            return;
        }
        localStorage.setItem('rb_api_key', key);
        modal.remove();
        updateApiKeyBtnState();
        showToast({ type: 'success', title: 'Key saved! 🔑', message: 'AI features are now active. Try your request again.' });
    });

    modal.querySelector('#api-key-cancel').addEventListener('click', () => modal.remove());

    input.addEventListener('keydown', (e) => {
        input.style.borderColor = '';
        if (e.key === 'Enter') modal.querySelector('#api-key-save').click();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ===============================================
// TAGS
// ===============================================

function handleTagInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = el.tagsInput.value.trim();
        if (tag) { addTag(tag); el.tagsInput.value = ''; }
    }
}

function addTag(tagName) {
    const existing = Array.from(el.tagsDisplay.querySelectorAll('.tag-item')).map(t => t.textContent.replace('×', '').trim());
    if (existing.includes(tagName)) return;
    renderTag(tagName);
}

function renderTag(tagName) {
    const tagEl = document.createElement('div');
    tagEl.className = 'tag-item';
    tagEl.innerHTML = `${tagName}<button type="button" class="tag-remove">×</button>`;
    tagEl.querySelector('.tag-remove').addEventListener('click', () => tagEl.remove());
    el.tagsDisplay.appendChild(tagEl);
}

function extractAllTags() {
    state.tags.clear();
    state.resources.forEach(r => (r.tags || []).forEach(t => state.tags.add(t)));
    renderFilterTags();
}

function renderFilterTags() {
    el.filterTags.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-filter' + (state.currentFilter === 'all' ? ' active' : '');
    allBtn.dataset.tag = 'all';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => filterByTag('all'));
    el.filterTags.appendChild(allBtn);

    const favBtn = document.createElement('button');
    favBtn.className = 'tag-filter' + (state.currentFilter === '__favorites__' ? ' active' : '');
    favBtn.dataset.tag = '__favorites__';
    favBtn.innerHTML = '⭐ Favorites';
    favBtn.addEventListener('click', () => filterByTag('__favorites__'));
    el.filterTags.appendChild(favBtn);

    Array.from(state.tags).sort().forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-filter' + (state.currentFilter === tag ? ' active' : '');
        btn.dataset.tag = tag;
        btn.textContent = tag;
        btn.addEventListener('click', () => filterByTag(tag));
        el.filterTags.appendChild(btn);
    });
}

function filterByTag(tag) {
    state.currentFilter = tag;
    renderFilterTags();
    applyFilters();
    renderResources();
}

// ===============================================
// SEARCH & FILTER
// ===============================================

function handleSearch(e) {
    state.searchQuery = e.target.value.trim().toLowerCase();
    el.clearSearch.style.display = state.searchQuery ? 'block' : 'none';
    applyFilters();
    renderResources();
}

function clearSearch() {
    el.searchInput.value = '';
    state.searchQuery = '';
    el.clearSearch.style.display = 'none';
    applyFilters();
    renderResources();
}

function applyFilters() {
    let filtered = [...state.resources];

    if (state.currentFilter === '__favorites__') {
        filtered = filtered.filter(r => r.favorite);
    } else if (state.currentFilter !== 'all') {
        filtered = filtered.filter(r => (r.tags || []).includes(state.currentFilter));
    }

    if (state.searchQuery) {
        filtered = filtered.filter(r =>
            r.name.toLowerCase().includes(state.searchQuery) ||
            r.description.toLowerCase().includes(state.searchQuery) ||
            r.url.toLowerCase().includes(state.searchQuery) ||
            (r.tags || []).some(t => t.toLowerCase().includes(state.searchQuery)) ||
            (r.insights || []).some(ins => ins.toLowerCase().includes(state.searchQuery))
        );
    }

    applySorting(filtered);
    state.filteredResources = filtered;
}

function applySorting(resources) {
    switch (state.currentSort) {
        case 'date-desc': resources.sort((a, b) => b.dateAdded - a.dateAdded); break;
        case 'date-asc': resources.sort((a, b) => a.dateAdded - b.dateAdded); break;
        case 'name-asc': resources.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': resources.sort((a, b) => b.name.localeCompare(a.name)); break;
        case 'edited': resources.sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0)); break;
    }
    resources.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
}

// ===============================================
// SORTING
// ===============================================

function toggleSortMenu() { el.sortMenu.classList.toggle('active'); }

function handleSort(e) {
    const sortType = e.currentTarget.dataset.sort;
    state.currentSort = sortType;
    el.sortOptions.forEach(o => o.classList.toggle('active', o.dataset.sort === sortType));
    el.sortMenu.classList.remove('active');
    applyFilters();
    renderResources();
}

// ===============================================
// VIEW MANAGEMENT
// ===============================================

function handleViewChange(e) {
    const view = e.currentTarget.dataset.view;
    state.currentView = view;
    el.viewBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    el.itemsSection.classList.remove('list-view', 'compact-view');
    if (view === 'list') el.itemsSection.classList.add('list-view');
    else if (view === 'compact') el.itemsSection.classList.add('compact-view');
}

// ===============================================
// RENDERING
// ===============================================

function renderResources() {
    el.itemsSection.innerHTML = '';
    if (state.filteredResources.length === 0) { renderEmptyState(); return; }

    state.filteredResources.forEach((resource, index) => {
        el.itemsSection.appendChild(createResourceCard(resource, index));
    });

    if (typeof gsap !== 'undefined') {
        gsap.from('.resource-card', { opacity: 0, y: 20, stagger: 0.04, duration: 0.35, ease: 'power2.out' });
    }

    updateItemCount();
    extractAllTags();
}

function createResourceCard(resource, index) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.dataset.id = resource.id;
    card.dataset.index = index;
    if (resource.favorite) card.classList.add('favorite');
    if (state.isSelectMode) card.classList.add('select-mode');

    const now = Date.now();
    const dayMs = 86400000;
    let statusBadge = '';
    if (resource.dateAdded && (now - resource.dateAdded) < dayMs * 7) statusBadge = '<span class="status-badge new"><i class="fas fa-star"></i> New</span>';
    else if (resource.lastEdited && (now - resource.lastEdited) < dayMs) statusBadge = '<span class="status-badge edited"><i class="fas fa-pen"></i> Edited</span>';

    const favicon = resource.favicon || getFavicon(resource.url);
    const tags = (resource.tags || []).map(t => `<span class="card-tag" data-tag="${t}">${t}</span>`).join('');
    const date = new Date(resource.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const insightsBadge = (resource.insights && resource.insights.length > 0)
        ? `<span class="ai-insights-badge" data-id="${resource.id}"><i class="fas fa-lightbulb"></i> ${resource.insights.length} insight${resource.insights.length > 1 ? 's' : ''}</span>`
        : '';

    card.innerHTML = `
        ${state.isSelectMode ? `<input type="checkbox" class="card-select-checkbox" data-index="${index}">` : ''}
        <div class="card-header">
            <img src="${favicon}" alt="" class="card-favicon" onerror="this.style.display='none'">
            <div class="card-title-section">
                <a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="card-title-link" title="${resource.name}">${resource.name}</a>
                <div class="card-url">${getDomain(resource.url)}</div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn share" title="Share" data-action="share" data-index="${index}"><i class="fas fa-share-alt"></i></button>
                <button class="card-action-btn cite" title="Copy Citation" data-action="cite" data-index="${index}"><i class="fas fa-quote-left"></i></button>
                <button class="card-action-btn edit" title="Edit" data-action="edit" data-index="${index}"><i class="fas fa-edit"></i></button>
                <button class="card-action-btn delete" title="Delete" data-action="delete" data-index="${index}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="card-description">${resource.description}</div>
        ${resource.insights && resource.insights.length > 0 ? `
        <div class="card-insights-preview collapsed" id="insights-preview-${resource.id}">
            ${resource.insights.map(ins => `<div class="card-insight-item"><i class="fas fa-lightbulb"></i><span>${ins}</span></div>`).join('')}
        </div>` : ''}
        <div class="card-footer">
            <div class="card-meta">
                ${insightsBadge}
                ${statusBadge}
                <span class="card-date"><i class="far fa-calendar"></i> ${date}</span>
            </div>
            <div class="card-tags">${tags || '<span class="card-tags-empty">No tags</span>'}</div>
        </div>`;

    if (resource.dominantColor) card.style.setProperty('--card-accent', resource.dominantColor);

    // Event delegation on card
    card.addEventListener('click', handleCardClick);
    return card;
}

function handleCardClick(e) {
    const btn = e.target.closest('[data-action]');
    const tag = e.target.closest('.card-tag');
    const insightBadge = e.target.closest('.ai-insights-badge');

    if (btn) {
        e.preventDefault();
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        if (action === 'share') shareResource(index);
        else if (action === 'cite') quickCiteResource(index);
        else if (action === 'edit') editResource(index);
        else if (action === 'delete') deleteResource(index);
    } else if (tag) {
        e.preventDefault();
        filterByTag(tag.dataset.tag);
    } else if (insightBadge) {
        e.preventDefault();
        const id = insightBadge.dataset.id;
        const preview = document.getElementById(`insights-preview-${id}`);
        if (preview) preview.classList.toggle('collapsed');
    } else if (state.isSelectMode) {
        const index = parseInt(e.currentTarget.dataset.index);
        toggleSelect(index);
        const checkbox = e.currentTarget.querySelector('.card-select-checkbox');
        if (checkbox) checkbox.checked = state.selectedItems.has(index);
    }
}

function renderEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-state';
    const hasFilter = state.searchQuery || state.currentFilter !== 'all';
    div.innerHTML = hasFilter ? `
        <div class="empty-icon">🔍</div>
        <h2>No Results Found</h2>
        <p>Try adjusting your search or filters</p>
        <div class="empty-actions">
            <button class="empty-action-btn" onclick="clearAllFilters()"><i class="fas fa-times"></i> Clear Filters</button>
        </div>` : `
        <div class="empty-icon">📚</div>
        <h2>Start Your Research Library</h2>
        <p>Add resources, get AI-powered insights, identify research gaps, and export to your favourite AI tools.</p>
        <div class="empty-actions">
            <button class="empty-action-btn primary" onclick="openAddDrawer()"><i class="fas fa-plus"></i> Add First Resource</button>
            <button class="empty-action-btn" onclick="triggerImport()"><i class="fas fa-upload"></i> Import Resources</button>
        </div>`;
    el.itemsSection.appendChild(div);
}

function updateItemCount() { el.itemCount.textContent = state.resources.length; }

// ===============================================
// EXPORT / IMPORT
// ===============================================

function exportData() {
    if (state.resources.length === 0) { showToast({ type: 'warning', title: 'Nothing to Export', message: 'Add resources first.' }); return; }
    const data = { version: '2.0', exportDate: new Date().toISOString(), resources: state.resources };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `resource-bank-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Exported! 📦', message: `Exported ${state.resources.length} resources.` });
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.resources && Array.isArray(data.resources)) {
                addToUndoStack('import resources');
                data.resources.forEach(r => { if (!r.id) r.id = generateId(); state.resources.push(r); });
                saveResources(); applyFilters(); renderResources();
                showToast({ type: 'success', title: 'Imported! 📥', message: `Imported ${data.resources.length} resources.`, actions: [{ label: 'Undo', action: undo }] });
            } else throw new Error('Invalid format');
        } catch { showToast({ type: 'error', title: 'Import Failed', message: 'Invalid file format.' }); }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function exportSelected() {
    if (state.selectedItems.size === 0) return;
    const selected = Array.from(state.selectedItems).map(i => state.resources[i]);
    const data = { version: '2.0', exportDate: new Date().toISOString(), resources: selected };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `resource-bank-selected-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Exported! 📦', message: `Exported ${selected.length} selected resources.` });
}

// ===============================================
// BULK OPERATIONS
// ===============================================

function enterSelectMode() {
    state.isSelectMode = true;
    renderResources();
    el.bulkActionsBar.classList.add('active');
}

function exitSelectMode() {
    state.isSelectMode = false;
    state.selectedItems.clear();
    renderResources();
    el.bulkActionsBar.classList.remove('active');
    updateSelectedCount();
}

function toggleSelect(index) {
    if (state.selectedItems.has(index)) state.selectedItems.delete(index);
    else state.selectedItems.add(index);
    updateSelectedCount();
}

function updateSelectedCount() {
    el.selectedCount.textContent = state.selectedItems.size;
    if (state.selectedItems.size === 0 && state.isSelectMode) exitSelectMode();
}

function deleteSelected() {
    if (state.selectedItems.size === 0) return;
    if (confirm(`Delete ${state.selectedItems.size} selected resources?`)) {
        addToUndoStack('bulk delete');
        Array.from(state.selectedItems).sort((a, b) => b - a).forEach(i => state.resources.splice(i, 1));
        saveResources(); exitSelectMode(); applyFilters(); renderResources();
        showToast({ type: 'success', title: 'Deleted', message: 'Selected resources removed.', actions: [{ label: 'Undo', action: undo }] });
    }
}

// ===============================================
// DRAG & DROP
// ===============================================

function initializeSortable() {
    new Sortable(el.itemsSection, {
        animation: 200,
        ghostClass: 'dragging',
        handle: '.resource-card',
        filter: 'button, a, input',
        onEnd(evt) {
            if (evt.oldIndex !== evt.newIndex) {
                addToUndoStack('reorder');
                const item = state.filteredResources.splice(evt.oldIndex, 1)[0];
                state.filteredResources.splice(evt.newIndex, 0, item);
                state.resources = [...state.filteredResources];
                saveResources();
            }
        },
    });
}

// ===============================================
// SHARING
// ===============================================

function shareResource(index) {
    const r = state.resources[index];
    if (navigator.share) {
        navigator.share({ title: r.name, text: r.description, url: r.url }).catch(() => copyToClipboard(r.url));
    } else { copyToClipboard(r.url); }
}

function quickCiteResource(index) {
    const r = state.resources[index];
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const citation = `${r.name}. Retrieved ${date}, from ${r.url}`;
    copyToClipboard(citation);
    showToast({ type: 'success', title: 'Citation copied! 📋', message: 'Paste into your document.' });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast({ type: 'success', title: 'Copied! 📋', message: 'Link copied to clipboard.' });
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
}

function updateThemeIcon(theme) {
    el.themeToggle.querySelector('i').className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===============================================
// TOASTS
// ===============================================

function showToast({ type = 'info', title, message, duration = CONFIG.TOAST_DURATION, actions = [] }) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const actionsHTML = actions.length ? '<div class="toast-actions">' + actions.map(a => `<button class="toast-btn toast-action-js">${a.label}</button>`).join('') + '</div>' : '';

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${iconMap[type]}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        ${actionsHTML}
        <button class="toast-close"><i class="fas fa-times"></i></button>`;

    // Bind action buttons
    const actionBtns = toast.querySelectorAll('.toast-action-js');
    actionBtns.forEach((btn, i) => { if (actions[i]) btn.addEventListener('click', () => { actions[i].action(); removeToast(toast); }); });
    toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));

    el.toastContainer.appendChild(toast);
    const timer = setTimeout(() => removeToast(toast), duration);
    toast._timer = timer;
}

function removeToast(toast) {
    if (toast && toast.parentNode) {
        clearTimeout(toast._timer);
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }
}

// ===============================================
// KEYBOARD SHORTCUTS
// ===============================================

function handleKeyboardShortcuts(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); el.searchInput.focus(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); openAddDrawer(); }
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.key === 'Escape') {
        if (el.drawerOverlay.classList.contains('active')) closeDrawer();
        if (el.deleteOverlay.classList.contains('visible')) closeDeleteModal();
        if (el.digestOverlay.classList.contains('active')) closeDigestPanel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (el.drawerOverlay.classList.contains('active')) el.form.dispatchEvent(new Event('submit'));
    }
}

// ===============================================
// UTILITIES
// ===============================================

function generateId() { return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }

function isValidURL(str) {
    try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch { return false; }
}

function getDomain(url) {
    try { return new URL(url).hostname; }
    catch { return url; }
}

function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function clearAllFilters() {
    state.currentFilter = 'all';
    state.searchQuery = '';
    el.searchInput.value = '';
    el.clearSearch.style.display = 'none';
    renderFilterTags();
    applyFilters();
    renderResources();
}

// ===============================================
// GLOBAL WINDOW FUNCTIONS
// ===============================================

window.editResource = function(index) { openEditDrawer(index); };
window.deleteResourceClick = function(index) { deleteResource(index); };
window.shareResource = shareResource;
window.filterByTag = filterByTag;
window.openAddDrawer = openAddDrawer;
window.triggerImport = () => el.importBtn.click();
window.clearAllFilters = clearAllFilters;
