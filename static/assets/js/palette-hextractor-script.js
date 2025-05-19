
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const chooseBtn = document.getElementById('choose-file');

// Open file picker on button click
chooseBtn.addEventListener('click', () => fileInput.click());

// When a file is selected via file picker
fileInput.addEventListener('change', e => {
  if (!e.target.files.length) return;
  handleFile(e.target.files[0]);
});

// Prevent defaults on drag events
['dragenter','dragover','dragleave','drop'].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
  })
);

// Style on drag over
['dragenter','dragover'].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.add('dragover'))
);
['dragleave','drop'].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'))
);

// Handle drop
dropZone.addEventListener('drop', e => {
  // Check for files
  const files = e.dataTransfer.files;
  if (files && files.length) {
    const imgFile = Array.from(files).find(f => f.type.startsWith('image/'));
    if (imgFile) {
      handleFile(imgFile);
      return;
    }
  }
  // Check for URL (text/uri-list or text/plain)
  const urlData = e.dataTransfer.getData('text/uri-list') 
                || e.dataTransfer.getData('text/plain');
  if (urlData && isImageUrl(urlData)) {
    handleUrl(urlData);
  }
});

// File handlers
function isImageUrl(url) {
  return /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
}

function clearDropZone() {
  dropZone.innerHTML = '<strong></strong>';
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    showImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

function handleUrl(url) {
  showImage(url);
}

// Show the image in the drop zone and send it to the backend for extraction while activating the palette box
function showImage(src) {
  clearDropZone();
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Dropped image';
  dropZone.appendChild(img);
  const container = document.getElementById('palette-container');
  container.hidden = false;
  

  // Show loading GIF
  const loadingGif = document.getElementById('loading-gif');
  loadingGif.style.display = 'block';
  const paletteBox = document.getElementById('palette-box');
  paletteBox.hidden = true;

  // Send image to backend for palette extraction
  fetch(src)
  .then(res => res.blob())
  .then(blob => {
    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    return fetch('/get-palette', {
      method: 'POST',
      body: formData,
    });
  })
  .then(response => response.json())
  .then(palette => {
    renderPalette(palette);
    // Hide loading GIF and show palette
    loadingGif.style.display = 'none';
    paletteBox.hidden = false;
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Render the palette
// This function creates the HTML elements for each color in the palette
function renderPalette(palette) {
  const paletteBox = document.getElementById('palette-box');
  paletteBox.innerHTML = ''; // Clear previous content

  palette.forEach(({ color, percentage }) => {
    const item = document.createElement('div');
    item.className = 'color-item row align-items-center mb-3 ms-2';

    // Craete preview of the color
    const swatchCol = document.createElement('div');
    swatchCol.className = 'col-3';
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatchCol.appendChild(swatch);

    // Create color hex code
    const codeCol = document.createElement('div');
    codeCol.className = 'col-3';
    const code = document.createElement('span');
    code.className = 'color-code';
    code.textContent = color;
    codeCol.appendChild(code);

    // Create percentage text
    const percentageCol = document.createElement('div');
    percentageCol.className = 'col-3';
    const percentageText = document.createElement('span');
    percentageText.className = 'color-percentage';
    const formattedPercentage = percentage.toFixed(2).padStart(5, '0');
    percentageText.textContent = `${formattedPercentage}% `;
    percentageCol.appendChild(percentageText);

    // Create copy button
    const copyBtnCol = document.createElement('div');
    copyBtnCol.className = 'col-3';
    const copyBtn = document.createElement('a');
    copyBtn.href = 'javascript:void(0)';
    copyBtn.className = 'copy-button mx-2';
    copyBtn.innerHTML = '<i class="bi bi-copy"></i>';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(color).then(() => {
        copyBtn.innerHTML = '<i class="bi bi-check2" style="color: #00ca00"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="bi bi-copy"></i>';
        }, 1500);
      });
    });
    copyBtnCol.appendChild(copyBtn);

    // Append all columns to the row item
    item.appendChild(swatchCol);
    item.appendChild(codeCol);
    item.appendChild(percentageCol);
    item.appendChild(copyBtnCol);
    paletteBox.appendChild(item);
  });
}

// ========================= DARK MODE TOGGLE =========================
// Dark mode toggle
const toggleButton = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved user preference, if any, on load of the website
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-mode');
}

// Toggle dark mode on button click
toggleButton.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  // Save the user's preference in localStorage
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
});

// Apply system preference if no user preference is set
if (!localStorage.getItem('theme')) {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
  }
}