// Menu System JavaScript
let menuData = null;
let currentPath = [];
let recentItems = JSON.parse(localStorage.getItem('recentMenuItems') || '[]');
let searchTimeout = null;
let selectedIndex = -1;
let currentTheme = localStorage.getItem('menuTheme') || 'dark';

// Initialize the menu system
async function init() {
    try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        menuData = data;
        applyTheme(currentTheme);
        renderMenu(data.items);
        renderRecentItems();
        setupEventListeners();
        setupHotkeys();
        addThemeToggle();
    } catch (error) {
        console.error('Error loading menu data:', error);
    }
}

// Apply theme
function applyTheme(theme) {
    document.body.className = theme === 'light' 
        ? 'bg-gray-50 text-gray-900 min-h-screen' 
        : 'bg-gray-900 text-white min-h-screen';
    currentTheme = theme;
    localStorage.setItem('menuTheme', theme);
}

// Add theme toggle button
function addThemeToggle() {
    const header = document.querySelector('.container.mx-auto');
    const themeBtn = document.createElement('button');
    themeBtn.className = 'p-2 rounded-full hover:bg-gray-700/20 transition-colors';
    themeBtn.innerHTML = currentTheme === 'dark' ? '🌞' : '🌙';
    themeBtn.onclick = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        themeBtn.innerHTML = newTheme === 'dark' ? '🌞' : '🌙';
        // Re-render to update colors
        renderMenu(getCurrentItems());
    };
    header.querySelector('.flex.items-center.space-x-3').appendChild(themeBtn);
}

// Get current menu items based on path
function getCurrentItems() {
    if (currentPath.length === 0) return menuData.items;
    return currentPath[currentPath.length - 1].children || [];
}

// Render menu items based on current path
function renderMenu(items, title = 'Main Menu') {
    const content = document.getElementById('menuContent');
    const breadcrumb = document.getElementById('breadcrumb');
    const backButton = document.getElementById('backButton');
    
    // Update breadcrumb
    if (currentPath.length > 0) {
        breadcrumb.innerHTML = currentPath.map(p => p.title).join(' > ');
        backButton.classList.remove('hidden');
    } else {
        breadcrumb.innerHTML = '';
        backButton.classList.add('hidden');
    }
    
    // Clear content
    content.innerHTML = `<h2 class="text-2xl font-bold mb-6">${title}</h2>`;
    
    // Group items by type
    const menus = items.filter(item => item.type === 'menu');
    const cards = items.filter(item => item.type === 'cards');
    const panels = items.filter(item => item.type === 'panel');
    const leaves = items.filter(item => item.type === 'leaf');
    
    // Render menu items
    if (menus.length > 0) {
        const menuSection = document.createElement('div');
        menuSection.className = 'mb-8';
        menuSection.innerHTML = '<h3 class="text-lg font-semibold mb-3 text-gray-400">Menus</h3>';
        
        const menuGrid = document.createElement('div');
        menuGrid.className = 'space-y-2';
        
        menus.forEach((item, index) => {
            const menuItem = createMenuItem(item, index);
            menuGrid.appendChild(menuItem);
        });
        
        menuSection.appendChild(menuGrid);
        content.appendChild(menuSection);
    }
    
    // Render card sections
    cards.forEach(cardSection => {
        const section = document.createElement('div');
        section.className = 'mb-8';
        const textClass = currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400';
        section.innerHTML = `<h3 class="text-lg font-semibold mb-3 ${textClass}">${cardSection.title}</h3>`;
        
        const cardGrid = document.createElement('div');
        // Dynamic grid that adjusts based on card content
        cardGrid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3';
        
        if (cardSection.children) {
            cardSection.children.forEach((item, index) => {
                const card = createCardItem(item, menus.length + index);
                // Make cards with descriptions or images span more columns
                if (item.description || item.image) {
                    card.classList.add('col-span-2');
                }
                cardGrid.appendChild(card);
            });
        }
        
        section.appendChild(cardGrid);
        content.appendChild(section);
    });
    
    // Render leaf items
    if (leaves.length > 0) {
        const leafSection = document.createElement('div');
        leafSection.className = 'mb-8';
        const textClass = currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400';
        leafSection.innerHTML = `<h3 class="text-lg font-semibold mb-3 ${textClass}">Quick Links</h3>`;
        
        const leafGrid = document.createElement('div');
        leafGrid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3';
        
        leaves.forEach((item, index) => {
            const card = createCardItem(item, menus.length + cards.length + index);
            if (item.description || item.image) {
                card.classList.add('col-span-2');
            }
            leafGrid.appendChild(card);
        });
        
        leafSection.appendChild(leafGrid);
        content.appendChild(leafSection);
    }
}

