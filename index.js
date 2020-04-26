class Cameras {
  constructor() {
    this.grid = document.querySelector('.grid');
    this.video = document.querySelectorAll('.grid__video');
    this.controlls = document.querySelector('.controls');
    this.inputVolume = document.querySelector('.controls__volume')
    this.brightness = document.querySelector(`.controls__brightness`);
    this.contrast = document.querySelector(`.controls__contrast`);
    this.volumeMeter = document.querySelector(`.controls__volume-meter`);
  }

  openFullScreen = (e) => {
    e.preventDefault();
    this.videoFullScreen = e.target
    this.videoFullScreen.classList.add('grid__video_fullscreen');
    this.controlls.classList.add('open');
    this.addFilter(this.videoFullScreen);
    this.loop();
  }

  allCameras = (e) => {
    this.video.forEach((v) => {
      v.classList.remove('grid__video_fullscreen');
      v.muted = true;
      v.volume = 0;
    });
    window.cancelAnimationFrame(this.requestId);
    this.controlls.classList.remove('open');
    this.inputVolume.value = 0;
  }

  setVolume = (e) => {
    const video = document.querySelector('.grid__video_fullscreen');
    const volume = event.target.value;
    if (volume > 0) {
      video.muted = false
      video.volume = volume;
    } else {
      video.muted = true
      video.volume = volume;
    }
  }

  addFilter = (target) => {
    const brightness = target.getAttribute(`data-brightness`);
    const contrast = target.getAttribute(`data-contrast`);
    target.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  }

  updateFilter = () => {
    if (this.brightness)
      this.videoFullScreen.dataset.brightness = this.brightness.value;
    if (this.contrast)
      this.videoFullScreen.dataset.contrast = this.contrast.value;
    this.addFilter(this.videoFullScreen);
  }


  createAudioContex = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const merger = audioCtx.createChannelMerger(1);
    merger.connect(audioCtx.destination);


    this.video.forEach((videoSource) => {
      const source = audioCtx.createMediaElementSource(videoSource);
      source.connect(merger);
    });


    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 32;
    merger.connect(this.analyser);

    this.streamData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  getVolume() {
    // записываем данные в streamData
    this.analyser.getByteFrequencyData(this.streamData);
    // усредняем
    let total = 0;
    for (let i = 0; i < this.streamData.length; i++) {
      total += this.streamData[i];
    }

    return this.streamData.reduce((acc, val) => acc + val, 0) / 255 / this.streamData.length;
  }

  loop = () => {
    const volume = this.getVolume();
    this.volumeMeter.style.transform = `scaleX(${volume})`;

    this.requestId = requestAnimationFrame(this.loop);
  }

}
const CameraInst = new Cameras();

document.addEventListener('DOMContentLoaded', () => {
  CameraInst.createAudioContex();
  CameraInst.grid.addEventListener('click', CameraInst.openFullScreen);
  const button = document.querySelector('.controls__close');
  button.addEventListener('click', e => {
    CameraInst.allCameras(e);
  });

  CameraInst.controlls.addEventListener('change', e => {
    if (e.target.classList.contains('controls__volume')) {
      CameraInst.setVolume(e);
    } else if (e.target.classList.contains('controls__brightness') || e.target.classList.contains('controls__contrast')) {
      CameraInst.updateFilter()
    }
  });
});