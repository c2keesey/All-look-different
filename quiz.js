// Quiz data - 18 people with their nationalities
// Using placeholder images - replace with actual photos
const quizData = [
    { id: 1, nationality: "british", image: "images/person1.jpg" },
    { id: 2, nationality: "german", image: "images/person2.jpg" },
    { id: 3, nationality: "french", image: "images/person3.jpg" },
    { id: 4, nationality: "british", image: "images/person4.jpg" },
    { id: 5, nationality: "german", image: "images/person5.jpg" },
    { id: 6, nationality: "french", image: "images/person6.jpg" },
    { id: 7, nationality: "british", image: "images/person7.jpg" },
    { id: 8, nationality: "german", image: "images/person8.jpg" },
    { id: 9, nationality: "french", image: "images/person9.jpg" },
    { id: 10, nationality: "british", image: "images/person10.jpg" },
    { id: 11, nationality: "german", image: "images/person11.jpg" },
    { id: 12, nationality: "french", image: "images/person12.jpg" },
    { id: 13, nationality: "british", image: "images/person13.jpg" },
    { id: 14, nationality: "german", image: "images/person14.jpg" },
    { id: 15, nationality: "french", image: "images/person15.jpg" },
    { id: 16, nationality: "british", image: "images/person16.jpg" },
    { id: 17, nationality: "german", image: "images/person17.jpg" },
    { id: 18, nationality: "french", image: "images/person18.jpg" }
];

// Quiz state
let currentQuestion = 0;
let answers = [];
let shuffledQuiz = [];

// DOM Elements
const introScreen = document.getElementById('intro-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const progressText = document.getElementById('progress');
const personPhoto = document.getElementById('person-photo');
const optionBtns = document.querySelectorAll('.option-btn');
const scoreDisplay = document.getElementById('score');
const scoreMessage = document.getElementById('score-message');
const resultsBreakdown = document.getElementById('results-breakdown');

// Utility function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Switch between screens
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Start the quiz
function startQuiz() {
    currentQuestion = 0;
    answers = [];
    shuffledQuiz = shuffleArray(quizData);
    showScreen(quizScreen);
    loadQuestion();
}

// Load current question
function loadQuestion() {
    const question = shuffledQuiz[currentQuestion];
    progressText.textContent = `Question ${currentQuestion + 1} of ${shuffledQuiz.length}`;

    // Set image - use placeholder if image doesn't load
    personPhoto.src = question.image;
    personPhoto.onerror = function() {
        // Generate a placeholder with a number
        this.src = `https://ui-avatars.com/api/?name=${question.id}&background=random&size=300&font-size=0.5`;
    };

    // Reset button states
    optionBtns.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'incorrect');
        btn.disabled = false;
    });
}

// Handle answer selection
function selectAnswer(nationality) {
    const question = shuffledQuiz[currentQuestion];
    const isCorrect = nationality === question.nationality;

    // Store the answer
    answers.push({
        question: question,
        userAnswer: nationality,
        correct: isCorrect
    });

    // Show feedback on buttons
    optionBtns.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.answer === nationality) {
            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        if (btn.dataset.answer === question.nationality) {
            btn.classList.add('correct');
        }
    });

    // Move to next question after delay
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < shuffledQuiz.length) {
            loadQuestion();
        } else {
            showResults();
        }
    }, 1000);
}

// Show results
function showResults() {
    const correctCount = answers.filter(a => a.correct).length;
    scoreDisplay.textContent = correctCount;

    // Set message based on score
    if (correctCount >= 15) {
        scoreMessage.textContent = "Incredible! You have an exceptional eye for European features!";
    } else if (correctCount >= 12) {
        scoreMessage.textContent = "Great job! You're better than most at distinguishing Europeans!";
    } else if (correctCount >= 9) {
        scoreMessage.textContent = "Not bad! You're above average!";
    } else if (correctCount >= 6) {
        scoreMessage.textContent = "About average. Europeans can be tricky to tell apart!";
    } else {
        scoreMessage.textContent = "Looks like all Europeans look the same to you!";
    }

    // Build results breakdown
    resultsBreakdown.innerHTML = '';
    answers.forEach((answer, index) => {
        const div = document.createElement('div');
        div.className = 'result-item';

        const nationalityLabels = {
            british: 'British',
            german: 'German',
            french: 'French'
        };

        div.innerHTML = `
            <img src="${answer.question.image}"
                 onerror="this.src='https://ui-avatars.com/api/?name=${answer.question.id}&background=random&size=100&font-size=0.5'">
            <div class="result-info">
                <div class="your-answer">Your answer: ${nationalityLabels[answer.userAnswer]}</div>
                <div class="correct-answer" style="color: ${answer.correct ? '#4caf50' : '#f44336'}">
                    Correct: ${nationalityLabels[answer.question.nationality]}
                </div>
            </div>
            <div class="result-icon ${answer.correct ? 'correct' : 'incorrect'}">
                ${answer.correct ? '✓' : '✗'}
            </div>
        `;
        resultsBreakdown.appendChild(div);
    });

    showScreen(resultsScreen);
}

// Event listeners
startBtn.addEventListener('click', startQuiz);
retryBtn.addEventListener('click', () => {
    showScreen(introScreen);
});

optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        selectAnswer(btn.dataset.answer);
    });
});
