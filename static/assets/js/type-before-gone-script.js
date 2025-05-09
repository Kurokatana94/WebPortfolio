const textArea = document.getElementById('user-text');

// Takes care of the countdown timer and the elapsed time
let countdownTimer;
let elapsedTimer;
let elapsedTime = 0;
let timeStart = null;
const idleLimit = 5; // seconds before deletion
const challengeDuration = 10; // seconds of active typing required

// Function to reset the countdown timer
function resetCountdown() {
  clearTimeout(countdownTimer);
  countdownTimer = setTimeout(() => {
      textArea.value = '';
      stopTimers();
  }, idleLimit * 1000);
}

// Function to stop the timers
function stopTimers() {
  clearTimeout(countdownTimer);
  clearInterval(elapsedTimer);
}

// Function to start the challenge and set the elapsed time
function startChallenge() {
  timeStart = Date.now();
  elapsedTime = 0;
  stopTimers();

  resetCountdown();
  // Start the elapsed timer
  elapsedTimer = setInterval(() => {
      elapsedTime = (Date.now() - timeStart) / 1000; // Convert to seconds
      if (elapsedTime >= challengeDuration) {
        textArea.disabled = true;
        alert('Challenge complete! You can now submit your text.');
          stopTimers();
      }
  }, 250);
}

// Event listener for the text area to start the challenge (any key press)
textArea.addEventListener('input', () => {
  if (elapsedTime === 0) {
      startChallenge();
  } else {
      resetCountdown();
  }
});

// Event listener for the inspirational quote button
const sentenceParagraph = document.getElementById('inspirational-sentence');
const authorParagraph = document.getElementById('author');
const sentenceButton = document.getElementById('get-sentence');

sentenceButton.addEventListener('click', () => {
  fetch('/get-sentence')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      sentenceParagraph.textContent = `"${data.text}"`;
      authorParagraph.textContent = `- ${data.author}`;
    })
    .catch(error => console.error('Error fetching sentence:', error));
});

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