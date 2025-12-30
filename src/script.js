// =================================================================================
// DOM & UI ELEMENTS
// =================================================================================
const questionSubject = document.getElementById('question-subject');
const questionDifficulty = document.getElementById('question-difficulty');
const questionStem = document.getElementById('question-stem');
const optionsContainer = document.getElementById('options-container');
const feedbackText = document.getElementById('feedback-text');
const explanationContainer = document.getElementById('explanation-container');
const explanationText = document.getElementById('explanation-text');
const countdownTimer = document.getElementById('countdown-timer');
const gamesPlayedEl = document.getElementById('games-played');
const winPercentageEl = document.getElementById('win-percentage');
const currentStreakEl = document.getElementById('current-streak');
const maxStreakEl = document.getElementById('max-streak');
const shareButton = document.getElementById('share-button');

// Modals
const statsModal = document.getElementById('stats-modal');
const settingsModal = document.getElementById('settings-modal');
const helpModal = document.getElementById('help-modal');
const adminModal = document.getElementById('admin-modal');
const closeButtons = document.querySelectorAll('.close-button');

// Header Buttons
const helpButton = document.getElementById('help-button');
const statsButton = document.getElementById('stats-button');
const settingsButton = document.getElementById('settings-button');

// Admin Panel Elements
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginButton = document.getElementById('admin-login-button');
const adminDashboard = document.getElementById('admin-dashboard');
const adminLogin = document.getElementById('admin-login');
const questionList = document.getElementById('question-list');
const addQuestionButton = document.getElementById('add-question-button');
const setDailyQuestionButton = document.getElementById('set-daily-question-button');
const dailyQuestionIdInput = document.getElementById('daily-question-id');

// =================================================================================
// GAME STATE & DATA
// =================================================================================
let questions = [];
let currentQuestion = null;
let gameState = {
    gameFinished: false,
    lastPlayedTs: null,
    lastPlayedAnswer: null,
};
let userStats = {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
};
const ADMIN_PASSWORD = "oat";
let isAdmin = false;

// =================================================================================
// INITIALIZATION
// =================================================================================

/**
 * Initializes the application.
 */
async function init() {
    console.log("init() called");
    loadStats();
    loadGameState();
    const loadedQuestions = await fetchQuestions();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        adminModal.style.display = 'block';
    }
    
    const dailyQuestion = getDailyQuestion(loadedQuestions);
    displayQuestion(dailyQuestion);
    restoreGameState();
}

init();

// =================================================================================
// DATA HANDLING (QUESTIONS & LOCAL STORAGE)
// =================================================================================

/**
 * Fetches the questions from the JSON file.
 * @returns {Promise<Array>} A promise that resolves to the array of questions.
 */
async function fetchQuestions() {
    try {
        const res = await fetch('./src/questions.json');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log("Fetched questions:", data);
        questions = data.questions;
        return questions;
    } catch (error) {
        console.error("Could not fetch questions:", error);
        questionStem.textContent = "Failed to load questions. Please try refreshing the page.";
        return [];
    }
}

/**
 * Gets the question for the current day based on the day of the year.
 * @param {Array} questions - The array of questions.
 * @returns {Object|null} The question for the current day, or null if not found.
 */
function getDailyQuestion(questions) {
    if (!questions || questions.length === 0) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const questionIndex = dayOfYear % questions.length;
    return questions[questionIndex];
}

// --- Local Storage Functions ---

function saveStats() {
    localStorage.setItem('oatdleStats', JSON.stringify(userStats));
}

function loadStats() {
    const stats = localStorage.getItem('oatdleStats');
    if (stats) {
        userStats = JSON.parse(stats);
    }
}

