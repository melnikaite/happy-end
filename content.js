handlePlayingVideo = (video, bestStopMoment) => {
    const currentTime = Math.round(video.currentTime);
    const timerBlock = getTimerBlock();
    if (currentTime >= bestStopMoment - 15 && currentTime < bestStopMoment) {
        timerBlock.textContent = Math.round(bestStopMoment - currentTime).
            toFixed();
        timerBlock.style.display = 'block';
    }
    if (currentTime === bestStopMoment) {
        video.pause();
        timerBlock.style.display = 'none';
    }
};

findPlayingVideo = (d = document) => {
    for (const video of d.querySelectorAll('video')) {
        if (video.currentTime > 0 && !video.paused && !video.ended &&
            video.readyState > 2) {
            return video;
        }
    }
    for (const iframe of d.querySelectorAll('iframe')) {
        if (iframe.contentDocument) {
            return findPlayingVideo(iframe.contentDocument);
        }
    }
};

getTimerBlock = () => {
    if (document.fullscreenElement) {
        const timerBlock = document.fullscreenElement.querySelector(
            '#timerBlock');
        if (timerBlock) return timerBlock;
        const newTimerBlock = document.createElement('div');
        newTimerBlock.id = 'timerBlock';
        document.fullscreenElement.appendChild(newTimerBlock);
    } else {
        const timerBlock = document.body.querySelector('#timerBlock');
        if (timerBlock) return timerBlock;
        const newTimerBlock = document.createElement('div');
        newTimerBlock.id = 'timerBlock';
        document.body.appendChild(newTimerBlock);
    }
};
