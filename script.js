// Step 3A: Handle form submission and get input values
const form = document.getElementById('playlist-form');

// Validate Spotify playlist URL
function isValidSpotifyPlaylistUrl(url) {
    // Matches URLs like https://open.spotify.com/playlist/xxxxxxxxxxxxxx (with optional query params)
    return /^https?:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+(\?.*)?$/.test(url);
}

form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent page reload
    const url = document.getElementById('playlist-url').value;
    const label = document.getElementById('playlist-label').value;

    // Validate URL
    if (!isValidSpotifyPlaylistUrl(url)) {
        alert('Please enter a valid Spotify playlist URL.');
        return;
    }

    // Get existing playlists or start with empty array
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    // Add new playlist
    playlists.push({ url, label });
    // Save back to localStorage
    localStorage.setItem('playlists', JSON.stringify(playlists));

    // Clear form inputs
    form.reset();

    // Update display
    displayPlaylists();
});

function displayPlaylists() {
    const container = document.getElementById('playlists-container');
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

    // Group playlists by label, but keep track of original index for delete/edit
    const grouped = {};
    playlists.forEach(({ url, label }, idx) => {
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push({ url, idx });
    });

    // Generate HTML
    let html = '';
    for (const label in grouped) {
        html += `<div class="playlist-section">
            <h2>${label}</h2><ul>`;
        grouped[label].forEach(({ url, idx }) => {
            html += `<li><a href="${url}" target="_blank">${url}</a> <button onclick="editPlaylist(${idx})">Edit</button> <button onclick="deletePlaylist(${idx})">Delete</button></li>`;
        });
        html += '</ul></div>';
    }

    container.innerHTML = html;
}

// Helper to find the label for a given playlist index
function getLabelByIndex(playlists, index) {
    let count = 0;
    for (const { label } of playlists) {
        if (count === index) return label;
        count++;
    }
    return null;
}

// Delete playlist by index with dissolve animation
function deletePlaylist(index) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const label = getLabelByIndex(playlists, index);
    // Count how many playlists are in this label
    const labelCount = playlists.filter(p => p.label === label).length;

    const container = document.getElementById('playlists-container');
    const allLis = container.querySelectorAll('li');
    let liToDissolve = null;
    let count = 0;
    for (const labelKey in playlists.reduce((acc, cur) => { acc[cur.label] = true; return acc; }, {})) {
        const group = playlists.filter(p => p.label === labelKey);
        for (let i = 0; i < group.length; i++) {
            if (count === index) {
                liToDissolve = allLis[count];
                break;
            }
            count++;
        }
        if (liToDissolve) break;
    }

    // If this is the last playlist in the section, animate the whole section
    if (labelCount === 1) {
        // Find the .playlist-section for this label
        const sectionDivs = container.querySelectorAll('.playlist-section');
        let sectionToDissolve = null;
        sectionDivs.forEach(div => {
            const h2 = div.querySelector('h2');
            if (h2 && h2.textContent === label) {
                sectionToDissolve = div;
            }
        });
        if (sectionToDissolve) {
            sectionToDissolve.classList.add('dissolve-out');
            setTimeout(() => {
                playlists.splice(index, 1);
                localStorage.setItem('playlists', JSON.stringify(playlists));
                displayPlaylists();
            }, 700);
            return;
        }
    }

    // Otherwise, just animate the li
    if (liToDissolve) {
        liToDissolve.classList.add('dissolve-out');
        setTimeout(() => {
            playlists.splice(index, 1);
            localStorage.setItem('playlists', JSON.stringify(playlists));
            displayPlaylists();
        }, 700);
    } else {
        playlists.splice(index, 1);
        localStorage.setItem('playlists', JSON.stringify(playlists));
        displayPlaylists();
    }
}

// Modal state
let editingIndex = null;

// Show modal
function showEditModal(url, label, index) {
    document.getElementById('edit-url').value = url;
    document.getElementById('edit-label').value = label;
    document.body.classList.add('modal-open');
    editingIndex = index;
}

// Hide modal
function hideEditModal() {
    document.body.classList.remove('modal-open');
    editingIndex = null;
}

// Edit playlist by index (open modal)
function editPlaylist(index) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const playlist = playlists[index];
    showEditModal(playlist.url, playlist.label, index);
}

// Handle modal form submit
const editForm = document.getElementById('edit-form');
editForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const newUrl = document.getElementById('edit-url').value;
    const newLabel = document.getElementById('edit-label').value;
    if (!isValidSpotifyPlaylistUrl(newUrl)) {
        alert('Please enter a valid Spotify playlist URL.');
        return;
    }
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    if (editingIndex !== null && playlists[editingIndex]) {
        playlists[editingIndex] = { url: newUrl, label: newLabel };
        localStorage.setItem('playlists', JSON.stringify(playlists));
        displayPlaylists();
    }
    hideEditModal();
});

document.getElementById('cancel-edit').addEventListener('click', function() {
    hideEditModal();
});
document.getElementById('modal-overlay').addEventListener('click', function() {
    hideEditModal();
});

// Display playlists on page load
window.addEventListener('DOMContentLoaded', displayPlaylists);