function saveGameState() {
    localStorage.setItem('oatdleGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const state = localStorage.getItem('oatdleGameState');
    if (state) {
        const savedState = JSON.parse(state);
        if (new Date(savedState.lastPlayedTs).toDateString() === new Date().toDateString()) {
            gameState = savedState;
        }
    }
}

// =================================================================================
// GAME LOGIC
// =================================================================================

/**
 * Displays the current question and options on the page.
 * @param {Object} question - The question object to display.
 */
function displayQuestion(question) {
    console.log("displayQuestion called with:", question);
    if (!question) {
        questionStem.textContent = "No question available for today.";
        return;
    }
    currentQuestion = question;
    questionSubject.textContent = question.subject;
    questionDifficulty.textContent = question.difficulty;
    questionStem.textContent = question.question;

    optionsContainer.innerHTML = '';
    for (const [key, value] of Object.entries(question.options)) {
        const option = document.createElement('div');
        option.className = 'option';
        option.dataset.option = key;
        option.innerHTML = `<span class="option-letter">${key}</span> <span class="option-text">${value}</span>`;
        optionsContainer.appendChild(option);
    }
}

/**
 * Handles the submission of an answer.
 * @param {string} selectedAnswer - The letter of the selected answer (A, B, C, or D).
 */
function handleAnswerSubmission(selectedAnswer) {
    if (gameState.gameFinished) return;

    gameState.gameFinished = true;
    gameState.lastPlayedTs = new Date().getTime();
    gameState.lastPlayedAnswer = selectedAnswer;

    const correctAnswer = currentQuestion.answer;
    const isCorrect = selectedAnswer === correctAnswer;

    updateStats(isCorrect);
    
    // Animate the answer reveal
    const options = Array.from(optionsContainer.children);
    options.forEach((option, index) => {
        setTimeout(() => {
            option.classList.add('reveal');
            const optionLetter = option.dataset.option;

            if (optionLetter === selectedAnswer) {
                option.classList.add(isCorrect ? 'correct' : 'incorrect');
            } else if (optionLetter === correctAnswer) {
                option.classList.add('correct');
            }

        }, index * 300);
    });

    // Show feedback and explanation after animation
    setTimeout(() => {
        feedbackText.textContent = isCorrect ? "Correct!" : "Incorrect!";
        explanationText.textContent = currentQuestion.explanation;
        explanationContainer.style.display = 'block';

        saveStats();
        saveGameState();
        
        document.getElementById('countdown-container').style.display = 'block';
        startCountdown();
    }, options.length * 300);
}

/**
 * Updates the user's statistics based on the result of the game.
 * @param {boolean} isCorrect - Whether the user's answer was correct.
 */
function updateStats(isCorrect) {
    userStats.gamesPlayed += 1;
    if (isCorrect) {
        userStats.wins += 1;
        userStats.currentStreak += 1;
    } else {
        userStats.currentStreak = 0;
    }

    if (userStats.currentStreak > userStats.maxStreak) {
        userStats.maxStreak = userStats.currentStreak;
    }
}

/**
 * If a game was already played today, this function restores the visual state.
 */
function restoreGameState() {
    if (gameState.gameFinished) {
        gameState.gameFinished = false;
        handleAnswerSubmission(gameState.lastPlayedAnswer);
    }
}

/**
 * Starts the countdown timer to the next day.
 */
function startCountdown() {
    const interval = setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diff = tomorrow - now;

        if (diff <= 0) {
            clearInterval(interval);
            countdownTimer.textContent = "00:00:00";
            window.location.reload();
            return;
        }

        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        countdownTimer.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// =================================================================================
// EVENT LISTENERS
// =================================================================================

// --- Game Interactions ---
optionsContainer.addEventListener('click', (event) => {
    console.log('optionsContainer clicked', event, gameState.gameFinished);
    const selectedOption = event.target.closest('.option');
    if (selectedOption && !gameState.gameFinished) {
        handleAnswerSubmission(selectedOption.dataset.option);
    }
});

document.addEventListener('keydown', (event) => {
    if (gameState.gameFinished) return;
    const key = event.key.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(key)) {
        handleAnswerSubmission(key);
    }
});

// --- Modal Controls ---
helpButton.onclick = () => helpModal.style.display = 'block';
statsButton.onclick = () => {
    updateStatsModal();
    statsModal.style.display = 'block';
};
settingsButton.onclick = () => {
    if (isAdmin) {
        adminModal.style.display = 'block';
    } else {
        settingsModal.style.display = 'block';
    }
};

closeButtons.forEach(button => {
    button.onclick = () => {
        button.closest('.modal').style.display = 'none';
    }
});

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// --- Share Functionality ---
shareButton.addEventListener('click', () => {
    if (!gameState.gameFinished) {
        alert("You must complete the daily question before sharing!");
        return;
    }

    const isCorrect = gameState.lastPlayedAnswer === currentQuestion.answer;
    const emoji = isCorrect ? '✅' : '❌';
    
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const shareText = `OATdle #${dayOfYear}
${emoji}`;

    navigator.clipboard.writeText(shareText).then(() => {
        shareButton.textContent = 'Copied!';
        setTimeout(() => {
            shareButton.textContent = 'Share';
        }, 2000);
    }, (err) => {
        console.error('Could not copy text: ', err);
    });
});

/**
 * Updates the content of the statistics modal.
 */
function updateStatsModal() {
    gamesPlayedEl.textContent = userStats.gamesPlayed;
    const winPercentage = userStats.gamesPlayed > 0 ? Math.round((userStats.wins / userStats.gamesPlayed) * 100) : 0;
    winPercentageEl.textContent = `${winPercentage}%`;
    currentStreakEl.textContent = userStats.currentStreak;
    maxStreakEl.textContent = userStats.maxStreak;
}

// =================================================================================
// ADMIN PANEL LOGIC
// =================================================================================
adminLoginButton.addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        showAdminDashboard();
    } else {
        alert('Incorrect password');
        adminPasswordInput.value = '';
    }
});

function showAdminDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'block';
    document.querySelector('h1').textContent = 'OATdle Admin';
    isAdmin = true;
    renderQuestionList();
}

function renderQuestionList() {
    questionList.innerHTML = '<em>Note: Changes are temporary for this session.</em>';
    questions.forEach(q => {
        const qElement = document.createElement('div');
        qElement.className = 'question-item';
        qElement.innerHTML = `
            <span>${q.id}: ${q.question.substring(0, 40)}...</span>
            <button data-id="${q.id}" class="delete-question-button">Delete</button>
        `;
        questionList.appendChild(qElement);
    });
}

questionList.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-question-button')) {
        const questionId = parseInt(event.target.dataset.id, 10);
        questions = questions.filter(q => q.id !== questionId);
        renderQuestionList();
    }
});

addQuestionButton.addEventListener('click', () => {
    const newQuestion = {
        id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1,
        subject: document.getElementById('new-question-subject').value,
        difficulty: document.getElementById('new-question-difficulty').value,
        question: document.getElementById('new-question-stem').value,
        options: {
            A: document.getElementById('new-option-A').value,
            B: document.getElementById('new-option-B').value,
            C: document.getElementById('new-option-C').value,
            D: document.getElementById('new-option-D').value
        },
        answer: document.getElementById('new-question-answer').value.toUpperCase(),
        explanation: document.getElementById('new-question-explanation').value
    };

    if (newQuestion.question && newQuestion.answer && newQuestion.options.A && newQuestion.options.B && newQuestion.options.C && newQuestion.options.D) {
        questions.push(newQuestion);
        renderQuestionList();
        document.getElementById('add-question-form').reset();
    } else {
        alert('Please fill out all fields for the new question.');
    }
});

setDailyQuestionButton.addEventListener('click', () => {
    const questionId = parseInt(dailyQuestionIdInput.value, 10);
    const question = questions.find(q => q.id === questionId);
    if (question) {
        displayQuestion(question);
        // Reset game state for the new question
        gameState.gameFinished = false;
        feedbackText.textContent = '';
        explanationContainer.style.display = 'none';
        document.getElementById('countdown-container').style.display = 'none';
        adminModal.style.display = 'none';
    } else {
        alert('Question not found.');
    }
});

