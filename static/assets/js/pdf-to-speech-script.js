const dropZone = document.getElementById('drop-zone');
const audioElement = document.getElementById('audio');
const player = document.getElementById('player');
const downloadLink = document.getElementById('download-link');
const loadingGif = document.getElementById('loading')

// Event listeners for drag and drop functionality
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgb(0, 202, 0)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#ccc';
});

// Handle the drop event activates loading gif and fetches the audio from the api run in the backend (flask)
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
        const formData = new FormData();
        formData.append('pdf', file);

        loadingGif.style.display = 'block';

        fetch('/upload-pdf', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            const disposition = response.headers.get('Content-Disposition');
            let filename = "tts_output.mp3";
            if (disposition && disposition.includes('filename=')) {
                const match = disposition.match(/filename="?(.+?)"?$/);
                if (match) {
                    filename = match[1];
                }
            }
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({blob, filename}) => {
            const audioUrl = URL.createObjectURL(blob);

            audioElement.src = audioUrl;
            downloadLink.href = audioUrl;
            downloadLink.download = filename;
            player.style.display = 'block';
        })
        .catch(error =>
            console.error('Upload or playback failed: ', error))
        .finally(() => {
            loadingGif.style.display = 'none';
        });
        } else {
            alert('Please drop a PDF file.');
        }
})

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