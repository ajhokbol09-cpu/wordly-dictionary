
# Wordly Dictionary SPA

## About the Project

Wordly is a Single Page Application (SPA) dictionary built with HTML, CSS, and JavaScript.

It allows users to search for English words and explore their meanings without reloading the webpage.

## Features

- Search for English words.
- Retrieve word information from the Free Dictionary API.
- Display definitions and parts of speech.
- Display pronunciation text when available.
- Play audio pronunciation when available.
- Display examples of word usage.
- Display available synonyms.
- Show helpful fallbacks when pronunciation, definitions, or synonyms are unavailable.
- Distinguish words not found from dictionary-service and connection errors.
- Display source and license links when available.
- Save words in the browser.
- Show an empty-state message when no words have been saved.
- Keep saved words after refreshing the page.
- Search for words from the saved list.
- Remove saved words.
- Switch between dark and light themes.
- Keep the selected theme after refreshing the page in the same browser.
- Use a left-aligned layout with South Sudan flag-inspired colors.
- Responsive layout for smaller screens.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Fetch API
- Free Dictionary API
- DOM manipulation
- Browser localStorage

## API

This project uses the Free Dictionary API.

API endpoint:

https://api.dictionaryapi.dev/api/v2/entries/en/WORD

Replace WORD with the English word you want to search for.

Example:

https://api.dictionaryapi.dev/api/v2/entries/en/hello

## How to Run the Project

1. Download or clone the project repository.
2. Open the project folder in Visual Studio Code.
3. Run the project through a local web server, such as the VS Code Live Server extension. Avoid opening `index.html` directly with a `file://` URL, because browsers may block API requests from local files.
4. Enter an English word in the search box.
5. Click Search to view the results.

An internet connection is required to retrieve dictionary information.

## Saving Words

Saved words are stored in the browser using localStorage.

They remain available after refreshing the page in the same browser, unless the browser data is cleared.

## Error Handling

The application displays separate messages when a word is not found, the dictionary service is unavailable, or the network request cannot connect.
It also reports when saved words cannot be read or written in browser storage.

Some words may not have audio, examples, synonyms, or source information.

## Project Structure

wordly-spa/
├── index.html
├── style.css
├── index.js
└── README.md

## Author

Add your name here.

## License

Dictionary information and its licensing are provided by the API when available.
Refer to the source and license links displayed by the application.

## Testing checklist

- Search for a valid word such as `serendipity` and check definitions, pronunciation, examples, synonyms, source links, and audio when provided.
- Search for a word without pronunciation or synonyms and confirm the page remains usable and shows the available fallback text.
- Submit an empty value and an invalid value containing spaces; confirm a helpful validation message appears.
- Search for an unknown word and test with the network unavailable; confirm each error is displayed without refreshing the page.
- Save a word, reload, search from the saved list, and remove the word.
- Switch themes, reload, and confirm the theme preference remains selected.
- Check keyboard focus and a narrow mobile viewport for visible controls and horizontal overflow.

The page styles and JavaScript selectors should stay synchronized with `index.html`. No automated test runner is configured; use the browser checklist and run `node --check index.js` after JavaScript changes.
