
const leftButton = document.getElementById("left-button");
const rightButton = document.getElementById("right-button");

const games = [{name: "Elden Ring", image: "images/elden_ring.png", time: 3105}, 
    {name: "Dark Souls III", image: "images/dark_souls_iii.png", time: 1482},
    {name: "Borderlands 2", image: "images/borderlands_2.png", time: 6569},
    {name: "Grand Theft Auto V", image: "images/grand_theft_auto_v.png", time: 20214},
    {name: "Baldur's Gate III", image: "images/baldur's_gate_iii.jpg", time: 199},
    {name: "Minecraft", image: "images/minecraft.png", time: 399},
    {name: "Hollow Knight", image: "images/hollow_knight.png", time: 1845},
];


var leftGameIndex = 0;
var rightGameIndex = 1;

var leftGame = games[leftGameIndex];
var rightGame = games[rightGameIndex];

leftButton.addEventListener("click", function() {
    if (leftGame.time < rightGame.time) {
        alert("Correct! "  + leftGame.time + " " +rightGame.time);
    } else {
        alert("Incorrect! "  + leftGame.time + " " +rightGame.time);
    }

    changeGames();

    //reveal time text()
    // await waitForInput();

});

rightButton.addEventListener("click", function() {
    if (leftGame.time > rightGame.time) {
        alert("Correct! "  + leftGame.time + " " +rightGame.time);
    } else {
        alert("Incorrect! "  + leftGame.time + " " +rightGame.time);
    }

    changeGames();
});

function changeGames() {
    leftGameIndex = Math.floor(Math.random() * 6);

    do {
    rightGameIndex = Math.floor(Math.random() * 6);
    } while (rightGameIndex == leftGameIndex);

    leftGame = games[leftGameIndex];
    rightGame = games[rightGameIndex];

    updateCards(leftGame, rightGame);
};

function waitForInput() {
    return new Promise((resolve) => {
        function handleKey(input) {
            if (event.code === 'Space') {
                window.removeEventListener('keydown', handleKey);
                resolve();
            }
        }
        window.addEventListener('keydown', handleKey);
    })
}

function updateCards(leftGame, rightGame) {
    document.getElementById("left-button-image").src = leftGame.image;
    document.getElementById("left-button-text").innerText = leftGame.name;
    document.getElementById("left-game-time").innerText = formatTime(leftGame.time);

    document.getElementById("right-button-image").src = rightGame.image;
    document.getElementById("right-button-text").innerText = rightGame.name;
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