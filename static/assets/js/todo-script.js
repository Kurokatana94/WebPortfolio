const todoList = document.querySelector(".list-container");
const addInput = document.querySelector("#add-input");
const addButton = document.querySelector("#add-button");
const listTemplate = document.querySelector('#list-item');

// Load the list from localStorage when the page loads
function loadList() {
    const stored = localStorage.getItem('todoList');
    if (stored) {
        const items = JSON.parse(stored);
        items.forEach(({ text, checked }) => {
            const clone = listTemplate.content.cloneNode(true).querySelector('li');
            clone.querySelector('.item-text').textContent = text;

            // Apply checked style
            if (checked) {
                clone.style.setProperty('border-color', 'rgb(0, 202, 0)', 'important');
                clone.style.setProperty('border-width', '2px', 'important');
            }

            // Add event listener to the check button
            const checkButton = clone.querySelector('.check-btn');
            if (checkButton) {
                checkButton.addEventListener('click', function () {
                    const target = this.closest('li');
                    if (target.style.borderColor === 'rgb(0, 202, 0)') {
                        target.style.setProperty('border-color', 'rgb(80, 176, 255)', 'important');
                        target.style.setProperty('border-width', '1px', 'important');
                    } else {
                        target.style.setProperty('border-color', 'rgb(0, 202, 0)', 'important');
                        target.style.setProperty('border-width', '2px', 'important');
                    }
                    saveList();
                });
            }

            // Add event listener to the delete button
            const deleteButton = clone.querySelector(".delete-btn");
            if (deleteButton) {
                deleteButton.addEventListener('click', function () {
                    const target = this.closest('li');
                    // Remove the item from the todo list
                    todoList.removeChild(target);
                    saveList();
                });
            }

            todoList.appendChild(clone);
        });
    }
}

// Call loadList when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadList);

function saveList() {
    const items = Array.from(todoList.querySelectorAll('li')).map(li => {
        return {
            text: li.querySelector('.item-text').textContent,
            checked: li.style.borderColor === 'rgb(0, 202, 0)' // use a flag
        };
    });
    localStorage.setItem('todoList', JSON.stringify(items));
}

// Add item to the list when the button is clicked or Enter key is pressed
function addItemToList() {
    const value = addInput.value;
    if (value === "") return;
    const clone = listTemplate.content.cloneNode(true).querySelector('li');
    clone.querySelector(".item-text").textContent = value;

    // Add event listener to the check button
    const checkButton = clone.querySelector(".check-btn");
    if (checkButton) {
        checkButton.addEventListener('click', function () {
            const target = this.closest('li');
            if (target.style.borderColor === 'rgb(0, 202, 0)') {
                target.style.setProperty('border-color', 'rgb(80, 176, 255)', 'important');
                target.style.setProperty('border-width', '1px', 'important');
            }
            else { 
                target.style.setProperty('border-color', 'rgb(0, 202, 0)', 'important');
                target.style.setProperty('border-width', '2px', 'important');
            }

            saveList();
        });
    }

    // Add event listener to the delete button
    const deleteButton = clone.querySelector(".delete-btn");
    if (deleteButton) {
        deleteButton.addEventListener('click', function () {
            const target = this.closest('li');
            // Remove the item from the todo list
            todoList.removeChild(target);

            saveList();
        });
    }
    todoList.prepend(clone);
    addInput.value = "";

    saveList();
}

// Add event listeners for the button and input field
addButton.addEventListener("click", addItemToList);
addInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        addItemToList();
    }
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