
/* =====================================
   1. CONNECT JAVASCRIPT TO HTML
===================================== */

const searchForm = document.getElementById("search-form");
const wordInput = document.getElementById("word-input");
const message = document.getElementById("message");

const wordTitle = document.getElementById("word-title");
const phonetic = document.getElementById("phonetic");
const resultsSection = document.getElementById("results-section");

const definitionsContainer =
    document.getElementById("definitions-container");

const synonymsContainer =
    document.getElementById("synonyms-container");

const sourceLink = document.getElementById("source-link");

const audioButton = document.getElementById("audio-button");
const saveButton = document.getElementById("save-button");

const savedWordsList = document.getElementById("saved-words-list");
const themeButton = document.getElementById("theme-button");


/* =====================================
   2. CREATE VARIABLES
===================================== */

let currentWord = "";
let currentAudio = "";
let currentAudioPlayer = null;
let activeRequest = null;
let requestNumber = 0;

let savedWords = [];

try {
    const storedWordsValue = localStorage.getItem("wordlySavedWords");
    if (storedWordsValue !== null) {
        const storedWords = JSON.parse(storedWordsValue);
        if (!Array.isArray(storedWords)) {
            throw new Error("Saved words must be stored as a list.");
        }

        savedWords = [
            ...new Set(
                storedWords
                    .filter((word) => typeof word === "string" && word.trim())
                    .map((word) => word.trim().toLowerCase())
            ),
        ];
    }
} catch (error) {
    message.textContent =
        "Saved words could not be loaded from browser storage.";
}

function saveWordsToStorage(words) {
    try {
        localStorage.setItem(
            "wordlySavedWords",
            JSON.stringify(words)
        );
        return true;
    } catch (error) {
        return false;
    }
}


/* =====================================
   3. SEARCH FOR A WORD
===================================== */

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const word = wordInput.value.trim();

    if (word === "") {
        if (activeRequest !== null) {
            activeRequest.abort();
            activeRequest = null;
        }
        requestNumber += 1;
        clearResults();
        message.textContent = "Please enter a word.";
        return;
    }

    if (!/^[\p{L}'’-]+$/u.test(word)) {
        if (activeRequest !== null) {
            activeRequest.abort();
            activeRequest = null;
        }
        requestNumber += 1;
        clearResults();
        message.textContent =
            "Enter one word using letters, apostrophes, or hyphens.";
        return;
    }

    if (activeRequest !== null) {
        activeRequest.abort();
    }

    const controller = new AbortController();
    activeRequest = controller;
    const thisRequest = ++requestNumber;

    clearResults();

    message.textContent = "Searching...";

    const apiURL =
        "https://api.dictionaryapi.dev/api/v2/entries/en/" +
        encodeURIComponent(word);

    fetch(apiURL, { signal: controller.signal })
        .then(async function (response) {
            let data = null;
            try {
                data = await response.json();
            } catch (error) {
                if (response.ok) {
                    throw new Error("The dictionary returned an invalid response.");
                }
            }

            if (response.status === 404) {
                throw new Error("Word not found. Please try another word.");
            }

            if (!response.ok) {
                throw new Error(
                    "The dictionary service is temporarily unavailable. Please try again shortly."
                );
            }

            return data;
        })
        .then(function (data) {
            if (thisRequest !== requestNumber) {
                return;
            }

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("No information was found.");
            }

            const wordData = data[0];

            if (!wordData || typeof wordData !== "object") {
                throw new Error("The dictionary returned invalid data.");
            }

            currentWord = (wordData.word || word).toLowerCase();

            displayWord(wordData);

            message.textContent = "Word found successfully!";
            saveButton.hidden = false;
            updateSaveButton();
        })

        .catch(function (error) {
            if (error.name === "AbortError") {
                return;
            }

            if (thisRequest !== requestNumber) {
                return;
            }

            clearResults();

            if (error instanceof TypeError) {
                message.textContent =
                    "Connection failed. Check your internet and try again.";
            } else {
                message.textContent = error.message;
            }
        })
        .finally(function () {
            if (thisRequest === requestNumber) {
                activeRequest = null;
            }
        });
});

wordInput.addEventListener("invalid", function (event) {
    event.preventDefault();

    if (activeRequest !== null) {
        activeRequest.abort();
        activeRequest = null;
    }
    requestNumber += 1;
    clearResults();
    message.textContent = "Please enter a word.";
});


/* =====================================
   4. CLEAR OLD RESULTS
===================================== */

