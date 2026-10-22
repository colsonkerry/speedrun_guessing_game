// Save this as js/taskbar.js and load it with <script type="module" src="js/taskbar.js"></script>

// Open the matching dialog when a taskbar button is clicked
document.querySelectorAll("[data-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
        document.getElementById(button.dataset.dialog).showModal();
    });
});

// Close a dialog when the dark area behind it is clicked.
// The padding lives on .dialog-body, so a click that lands on the dialog itself is a backdrop click.
document.querySelectorAll(".menu-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});

// Options: "Reduce motion", saved in this browser
const reduceMotionBox = document.getElementById("reduce-motion");

function applyReduceMotion(on) {
    document.documentElement.toggleAttribute("data-reduce-motion", on);
}

try {
    const saved = localStorage.getItem("reduceMotion") === "true";
    reduceMotionBox.checked = saved;
    applyReduceMotion(saved);
} catch (error) {
    // Storage can be unavailable (for example in private browsing); the option just won't be remembered
}

reduceMotionBox.addEventListener("change", () => {
    applyReduceMotion(reduceMotionBox.checked);
    try {
        localStorage.setItem("reduceMotion", reduceMotionBox.checked);
    } catch (error) {
        // Ignore: the setting still applies for this visit
    }
});