import data from '../data/games.json' with { type: 'json' };

const leftButton = document.getElementById("left-button");
const rightButton = document.getElementById("right-button");
const nextButton = document.getElementById("next-button");
const resultsScreen = document.getElementById("results-screen");
const instructionsScreen = document.getElementById("instructions-modal");
const startButton = document.getElementById("start-game-button");

instructionsScreen.showModal();

const scoreSquares = document.querySelectorAll(".score-square");
let round = 0;
let correctCount = 0;

const games = [];
const todaysGames = [];

var randIndex;
var previousRandIndex = [];

data.forEach((game) => {
    games.push({name: game.name, image: game.image, time: game.time, category: game.category})
});

for (let i = 0; i < 10 ; i++) {
    do {
        randIndex = Math.floor(Math.random() * games.length);
    } while (previousRandIndex.includes(randIndex));
    previousRandIndex.push(randIndex);
    todaysGames.push({name: games[randIndex].name, image: games[randIndex].image, time: games[randIndex].time, category: games[randIndex].category});
    console.log(todaysGames[i].name);
    console.log(previousRandIndex);
}

var waitingForNext = false;
var leftGameIndex = 0;
var rightGameIndex = 1;
var currentGameTimes;
var previousLeftGameIndex;
var previousRightGameIndex;

var leftGame = todaysGames[leftGameIndex];
var rightGame = todaysGames[rightGameIndex];
updateCards(leftGame, rightGame);

startButton.addEventListener("click", function() {
    instructionsScreen.close();
});

leftButton.addEventListener("click", function() {
    checkAnswer(leftButton);
});

rightButton.addEventListener("click", function() {
    checkAnswer(rightButton);
});

nextButton.addEventListener("click", function() {
    if (nextButton.innerText === "See Results!") {
        document.getElementById("results-header").innerText = `You got ${correctCount} / 5 correct!`
        document.getElementById("results-body").innerHTML = "<br>Copy your results and <strong>share</strong> with your friends!<br><br>Come back tomorrow for a new set of games<br>or visit the <strong>archive</strong> to play more!"
        resultsScreen.showModal();
    }

    if (waitingForNext == false) {
        return;
    }
    document.getElementById("left-card").classList = "card";
    document.getElementById("right-card").classList = "card";

    waitingForNext = false;

    toggleNextVisibility();
    toggleTimeVisibility();
    changeGames();

    document.getElementById("correct-or-incorrect").innerText = ""
    document.getElementById("correct-or-incorrect").className = '';
    document.getElementById("left-game-time").classList.remove("correct");
    document.getElementById("left-game-time").classList.remove("incorrect");
    document.getElementById("right-game-time").classList.remove("correct");
    document.getElementById("right-game-time").classList.remove("incorrect");
});

function checkAnswer(button) {
    if (waitingForNext == true) {
        return;
    }
    const isCorrect = button == leftButton
        ? leftGame.time < rightGame.time
        : leftGame.time > rightGame.time;
    
    scoreSquares[round].classList.add(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
        correctCount++;
        scoreSquares[round + 5].classList.add("correct");
    } else {
        scoreSquares[round + 5].classList.add("incorrect");
    }
    round++;

    if (round === (scoreSquares.length - 5)) {
        nextButton.innerText = "See Results!"
    }

    if (button == leftButton) {
        if (leftGame.time < rightGame.time) {
            //Left button & Correct
            document.getElementById("correct-or-incorrect").innerText = "Correct!"
            document.getElementById("correct-or-incorrect").classList.add("correct")
            document.getElementById("left-card").classList.add("correct");
            document.getElementById("right-card").classList.add("incorrect");
            document.getElementById("left-game-time").classList.add("correct");
            document.getElementById("right-game-time").classList.add("incorrect");
            document.getElementById("left-card").classList.add("selected");
            document.getElementById("right-card").classList.add("unselected");
        } else {
            //Left button & Incorrect
            document.getElementById("correct-or-incorrect").innerText = "Incorrect!"
            document.getElementById("correct-or-incorrect").classList.add("incorrect")
            document.getElementById("left-card").classList.add("incorrect");
            document.getElementById("right-card").classList.add("correct");
            document.getElementById("left-game-time").classList.add("incorrect");
            document.getElementById("right-game-time").classList.add("correct");
            document.getElementById("left-card").classList.add("selected");
            document.getElementById("right-card").classList.add("unselected");
        }
    } else {
        if (leftGame.time > rightGame.time) {
            //Right button & Correct
            document.getElementById("correct-or-incorrect").innerText = "Correct!"
            document.getElementById("correct-or-incorrect").classList.add("correct")
            document.getElementById("right-card").classList.add("correct");
            document.getElementById("left-card").classList.add("incorrect");
            document.getElementById("right-game-time").classList.add("correct");
            document.getElementById("left-game-time").classList.add("incorrect");
            document.getElementById("right-card").classList.add("selected");
            document.getElementById("left-card").classList.add("unselected");
        } else {
            //Right button & Incorrect
            document.getElementById("correct-or-incorrect").innerText = "Incorrect!"
            document.getElementById("correct-or-incorrect").classList.add("incorrect")
            document.getElementById("right-card").classList.add("incorrect");
            document.getElementById("left-card").classList.add("correct");
            document.getElementById("right-game-time").classList.add("incorrect");
            document.getElementById("left-game-time").classList.add("correct");
            document.getElementById("right-card").classList.add("selected");
            document.getElementById("left-card").classList.add("unselected");
        }
    }
    toggleNextVisibility();
    toggleTimeVisibility();
    waitingForNext = true;
    
}

function toggleNextVisibility() {
    document.getElementById("next-button").classList.toggle("hidden");

    // if (document.getElementsByClassName("next-button").style.visibility == "hidden") {
    //     document.getElementsByClassName("next-button").style.visibility = "visible";
    // } else {
    //     document.getElementById("next-button").style.visibility = "hidden"
    // }
}

function toggleTimeVisibility() {
    document.querySelectorAll(".game-time").forEach(el => el.classList.toggle("hidden"));
    //  currentGameTimes.forEach(toggle("hidden"));
//     if (document.getElementByClass("game-time").style.visibility == "hidden") {
//         document.getElementByClass("game-time").style.visibility = "visible";
//     } else {
//         document.getElementByClass("game-time").style.visibility = "hidden"
//     }
}

function changeGames() {
    leftGameIndex += 2;
    rightGameIndex += 2;
    leftGame = todaysGames[leftGameIndex];
    rightGame = todaysGames[rightGameIndex];

    updateCards(leftGame, rightGame);
};

function updateCards(leftGame, rightGame) {
    document.getElementById("left-button-image").src = leftGame.image;
    document.getElementById("left-button-text").innerText = leftGame.name;
    document.getElementById("left-game-category").innerText = leftGame.category;
    document.getElementById("left-game-time").innerText = formatTime(leftGame.time);

    document.getElementById("right-button-image").src = rightGame.image;
    document.getElementById("right-button-text").innerText = rightGame.name;
    document.getElementById("right-game-category").innerText = rightGame.category;
    document.getElementById("right-game-time").innerText = formatTime(rightGame.time);
}

function formatTime(gameTime) {
    const hours = Math.floor(gameTime / 3600);
    const minutes = Math.floor((gameTime % 3600) / 60);
    const seconds = Math.floor(gameTime % 60);

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
}