// Create a menu item element
function createMenuItem(item, index) {
    const div = document.createElement('div');
    const bgClass = currentTheme === 'light' 
        ? 'bg-white hover:bg-gray-100 border border-gray-200' 
        : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700';
    div.className = `menu-item ${bgClass} rounded-xl p-3 cursor-pointer flex items-center justify-between backdrop-blur-sm`;
    div.dataset.index = index;
    
    const left = document.createElement('div');
    left.className = 'flex items-center space-x-3';
    left.innerHTML = `
        <span class="text-xl">${item.icon || '📁'}</span>
        <span class="font-medium">${item.title}</span>
    `;
    
    const right = document.createElement('div');
    right.className = 'flex items-center space-x-2';
    
    if (item.hotkey) {
        const hotkeyClass = currentTheme === 'light' ? 'bg-gray-200 text-gray-700' : '';
        right.innerHTML += `<span class="hotkey ${hotkeyClass}">${item.hotkey}</span>`;
    }
    
    right.innerHTML += `<span class="${currentTheme === 'light' ? 'text-gray-500' : 'text-gray-400'}">→</span>`;
    
    div.appendChild(left);
    div.appendChild(right);
    
    div.addEventListener('click', () => handleItemClick(item));
    
    return div;
}

// Create a card item element
function createCardItem(item, index) {
    const div = document.createElement('div');
    const bgClass = currentTheme === 'light' 
        ? 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300' 
        : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600';
    
    // Determine card size based on content
    const hasDescription = item.description;
    const hasImage = item.image;
    const sizeClass = hasDescription || hasImage ? 'p-6' : 'p-4';
    
    div.className = `card-item ${bgClass} rounded-xl ${sizeClass} cursor-pointer backdrop-blur-sm transition-all duration-200`;
    div.dataset.index = index;
    
    let content = '';
    
    // Image if present
    if (hasImage) {
        content += `<img src="${item.image}" alt="${item.title}" class="w-full h-32 object-cover rounded-lg mb-3">`;
    }
    
    // Icon and title
    content += `
        <div class="${hasImage ? '' : 'text-3xl mb-2'}">${item.icon || '🔗'}</div>
        <div class="font-semibold ${hasDescription ? 'text-lg mb-2' : 'mb-1'}">${item.title}</div>
    `;
    
    // Description if present
    if (hasDescription) {
        const textClass = currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400';
        content += `<div class="text-sm ${textClass} mb-2">${item.description}</div>`;
    }
    
    // Hotkey
    if (item.hotkey) {
        const hotkeyClass = currentTheme === 'light' ? 'bg-gray-200 text-gray-700' : '';
        content += `<div class="hotkey ${hotkeyClass} text-xs inline-block mt-2">${item.hotkey}</div>`;
    }
    
    div.innerHTML = content;
    div.addEventListener('click', () => handleItemClick(item));
    
    return div;
}

// Create a panel item element
function createPanelItem(panel, startIndex) {
    const div = document.createElement('div');
    const bgClass = currentTheme === 'light' 
        ? 'bg-white border border-gray-200' 
        : 'bg-gray-800/30 border border-gray-700';
    
    // Determine panel size based on layout
    let colSpan = 'col-span-2';
    if (panel.layout === '3x1') colSpan = 'col-span-3';
    else if (panel.layout === '2x2' || panel.layout === '4x1') colSpan = 'col-span-4';
    else if (panel.layout === 'full') colSpan = 'col-span-full';
    
    div.className = `panel-item ${bgClass} rounded-xl p-4 ${colSpan}`;
    
    // Panel title
    if (panel.title) {
        const titleDiv = document.createElement('div');
        const textClass = currentTheme === 'light' ? 'text-gray-700' : 'text-gray-300';
        titleDiv.className = `text-sm font-semibold mb-3 ${textClass}`;
        titleDiv.textContent = panel.title;
        div.appendChild(titleDiv);
    }
    
    // Panel content grid
    const contentGrid = document.createElement('div');
    
    // Determine internal grid layout
    if (panel.layout === '2x1') {
        contentGrid.className = 'grid grid-cols-2 gap-3';
    } else if (panel.layout === '3x1') {
        contentGrid.className = 'grid grid-cols-3 gap-3';
    } else if (panel.layout === '2x2') {
        contentGrid.className = 'grid grid-cols-2 gap-3';
    } else if (panel.layout === '4x1') {
        contentGrid.className = 'grid grid-cols-4 gap-3';
    } else {
        contentGrid.className = 'grid grid-cols-2 gap-3';
    }
    
    // Render panel children
    if (panel.children) {
        panel.children.forEach((item, index) => {
            const child = createCardItem(item, startIndex + index);
            // Remove default card styling for panel items
            child.classList.remove('backdrop-blur-sm', 'border');
            child.classList.add('bg-gray-700/20', 'hover:bg-gray-600/30');
            if (currentTheme === 'light') {
                child.classList.remove('bg-gray-700/20', 'hover:bg-gray-600/30');
                child.classList.add('bg-gray-100', 'hover:bg-gray-200');
            }
            contentGrid.appendChild(child);
        });
    }
    
    div.appendChild(contentGrid);
    return div;
}

