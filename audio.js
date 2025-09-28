const audio = new Audio('click.mp3'); // Puedes cambiar por tu archivo de sonido

function playSound() {
    audio.currentTime = 0;
    audio.play();
}
