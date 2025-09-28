// audio.js
const spinAudio = new Audio('sounds/spin.mp3'); // sonido de giro
spinAudio.loop = true;

const victoryAudio = new Audio('sounds/victory.mp3'); // sonido de victoria

window.audioStartSpin = function() {
    spinAudio.currentTime = 0;
    spinAudio.play().catch(e=>console.warn('Audio bloqueado', e));
}

window.audioStopSpin = function() {
    spinAudio.pause();
    spinAudio.currentTime = 0;
}

window.audioPlayVictory = function() {
    victoryAudio.currentTime = 0;
    victoryAudio.play().catch(e=>console.warn('Audio bloqueado', e));
}