// Handle item click
function handleItemClick(item) {
    if (item.type === 'menu' || item.type === 'cards') {
        // Navigate into submenu
        currentPath.push(item);
        renderMenu(item.children || [], item.title);
    } else if (item.type === 'leaf' && item.url) {
        // Open URL and track as recent
        window.open(item.url, '_blank');
        addToRecent(item);
    }
}

// Add item to recent list
function addToRecent(item) {
    // Remove if already exists
    recentItems = recentItems.filter(i => i.id !== item.id);
    
    // Add to beginning
    recentItems.unshift({
        ...item,
        lastAccessed: new Date().toISOString()
    });
    
    // Keep only last 8 items
    recentItems = recentItems.slice(0, 8);
    
    // Save to localStorage
    localStorage.setItem('recentMenuItems', JSON.stringify(recentItems));
    
    // Re-render recent items
    renderRecentItems();
}

// Render recent items
function renderRecentItems() {
    const container = document.getElementById('recentItems');
    container.innerHTML = '';
    
    if (recentItems.length === 0) {
        container.parentElement.style.display = 'none';
        return;
    }
    
    container.parentElement.style.display = 'block';
    container.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3';
    
    recentItems.forEach(item => {
        const card = createCardItem(item, -1);
        // Recent items are always compact
        card.classList.remove('col-span-2');
        container.appendChild(card);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('backButton').addEventListener('click', goBack);
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyPress);
}

// Go back to previous menu
function goBack() {
    if (currentPath.length > 0) {
        currentPath.pop();
        if (currentPath.length === 0) {
            renderMenu(menuData.items);
        } else {
            const parent = currentPath[currentPath.length - 1];
            renderMenu(parent.children || [], parent.title);
        }
    }
    
    // Clear search
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('menuContent').classList.remove('hidden');
}

// Perform search
function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    const menuContent = document.getElementById('menuContent');
    const resultsContent = document.getElementById('searchResultsContent');
    
    if (!query.trim()) {
        searchResults.classList.add('hidden');
        menuContent.classList.remove('hidden');
        return;
    }
    
    // Show search results
    searchResults.classList.remove('hidden');
    menuContent.classList.add('hidden');
    
    // Search through all items
    const results = searchItems(menuData.items, query.toLowerCase());
    
    // Clear and render results
    resultsContent.innerHTML = '';
    
    if (results.length === 0) {
        resultsContent.innerHTML = '<p class="text-gray-400">No results found</p>';
    } else {
        results.forEach((item, index) => {
            const card = createCardItem(item, index);
            resultsContent.appendChild(card);
        });
    }
    
    selectedIndex = -1;
}

// Recursive search function
function searchItems(items, query, results = []) {
    items.forEach(item => {
        // Check if item matches
        if (item.title.toLowerCase().includes(query) || 
            (item.hotkey && item.hotkey.toLowerCase().includes(query))) {
            if (item.type === 'leaf') {
                results.push(item);
            }
        }
        
        // Search children
        if (item.children) {
            searchItems(item.children, query, results);
        }
    });
    
    return results;
}

// Handle keyboard shortcuts
function handleKeyPress(e) {
    // Help modal
    if (e.key === '?') {
        document.getElementById('helpModal').classList.toggle('hidden');
        return;
    }
    
    // Focus search - just slash key
    if (e.key === '/' && document.activeElement.id !== 'searchInput') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
        return;
    }
    
    // Escape
    if (e.key === 'Escape') {
        if (!document.getElementById('helpModal').classList.contains('hidden')) {
            document.getElementById('helpModal').classList.add('hidden');
        } else if (document.getElementById('searchInput').value) {
            document.getElementById('searchInput').value = '';
            performSearch('');
        } else {
            goBack();
        }
        return;
    }
    
    // Navigation with arrow keys
    const visibleItems = document.querySelectorAll('.menu-item:not(.hidden), .card-item:not(.hidden)');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
        updateSelection(visibleItems);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection(visibleItems);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        visibleItems[selectedIndex].click();
    }
}

// Update visual selection
function updateSelection(items) {
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add('ring-2', 'ring-blue-500');
        } else {
            item.classList.remove('ring-2', 'ring-blue-500');
        }
    });
}

// Setup global hotkeys
function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
        // Skip if typing in search
        if (document.activeElement.id === 'searchInput') return;
        
        // Check all items for matching hotkeys
        const checkHotkey = (items) => {
            items.forEach(item => {
                if (item.hotkey) {
                    const parts = item.hotkey.toLowerCase().split('+');
                    const key = parts[parts.length - 1];
                    const needsCtrl = parts.includes('ctrl');
                    const needsAlt = parts.includes('alt');
                    
                    if (e.key.toLowerCase() === key && 
                        e.ctrlKey === needsCtrl && 
                        e.altKey === needsAlt) {
                        e.preventDefault();
                        handleItemClick(item);
                    }
                }
                
                if (item.children) {
                    checkHotkey(item.children);
                }
            });
        };
        
        checkHotkey(menuData.items);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);