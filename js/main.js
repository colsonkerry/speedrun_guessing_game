import data from '../data/games.json' with { type: 'json' };

const leftButton = document.getElementById("left-button");
const rightButton = document.getElementById("right-button");
const nextButton = document.getElementById("next-button");

const games = [];

data.forEach((game) => {
    games.push({name: game.name, image: game.image, time: game.time, category: game.category})
});

var waitingForNext = false;
var leftGameIndex;
var rightGameIndex;
var currentGameTimes;
var previousLeftGameIndex;
var previousRightGameIndex;

// Initial shuffle and hide next button
changeGames();

var leftGame = games[leftGameIndex];
var rightGame = games[rightGameIndex];

leftButton.addEventListener("click", function() {
    checkAnswer(leftButton);
});

rightButton.addEventListener("click", function() {
    checkAnswer(rightButton);
});

nextButton.addEventListener("click", function() {
    waitingForNext = false;
    toggleNextVisibility();
    toggleTimeVisibility();
    changeGames();
    document.getElementById("correct-or-incorrect").innerText = ""
});

function checkAnswer(button) {
    if (button == leftButton) {
        if (leftGame.time < rightGame.time) {
            document.getElementById("correct-or-incorrect").innerText = "Correct!"
        } else {
            document.getElementById("correct-or-incorrect").innerText = "Incorrect!"
        }
    } else {
        if (leftGame.time > rightGame.time) {
            document.getElementById("correct-or-incorrect").innerText = "Correct!"
        } else {
            document.getElementById("correct-or-incorrect").innerText = "Incorrect!"
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
    do {
        leftGameIndex = Math.floor(Math.random() * games.length);
    } while (leftGameIndex == previousLeftGameIndex || leftGameIndex == previousRightGameIndex)
    do {
    rightGameIndex = Math.floor(Math.random() * games.length);
    } while (rightGameIndex == leftGameIndex || rightGameIndex == previousRightGameIndex || rightGameIndex == previousLeftGameIndex);

    leftGame = games[leftGameIndex];
    previousLeftGameIndex = leftGameIndex;
    rightGame = games[rightGameIndex];
    previousRightGameIndex = rightGameIndex;

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