function clearResults() {
    resultsSection.hidden = true;
    wordTitle.textContent = "";
    phonetic.textContent = "";

    definitionsContainer.innerHTML = "";
    synonymsContainer.innerHTML = "";
    sourceLink.innerHTML = "";

    audioButton.hidden = true;
    saveButton.hidden = true;

    currentWord = "";
    currentAudio = "";

    if (currentAudioPlayer !== null) {
        currentAudioPlayer.pause();
        currentAudioPlayer = null;
    }
}


/* =====================================
   5. DISPLAY WORD INFORMATION
===================================== */

function displayWord(wordData) {
    resultsSection.hidden = false;
    wordTitle.textContent = wordData.word || currentWord;

    // Find pronunciation text and audio
    const phonetics = Array.isArray(wordData.phonetics)
        ? wordData.phonetics
        : [];

    for (let i = 0; i < phonetics.length; i++) {
        const sound = phonetics[i];

        if (sound && sound.text && phonetic.textContent === "") {
            phonetic.textContent = sound.text;
        }

        if (
            sound &&
            typeof sound.audio === "string" &&
            currentAudio === "" &&
            /^https?:\/\//i.test(sound.audio)
        ) {
            currentAudio = sound.audio;
        }
    }

    if (phonetic.textContent === "") {
        phonetic.textContent = "Pronunciation unavailable.";
    }

    if (
        currentAudio !== "" &&
        /^https?:\/\//i.test(currentAudio)
    ) {
        audioButton.hidden = false;
    } else {
        currentAudio = "";
    }

    // Prepare a list of synonyms
    let allSynonyms = [];

    const meanings = Array.isArray(wordData.meanings)
        ? wordData.meanings
        : [];
    let definitionCount = 0;

    // Go through each meaning
    for (let i = 0; i < meanings.length; i++) {
        const meaning = meanings[i];
        if (!meaning || typeof meaning !== "object") {
            continue;
        }

        const heading = document.createElement("h3");
        heading.textContent = meaning.partOfSpeech || "Meaning";

        definitionsContainer.appendChild(heading);

        const meaningSynonyms = Array.isArray(meaning.synonyms)
            ? meaning.synonyms
            : [];

        // Collect synonyms for this meaning
        for (let j = 0; j < meaningSynonyms.length; j++) {
            const synonym = meaningSynonyms[j];

            if (typeof synonym === "string" && !allSynonyms.includes(synonym)) {
                allSynonyms.push(synonym);
            }
        }

        const definitions = Array.isArray(meaning.definitions)
            ? meaning.definitions
            : [];

        // Display definitions and examples
        for (let j = 0; j < definitions.length; j++) {
            const definition = definitions[j];
            if (!definition || typeof definition !== "object") {
                continue;
            }
            definitionCount++;

            const card = document.createElement("div");
            card.className = "definition-card";

            const definitionText = document.createElement("p");

            definitionText.textContent =
                (j + 1) + ". " + definition.definition;

            card.appendChild(definitionText);

            if (definition.example) {
                const exampleText = document.createElement("p");

                exampleText.className = "example";
                exampleText.textContent =
                    "Example: " + definition.example;

                card.appendChild(exampleText);
            }

            // Collect synonyms attached to definitions
            const definitionSynonyms = Array.isArray(definition.synonyms)
                ? definition.synonyms
                : [];

            for (let k = 0; k < definitionSynonyms.length; k++) {
                const synonym = definitionSynonyms[k];

                if (typeof synonym === "string" && !allSynonyms.includes(synonym)) {
                    allSynonyms.push(synonym);
                }
            }

            definitionsContainer.appendChild(card);
        }
    }

    if (definitionCount === 0) {
        const fallback = document.createElement("p");
        fallback.textContent = "No definitions are available.";
        definitionsContainer.appendChild(fallback);
    }

    // Display synonyms
    if (allSynonyms.length === 0) {
        synonymsContainer.textContent = "No synonyms available.";
    } else {
        for (let i = 0; i < allSynonyms.length; i++) {
            const synonymItem = document.createElement("span");

            synonymItem.className = "synonym";
            synonymItem.textContent = allSynonyms[i];

            synonymsContainer.appendChild(synonymItem);
        }
    }

    // Display source link
    const sourceUrls = Array.isArray(wordData.sourceUrls)
        ? wordData.sourceUrls
        : [];

    const safeSourceUrl = sourceUrls.find(function (url) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === "http:" ||
                parsedUrl.protocol === "https:";
        } catch (error) {
            return false;
        }
    });

    if (safeSourceUrl) {
        const link = document.createElement("a");

        link.href = safeSourceUrl;
        link.textContent = "View source";
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        sourceLink.appendChild(link);
    }

    // Display license information when available
    if (wordData.license && typeof wordData.license === "object") {
        const licenseText = document.createElement("p");

        if (typeof wordData.license.name === "string") {
            licenseText.textContent =
                "License: " + wordData.license.name;
            sourceLink.appendChild(licenseText);
        }

        if (
            typeof wordData.license.url === "string" &&
            (wordData.license.url.startsWith("https://") ||
                wordData.license.url.startsWith("http://"))
        ) {
            const licenseLink = document.createElement("a");

            licenseLink.href = wordData.license.url;
            licenseLink.textContent = "View license";
            licenseLink.target = "_blank";
            licenseLink.rel = "noopener noreferrer";

            sourceLink.appendChild(licenseLink);
        }
    }
}


