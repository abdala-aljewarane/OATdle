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
const prevQuestionButton = document.getElementById('prev-question-button');
const nextQuestionButton = document.getElementById('next-question-button');

// =================================================================================
// GAME STATE & DATA
// =================================================================================
let questions = [];
let currentQuestionIndex = 0;
let currentQuestion = null;
let gameFinished = false;

// =================================================================================
// INITIALIZATION
// =================================================================================

/**
 * Initializes the application.
 */
async function init() {
    const loadedQuestions = await fetchQuestions();
    questions = loadedQuestions;
    if (questions.length > 0) {
        displayQuestion(questions[currentQuestionIndex]);
    }
}

init();

// =================================================================================
// DATA HANDLING (QUESTIONS)
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
        return data.questions;
    } catch (error) {
        console.error("Could not fetch questions:", error);
        questionStem.textContent = "Failed to load questions. Please try refreshing the page.";
        return [];
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
    if (!question) {
        questionStem.textContent = "No questions available.";
        return;
    }
    currentQuestion = question;
    gameFinished = false;
    feedbackText.textContent = '';
    explanationContainer.style.display = 'none';
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
    if (gameFinished) return;

    gameFinished = true;
    const correctAnswer = currentQuestion.answer;
    const isCorrect = selectedAnswer === correctAnswer;

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

    setTimeout(() => {
        feedbackText.textContent = isCorrect ? "Correct!" : "Incorrect!";
        explanationText.textContent = currentQuestion.explanation;
        explanationContainer.style.display = 'block';
    }, options.length * 300);
}

// =================================================================================
// EVENT LISTENERS
// =================================================================================

optionsContainer.addEventListener('click', (event) => {
    const selectedOption = event.target.closest('.option');
    if (selectedOption && !gameFinished) {
        handleAnswerSubmission(selectedOption.dataset.option);
    }
});

document.addEventListener('keydown', (event) => {
    if (gameFinished) return;
    const key = event.key.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(key)) {
        handleAnswerSubmission(key);
    }
});

prevQuestionButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(questions[currentQuestionIndex]);
    }
});

nextQuestionButton.addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(questions[currentQuestionIndex]);
    }
});