/* =====================================
   6. PLAY PRONUNCIATION
===================================== */

audioButton.addEventListener("click", function () {
    if (currentAudio !== "") {
        if (currentAudioPlayer !== null) {
            currentAudioPlayer.pause();
        }

        currentAudioPlayer = new Audio(currentAudio);

        currentAudioPlayer.play().catch(function () {
            message.textContent =
                "Unable to play audio. Please try again.";
        });
    }
});


/* =====================================
   7. SAVE A WORD
===================================== */

saveButton.addEventListener("click", function () {
    if (currentWord === "") {
        return;
    }

    const normalizedWord = currentWord.toLowerCase();
    const alreadySaved = savedWords.some(
        (word) => word.toLowerCase() === normalizedWord
    );

    if (alreadySaved) {
        message.textContent = "This word is already saved.";
    } else {
        const updatedWords = [...savedWords, currentWord];
        if (!saveWordsToStorage(updatedWords)) {
            message.textContent =
                "Could not save this word. Check your browser storage settings.";
            return;
        }

        savedWords = updatedWords;
        displaySavedWords();
        updateSaveButton();
        message.textContent = "Word saved successfully!";
    }
});

function updateSaveButton() {
    const isSaved = savedWords.some(
        (word) => word.toLowerCase() === currentWord.toLowerCase()
    );
    saveButton.classList.toggle("saved", isSaved);
    saveButton.textContent = isSaved ? "Saved" : "Save Word";
    saveButton.setAttribute("aria-pressed", String(isSaved));
}


/* =====================================
   8. DISPLAY SAVED WORDS
===================================== */

function displaySavedWords() {
    savedWordsList.innerHTML = "";

    if (savedWords.length === 0) {
        const emptyState = document.createElement("li");
        emptyState.className = "empty-state";
        emptyState.textContent = "No saved words yet.";
        savedWordsList.appendChild(emptyState);
        return;
    }

    for (let i = 0; i < savedWords.length; i++) {
        const word = savedWords[i];

        const listItem = document.createElement("li");

        // Create a button to search for the saved word
        const wordButton = document.createElement("button");

        wordButton.textContent = word;
        wordButton.type = "button";
        wordButton.className = "saved-word-button";

        wordButton.addEventListener("click", function () {
            wordInput.value = word;
            searchForm.requestSubmit();
        });

        // Create a button to remove the saved word
        const removeButton = document.createElement("button");

        removeButton.textContent = "Remove";
        removeButton.type = "button";
        removeButton.className = "remove-word-button";

        removeButton.addEventListener("click", function () {
            removeSavedWord(word);
        });

        listItem.appendChild(wordButton);
        listItem.appendChild(removeButton);

        savedWordsList.appendChild(listItem);
    }
}


/* =====================================
   9. REMOVE A SAVED WORD
===================================== */

function removeSavedWord(word) {
    const updatedWords = savedWords.filter(
        (savedWord) => savedWord !== word
    );

    if (!saveWordsToStorage(updatedWords)) {
        message.textContent =
            "Could not remove this word. Check your browser storage settings.";
        return;
    }

    savedWords = updatedWords;
    displaySavedWords();
    updateSaveButton();

    message.textContent = "Saved word removed.";
}


/* =====================================
   10. SWITCH THEME
===================================== */

function setTheme(isLight, savePreference) {
    document.body.classList.toggle("light-theme", isLight);
    themeButton.textContent = isLight
        ? "Switch to Dark Theme"
        : "Switch to Light Theme";
    themeButton.setAttribute("aria-pressed", String(isLight));

    if (savePreference) {
        try {
            localStorage.setItem(
                "wordlyTheme",
                isLight ? "light" : "dark"
            );
        } catch (error) {
            message.textContent =
                "Theme changed, but the preference could not be saved.";
        }
    }
}

themeButton.addEventListener("click", function () {
    const isLight = !document.body.classList.contains("light-theme");
    setTheme(isLight, true);
});

try {
    setTheme(localStorage.getItem("wordlyTheme") === "light", false);
} catch (error) {
    setTheme(false, false);
}

/* =====================================
   11. LOAD SAVED WORDS
===================================== */

displaySavedWords();
