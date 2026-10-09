/**
 * SPEED BRAIN — Complete Neon Reaction Game Logic
 * Pure Vanilla JavaScript · Web Audio API · Zero External Dependencies
 */

(function () {
  'use strict';

  /* ==========================================================================
     AUDIO SYNTHESIS ENGINE (Web Audio API)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.volume = 0.5;
      
      // Load saved sound preference
      const savedMute = localStorage.getItem('speedBrain_soundMuted');
      if (savedMute !== null) {
        this.enabled = savedMute !== 'true';
      }
      const savedVol = localStorage.getItem('speedBrain_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol) || 0.5;
      }
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('speedBrain_soundMuted', (!this.enabled).toString());
      return this.enabled;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.3, pitchSlide = null) {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (pitchSlide) {
          osc.frequency.exponentialRampToValueAtTime(pitchSlide, now + duration);
        }

        gain.gain.setValueAtTime(this.volume * gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        // Silently handle audio context restrictions
      }
    }

    playClick() {
      this.playTone(800, 'sine', 0.04, 0.15, 600);
    }

    playCountdownTick(isGo = false) {
      if (isGo) {
        this.playTone(880, 'sine', 0.25, 0.4, 1100);
      } else {
        this.playTone(520, 'sine', 0.1, 0.25);
      }
    }

    playCorrect(streak = 1) {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // Ascending major chord
        const base = 440 + Math.min(streak * 25, 200);
        const freqs = [base, base * 1.25, base * 1.5];
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          const startT = now + idx * 0.05;
          const dur = 0.18;
          gain.gain.setValueAtTime(this.volume * 0.25, startT);
          gain.gain.exponentialRampToValueAtTime(0.001, startT + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startT);
          osc.stop(startT + dur);
        });
      } catch (e) {}
    }

    playIncorrect() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);

        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    }

    playStreakMilestone() {
      if (!this.enabled || !this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((f, idx) => {
          setTimeout(() => {
            this.playTone(f, 'sine', 0.2, 0.35);
          }, idx * 70);
        });
      } catch (e) {}
    }

    playGameOver() {
      if (!this.enabled || !this.ctx) return;
      try {
        const notes = [440, 392, 349.23, 293.66];
        notes.forEach((f, idx) => {
          setTimeout(() => {
            this.playTone(f, 'sawtooth', 0.25, 0.2);
          }, idx * 100);
        });
      } catch (e) {}
    }

    playHighScore() {
      if (!this.enabled || !this.ctx) return;
      try {
        const notes = [523, 659, 783, 1046, 1318];
        notes.forEach((f, idx) => {
          setTimeout(() => {
            this.playTone(f, 'triangle', 0.3, 0.35);
          }, idx * 80);
        });
      } catch (e) {}
    }
  }

  /* ==========================================================================
     BACKGROUND PARTICLES CANVAS
     ========================================================================== */
  class ParticleBackground {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.numParticles = 40;
      this.animationId = null;
      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize());

      for (let i = 0; i < this.numParticles; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          color: Math.random() > 0.5 ? 'rgba(0, 240, 255, ' : 'rgba(157, 78, 221, ',
          alpha: Math.random() * 0.5 + 0.2
        });
      }
      this.start();
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    start() {
      const render = () => {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
          for (let j = i + 1; j < this.particles.length; j++) {
            const dx = this.particles[i].x - this.particles[j].x;
            const dy = this.particles[i].y - this.particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
              this.ctx.beginPath();
              this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
              this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
              this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / 110)})`;
              this.ctx.lineWidth = 0.75;
              this.ctx.stroke();
            }
          }
        }

        // Draw and update particles
        for (const p of this.particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = this.canvas.width;
          if (p.x > this.canvas.width) p.x = 0;
          if (p.y < 0) p.y = this.canvas.height;
          if (p.y > this.canvas.height) p.y = 0;

          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = p.color + p.alpha + ')';
          this.ctx.fill();
        }

        this.animationId = requestAnimationFrame(render);
      };
      this.animationId = requestAnimationFrame(render);
    }
  }

  /* ==========================================================================
     MATH QUESTION GENERATOR
     ========================================================================== */
  class QuestionGenerator {
    static generate(difficulty, roundIndex = 0) {
      switch (difficulty) {
        case 'casual':
          return this.generateCasual();
        case 'pro':
          return this.generatePro(roundIndex);
        case 'normal':
        default:
          return this.generateNormal(roundIndex);
      }
    }

    static generateCasual() {
      const ops = ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b, answer, questionText, category;

      if (op === '+') {
        a = Math.floor(Math.random() * 25) + 3;
        b = Math.floor(Math.random() * 25) + 3;
        answer = a + b;
        questionText = `${a} + ${b}`;
        category = 'Addition';
      } else if (op === '-') {
        b = Math.floor(Math.random() * 20) + 2;
        answer = Math.floor(Math.random() * 25) + 3;
        a = answer + b; // ensures positive
        questionText = `${a} - ${b}`;
        category = 'Subtraction';
      } else {
        // Multiplication (tables 2, 3, 4, 5, 10)
        const tables = [2, 3, 4, 5, 10];
        a = tables[Math.floor(Math.random() * tables.length)];
        b = Math.floor(Math.random() * 9) + 2;
        answer = a * b;
        questionText = `${a} × ${b}`;
        category = 'Multiplication';
      }

      const choices = this.buildChoices(answer, 20);
      return { questionText, answer, choices, category };
    }

    static generateNormal(roundIndex) {
      const ops = ['+', '-', '×', '÷'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b, answer, questionText, category;

      if (op === '+') {
        a = Math.floor(Math.random() * 60) + 12;
        b = Math.floor(Math.random() * 60) + 12;
        answer = a + b;
        questionText = `${a} + ${b}`;
        category = 'Addition';
      } else if (op === '-') {
        b = Math.floor(Math.random() * 50) + 10;
        answer = Math.floor(Math.random() * 60) + 8;
        a = answer + b;
        questionText = `${a} - ${b}`;
        category = 'Subtraction';
      } else if (op === '×') {
        a = Math.floor(Math.random() * 11) + 2; // 2-12
        b = Math.floor(Math.random() * 11) + 2; // 2-12
        answer = a * b;
        questionText = `${a} × ${b}`;
        category = 'Multiplication';
      } else {
        // Division: clean integers
        b = Math.floor(Math.random() * 9) + 2; // 2-10
        answer = Math.floor(Math.random() * 12) + 2;
        a = b * answer;
        questionText = `${a} ÷ ${b}`;
        category = 'Division';
      }

      const choices = this.buildChoices(answer, 30);
      return { questionText, answer, choices, category };
    }

    static generatePro(roundIndex) {
      const types = ['add', 'sub', 'mul', 'div', 'compound'];
      const type = types[Math.floor(Math.random() * types.length)];
      let a, b, c, answer, questionText, category;

      if (type === 'compound') {
        // e.g. (3 * 7) + 14 or (8 * 9) - 16
        const m1 = Math.floor(Math.random() * 8) + 3;
        const m2 = Math.floor(Math.random() * 8) + 3;
        const prod = m1 * m2;
        const isAdd = Math.random() > 0.5;
        const offset = Math.floor(Math.random() * 20) + 5;

        if (isAdd) {
          answer = prod + offset;
          questionText = `(${m1} × ${m2}) + ${offset}`;
        } else {
          answer = prod - offset;
          questionText = `(${m1} × ${m2}) - ${offset}`;
        }
        category = 'Compound Math';
      } else if (type === 'mul') {
        // e.g. 14 × 7 or 18 × 4
        a = Math.floor(Math.random() * 15) + 6;
        b = Math.floor(Math.random() * 8) + 3;
        answer = a * b;
        questionText = `${a} × ${b}`;
        category = 'Fast Product';
      } else if (type === 'div') {
        b = Math.floor(Math.random() * 11) + 4;
        answer = Math.floor(Math.random() * 18) + 3;
        a = b * answer;
        questionText = `${a} ÷ ${b}`;
        category = 'Division';
      } else if (type === 'add') {
        a = Math.floor(Math.random() * 150) + 45;
        b = Math.floor(Math.random() * 150) + 45;
        answer = a + b;
        questionText = `${a} + ${b}`;
        category = 'Triple Addition';
      } else {
        b = Math.floor(Math.random() * 140) + 35;
        answer = Math.floor(Math.random() * 160) + 40;
        a = answer + b;
        questionText = `${a} - ${b}`;
        category = 'Subtraction';
      }

      const choices = this.buildChoices(answer, 40);
      return { questionText, answer, choices, category };
    }

    static buildChoices(correctAnswer, spread = 20) {
      const choicesSet = new Set([correctAnswer]);
      
      const candidates = [
        correctAnswer + 1,
        correctAnswer - 1,
        correctAnswer + 2,
        correctAnswer - 2,
        correctAnswer + 10,
        correctAnswer - 10,
        correctAnswer + 5,
        correctAnswer - 5,
        correctAnswer + 3,
        correctAnswer - 3
      ];

      candidates.sort(() => Math.random() - 0.5);

      for (const cand of candidates) {
        if (cand > 0 && cand !== correctAnswer) {
          choicesSet.add(cand);
          if (choicesSet.size >= 4) break;
        }
      }

      let attempts = 0;
      while (choicesSet.size < 4 && attempts < 25) {
        attempts++;
        const delta = Math.floor(Math.random() * spread) + 1;
        const val = Math.random() > 0.5 ? correctAnswer + delta : correctAnswer - delta;
        if (val > 0 && val !== correctAnswer) {
          choicesSet.add(val);
        }
      }

      let pad = 1;
      while (choicesSet.size < 4) {
        choicesSet.add(correctAnswer + pad);
        pad++;
      }

      const arr = Array.from(choicesSet);
      return arr.sort(() => Math.random() - 0.5);
    }
  }

  /* ==========================================================================
     CORE SPEED BRAIN GAME STATE CONTROLLER
     ========================================================================== */
  class SpeedBrainApp {
    constructor() {
      this.sound = new SoundEngine();
      this.particles = new ParticleBackground('bg-canvas');

      // State tracking
      this.state = 'HOME';
      this.difficulty = 'normal';
      this.gameMode = 'classic';

      // Gameplay metrics
      this.score = 0;
      this.streak = 0;
      this.maxStreak = 0;
      this.lives = 3;
      this.roundIndex = 0;
      this.totalQuestionsAnswered = 0;
      this.correctCount = 0;
      this.reactionTimes = [];
      this.currentQuestionStartTime = 0;

      // Question & Timer engine
      this.currentQuestion = null;
      this.questionTimer = null;
      this.timerDurationMs = 4500;
      this.timeRemainingMs = 4500;
      this.timerInterval = null;

      // Blitz global timer
      this.blitzDurationSec = 60;
      this.blitzRemainingSec = 60;
      this.blitzInterval = null;

      // DOM Cache
      this.dom = {
        screens: {
          home: document.getElementById('screen-home'),
          ready: document.getElementById('screen-ready'),
          playing: document.getElementById('screen-playing'),
          gameover: document.getElementById('screen-gameover')
        },
        modals: {
          help: document.getElementById('modal-help'),
          pause: document.getElementById('modal-pause')
        },
        nav: {
          soundBtn: document.getElementById('btn-sound-toggle'),
          helpBtn: document.getElementById('btn-help'),
          homeLogo: document.getElementById('nav-logo')
        },
        home: {
          playBtn: document.getElementById('btn-play-game'),
          diffBtns: document.querySelectorAll('[data-diff]'),
          modeBtns: document.querySelectorAll('[data-mode]'),
          highScoreVal: document.getElementById('home-high-score'),
          bestStreakVal: document.getElementById('home-best-streak'),
          totalGamesVal: document.getElementById('home-total-games')
        },
        ready: {
          countdownNum: document.getElementById('ready-countdown-num')
        },
        playing: {
          scoreVal: document.getElementById('hud-score-val'),
          streakBadge: document.getElementById('hud-streak-badge'),
          streakText: document.getElementById('hud-streak-text'),
          livesContainer: document.getElementById('hud-lives-container'),
          timerBar: document.getElementById('question-timer-bar'),
          categoryLabel: document.getElementById('question-category'),
          questionText: document.getElementById('question-equation'),
          feedbackToast: document.getElementById('feedback-toast'),
          optionsGrid: document.getElementById('options-grid'),
          optionBtns: document.querySelectorAll('.option-btn'),
          pauseBtn: document.getElementById('btn-pause-game')
        },
        gameover: {
          badge: document.getElementById('over-record-badge'),
          title: document.getElementById('over-title-text'),
          rankBanner: document.getElementById('over-rank-text'),
          scoreNum: document.getElementById('over-score-num'),
          accuracyVal: document.getElementById('over-stat-accuracy'),
          bestStreakVal: document.getElementById('over-stat-streak'),
          avgSpeedVal: document.getElementById('over-stat-speed'),
          playAgainBtn: document.getElementById('btn-play-again'),
          mainMenuBtn: document.getElementById('btn-main-menu'),
          shareBtn: document.getElementById('btn-share-score')
        },
        toast: document.getElementById('toast-notice')
      };

      this.initEvents();
      this.refreshHomeStats();
      this.updateSoundBtnUI();
    }

    initEvents() {
      // Sound Toggle
      this.dom.nav.soundBtn.addEventListener('click', () => {
        const enabled = this.sound.toggle();
        this.updateSoundBtnUI();
        if (enabled) {
          this.sound.init();
          this.sound.playClick();
        }
      });

      // Modals
      this.dom.nav.helpBtn.addEventListener('click', () => {
        this.sound.init();
        this.sound.playClick();
        this.showModal('help');
      });

      document.getElementById('btn-close-help')?.addEventListener('click', () => {
        this.sound.playClick();
        this.hideModal('help');
      });

      this.dom.nav.homeLogo.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playClick();
        this.confirmQuitToHome();
      });

      // Difficulty Selector
      this.dom.home.diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.init();
          this.sound.playClick();
          this.dom.home.diffBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.difficulty = btn.getAttribute('data-diff');
          this.refreshHomeStats();
        });
      });

      // Mode Selector
      this.dom.home.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.init();
          this.sound.playClick();
          this.dom.home.modeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.gameMode = btn.getAttribute('data-mode');
          this.refreshHomeStats();
        });
      });

      // Play Button
      this.dom.home.playBtn.addEventListener('click', () => {
        this.sound.init();
        this.sound.playClick();
        this.startCountdown();
      });

      // Pause & Resume
      this.dom.playing.pauseBtn.addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
        this.hideModal('pause');
        this.startCountdown();
      });

      document.getElementById('btn-pause-quit')?.addEventListener('click', () => {
        this.hideModal('pause');
        this.setScreen('HOME');
      });

      // Game Over Actions
      this.dom.gameover.playAgainBtn.addEventListener('click', () => {
        this.sound.init();
        this.sound.playClick();
        this.startCountdown();
      });

      this.dom.gameover.mainMenuBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.setScreen('HOME');
      });

      this.dom.gameover.shareBtn.addEventListener('click', () => {
        this.shareScore();
      });

      // Option Buttons Click
      this.dom.playing.optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.state !== 'PLAYING') return;
          const selectedVal = parseInt(btn.getAttribute('data-val'), 10);
          this.handleAnswer(selectedVal, btn);
        });
      });

      // Global Keyboard Shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;

        if (e.code === 'Space') {
          if (this.state === 'HOME') {
            e.preventDefault();
            this.sound.init();
            this.startCountdown();
            return;
          }
          if (this.state === 'GAME_OVER') {
            e.preventDefault();
            this.sound.init();
            this.startCountdown();
            return;
          }
        }

        if (e.key === 'Escape') {
          if (this.dom.modals.help.classList.contains('active')) {
            this.hideModal('help');
            return;
          }
          if (this.state === 'PLAYING') {
            this.togglePause();
            return;
          }
          if (this.state === 'PAUSED') {
            this.togglePause();
            return;
          }
        }

        if (this.state === 'PLAYING') {
          const keyMap = {
            'Digit1': 0, 'Numpad1': 0, 'KeyA': 0,
            'Digit2': 1, 'Numpad2': 1, 'KeyB': 1,
            'Digit3': 2, 'Numpad3': 2, 'KeyC': 2,
            'Digit4': 3, 'Numpad4': 3, 'KeyD': 3
          };

          if (e.code in keyMap) {
            const idx = keyMap[e.code];
            const btn = this.dom.playing.optionBtns[idx];
            if (btn && !btn.disabled) {
              const val = parseInt(btn.getAttribute('data-val'), 10);
              this.handleAnswer(val, btn);
            }
          }
        }
      });
    }

    updateSoundBtnUI() {
      const isMuted = !this.sound.enabled;
      this.dom.nav.soundBtn.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
      this.dom.nav.soundBtn.innerHTML = isMuted
        ? `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    }

    setScreen(screenName) {
      this.state = screenName;
      Object.keys(this.dom.screens).forEach(key => {
        this.dom.screens[key].classList.remove('active');
      });

      const activeKey = screenName.toLowerCase().replace('_', '');
      if (this.dom.screens[activeKey]) {
        this.dom.screens[activeKey].classList.add('active');
      }

      if (screenName === 'HOME') {
        this.cleanupTimers();
        this.refreshHomeStats();
      }
    }

    showModal(modalName) {
      if (this.dom.modals[modalName]) {
        this.dom.modals[modalName].classList.add('active');
      }
    }

    hideModal(modalName) {
      if (this.dom.modals[modalName]) {
        this.dom.modals[modalName].classList.remove('active');
      }
    }

    confirmQuitToHome() {
      if (this.state === 'PLAYING' || this.state === 'READY') {
        if (confirm('Abandon current game and return to Main Menu?')) {
          this.setScreen('HOME');
        }
      } else {
        this.setScreen('HOME');
      }
    }

    togglePause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.sound.playClick();
        clearInterval(this.timerInterval);
        clearInterval(this.blitzInterval);
        this.showModal('pause');
      } else if (this.state === 'PAUSED') {
        this.hideModal('pause');
        this.sound.playClick();
        this.state = 'PLAYING';
        this.resumeTimers();
      }
    }

    startCountdown() {
      this.cleanupTimers();
      this.hideModal('help');
      this.hideModal('pause');
      this.setScreen('READY');

      let count = 3;
      this.dom.ready.countdownNum.textContent = count;
      this.sound.playCountdownTick(false);

      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          this.dom.ready.countdownNum.textContent = count;
          this.sound.playCountdownTick(false);
        } else if (count === 0) {
          this.dom.ready.countdownNum.textContent = 'GO!';
          this.sound.playCountdownTick(true);
        } else {
          clearInterval(countdownInterval);
          this.beginGame();
        }
      }, 850);
    }

    beginGame() {
      this.score = 0;
      this.streak = 0;
      this.maxStreak = 0;
      this.lives = this.gameMode === 'classic' ? 3 : 1;
      this.roundIndex = 0;
      this.totalQuestionsAnswered = 0;
      this.correctCount = 0;
      this.reactionTimes = [];

      this.updateHud();
      this.setScreen('PLAYING');

      if (this.gameMode === 'blitz') {
        this.blitzRemainingSec = 60;
        this.blitzInterval = setInterval(() => {
          if (this.state !== 'PLAYING') return;
          this.blitzRemainingSec--;
          this.dom.playing.scoreVal.textContent = this.score;
          if (this.blitzRemainingSec <= 0) {
            clearInterval(this.blitzInterval);
            this.endGame();
          }
        }, 1000);
      }

      this.nextQuestion();
    }

    nextQuestion() {
      if (this.state !== 'PLAYING' && this.state !== 'FEEDBACK') return;
      this.state = 'PLAYING';
      this.roundIndex++;

      if (this.difficulty === 'casual') {
        this.timerDurationMs = Math.max(4000, 7000 - Math.min(this.streak * 80, 2500));
      } else if (this.difficulty === 'pro') {
        this.timerDurationMs = Math.max(1600, 3200 - Math.min(this.streak * 100, 1500));
      } else {
        this.timerDurationMs = Math.max(2200, 4800 - Math.min(this.streak * 90, 2200));
      }

      this.timeRemainingMs = this.timerDurationMs;
      this.currentQuestion = QuestionGenerator.generate(this.difficulty, this.roundIndex);

      this.dom.playing.categoryLabel.textContent = this.currentQuestion.category;
      this.dom.playing.questionText.textContent = this.currentQuestion.questionText;

      this.dom.playing.optionBtns.forEach((btn, idx) => {
        const val = this.currentQuestion.choices[idx];
        btn.setAttribute('data-val', val);
        btn.querySelector('.val-text').textContent = val;
        btn.className = 'option-btn';
        btn.disabled = false;
      });

      this.dom.playing.feedbackToast.className = 'feedback-toast';
      this.updateTimerBarUI(100);

      this.currentQuestionStartTime = performance.now();
      this.startQuestionTimer();
    }

    startQuestionTimer() {
      clearInterval(this.timerInterval);
      if (this.gameMode === 'zen') {
        this.updateTimerBarUI(100);
        return;
      }

      const updateFreq = 40;
      this.timerInterval = setInterval(() => {
        if (this.state !== 'PLAYING') return;

        this.timeRemainingMs -= updateFreq;
        const pct = Math.max(0, (this.timeRemainingMs / this.timerDurationMs) * 100);
        this.updateTimerBarUI(pct);

        if (this.timeRemainingMs <= 0) {
          clearInterval(this.timerInterval);
          this.handleTimeout();
        }
      }, updateFreq);
    }

    resumeTimers() {
      this.startQuestionTimer();
      if (this.gameMode === 'blitz') {
        this.blitzInterval = setInterval(() => {
          if (this.state !== 'PLAYING') return;
          this.blitzRemainingSec--;
          if (this.blitzRemainingSec <= 0) {
            clearInterval(this.blitzInterval);
            this.endGame();
          }
        }, 1000);
      }
    }

    updateTimerBarUI(pct) {
      const bar = this.dom.playing.timerBar;
      bar.style.width = pct + '%';
      if (pct > 40) {
        bar.className = 'timer-bar';
      } else if (pct > 20) {
        bar.className = 'timer-bar warning';
      } else {
        bar.className = 'timer-bar danger';
      }
    }

    handleAnswer(selectedVal, clickedBtn) {
      if (this.state !== 'PLAYING') return;
      this.state = 'FEEDBACK';
      clearInterval(this.timerInterval);

      const reactionTimeSec = Math.max(0.1, (performance.now() - this.currentQuestionStartTime) / 1000);
      this.reactionTimes.push(reactionTimeSec);
      this.totalQuestionsAnswered++;

      this.dom.playing.optionBtns.forEach(b => b.disabled = true);

      const isCorrect = selectedVal === this.currentQuestion.answer;

      if (isCorrect) {
        this.correctCount++;
        this.streak++;
        if (this.streak > this.maxStreak) {
          this.maxStreak = this.streak;
        }

        const baseScore = this.difficulty === 'casual' ? 60 : this.difficulty === 'pro' ? 220 : 120;
        const speedRatio = Math.max(0, this.timeRemainingMs / this.timerDurationMs);
        const speedBonus = Math.round(speedRatio * (this.difficulty === 'pro' ? 150 : 80));
        
        let multiplier = 1.0;
        if (this.streak >= 15) multiplier = 4.0;
        else if (this.streak >= 10) multiplier = 3.0;
        else if (this.streak >= 6) multiplier = 2.0;
        else if (this.streak >= 3) multiplier = 1.5;

        const roundEarned = Math.round((baseScore + speedBonus) * multiplier);
        this.score += roundEarned;

        clickedBtn.classList.add('state-correct');
        this.showToastFeedback(true, `+${roundEarned} pts · ${multiplier}x`);

        this.sound.playCorrect(this.streak);
        if (this.streak === 5 || this.streak === 10 || this.streak === 15) {
          setTimeout(() => this.sound.playStreakMilestone(), 180);
        }

        this.updateHud();

        setTimeout(() => {
          this.nextQuestion();
        }, 360);

      } else {
        this.streak = 0;
        clickedBtn.classList.add('state-incorrect');

        this.dom.playing.optionBtns.forEach(btn => {
          if (parseInt(btn.getAttribute('data-val'), 10) === this.currentQuestion.answer) {
            btn.classList.add('state-correct');
          }
        });

        this.showToastFeedback(false, 'WRONG!');
        this.sound.playIncorrect();

        if (this.gameMode === 'classic') {
          this.lives--;
        } else if (this.gameMode === 'blitz') {
          this.blitzRemainingSec = Math.max(0, this.blitzRemainingSec - 3);
        }

        this.updateHud();

        setTimeout(() => {
          if (this.gameMode === 'classic' && this.lives <= 0) {
            this.endGame();
          } else {
            this.nextQuestion();
          }
        }, 600);
      }
    }

    handleTimeout() {
      if (this.state !== 'PLAYING') return;
      this.state = 'FEEDBACK';
      this.totalQuestionsAnswered++;
      this.streak = 0;

      this.dom.playing.optionBtns.forEach(b => {
        b.disabled = true;
        if (parseInt(b.getAttribute('data-val'), 10) === this.currentQuestion.answer) {
          b.classList.add('state-correct');
        }
      });

      this.showToastFeedback(false, "TIME'S UP!");
      this.sound.playIncorrect();

      if (this.gameMode === 'classic') {
        this.lives--;
      }

      this.updateHud();

      setTimeout(() => {
        if (this.gameMode === 'classic' && this.lives <= 0) {
          this.endGame();
        } else {
          this.nextQuestion();
        }
      }, 700);
    }

    showToastFeedback(isCorrect, message) {
      const toast = this.dom.playing.feedbackToast;
      toast.textContent = message;
      toast.className = isCorrect ? 'feedback-toast show-correct' : 'feedback-toast show-wrong';
    }

    updateHud() {
      this.dom.playing.scoreVal.textContent = this.score;

      const badge = this.dom.playing.streakBadge;
      const text = this.dom.playing.streakText;
      text.textContent = `${this.streak}x`;

      if (this.streak >= 15) {
        badge.className = 'streak-badge overdrive';
        text.textContent = `${this.streak}x OVERDRIVE`;
      } else if (this.streak >= 6) {
        badge.className = 'streak-badge overdrive';
        text.textContent = `${this.streak}x SURGE`;
      } else {
        badge.className = 'streak-badge';
        text.textContent = `${this.streak}x`;
      }

      const heartsContainer = this.dom.playing.livesContainer;
      if (this.gameMode === 'classic') {
        heartsContainer.style.display = 'flex';
        const hearts = heartsContainer.querySelectorAll('.heart-icon');
        hearts.forEach((h, idx) => {
          if (idx < this.lives) {
            h.classList.remove('lost');
          } else {
            h.classList.add('lost');
          }
        });
      } else if (this.gameMode === 'blitz') {
        heartsContainer.style.display = 'flex';
        heartsContainer.innerHTML = `<span style="font-family:var(--font-mono);font-size:0.9rem;color:var(--neon-amber);font-weight:800;">⏱ ${Math.max(0, this.blitzRemainingSec)}s</span>`;
      } else {
        heartsContainer.style.display = 'none';
      }
    }

    endGame() {
      this.cleanupTimers();
      this.setScreen('GAME_OVER');

      const accuracy = this.totalQuestionsAnswered > 0
        ? Math.round((this.correctCount / this.totalQuestionsAnswered) * 100)
        : 0;

      const avgSpeed = this.reactionTimes.length > 0
        ? (this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length).toFixed(2)
        : '0.00';

      const storageKey = `speedBrain_high_${this.gameMode}_${this.difficulty}`;
      const prevHigh = parseInt(localStorage.getItem(storageKey) || '0', 10);
      const isNewHigh = this.score > prevHigh && this.score > 0;

      if (isNewHigh) {
        localStorage.setItem(storageKey, this.score.toString());
      }

      const totalGames = parseInt(localStorage.getItem('speedBrain_totalGames') || '0', 10) + 1;
      localStorage.setItem('speedBrain_totalGames', totalGames.toString());

      const globalBestStreak = Math.max(
        this.maxStreak,
        parseInt(localStorage.getItem('speedBrain_bestStreak') || '0', 10)
      );
      localStorage.setItem('speedBrain_bestStreak', globalBestStreak.toString());

      let rank = '🌱 Novice Thinker';
      if (this.score >= 4000) rank = '⚡ Quantum Cyber Brain';
      else if (this.score >= 2500) rank = '🧠 Hyper Synapse Ace';
      else if (this.score >= 1500) rank = '🚀 Neon Calculation Master';
      else if (this.score >= 800) rank = '💫 Rapid Reflex Prodigy';
      else if (this.score >= 400) rank = '🎯 Sharp Focus Specialist';

      if (isNewHigh) {
        this.dom.gameover.badge.className = 'over-badge new-record';
        this.dom.gameover.badge.textContent = '★ NEW PERSONAL RECORD! ★';
        this.sound.playHighScore();
      } else {
        this.dom.gameover.badge.className = 'over-badge standard';
        this.dom.gameover.badge.textContent = 'RUN COMPLETE';
        this.sound.playGameOver();
      }

      this.dom.gameover.rankBanner.textContent = rank;
      this.dom.gameover.scoreNum.textContent = this.score;
      this.dom.gameover.accuracyVal.textContent = `${accuracy}% (${this.correctCount}/${this.totalQuestionsAnswered})`;
      this.dom.gameover.bestStreakVal.textContent = `${this.maxStreak}x`;
      this.dom.gameover.avgSpeedVal.textContent = `${avgSpeed}s`;
    }

    refreshHomeStats() {
      const storageKey = `speedBrain_high_${this.gameMode}_${this.difficulty}`;
      const high = localStorage.getItem(storageKey) || '0';
      const streak = localStorage.getItem('speedBrain_bestStreak') || '0';
      const games = localStorage.getItem('speedBrain_totalGames') || '0';

      this.dom.home.highScoreVal.textContent = high;
      this.dom.home.bestStreakVal.textContent = `${streak}x`;
      this.dom.home.totalGamesVal.textContent = games;
    }

    shareScore() {
      const modeName = this.gameMode.toUpperCase();
      const diffName = this.difficulty.toUpperCase();
      const accuracy = this.totalQuestionsAnswered > 0
        ? Math.round((this.correctCount / this.totalQuestionsAnswered) * 100)
        : 0;

      const shareText = `⚡ SPEED BRAIN CHALLENGE ⚡\nScore: ${this.score} pts\nMode: ${modeName} (${diffName})\nStreak: ${this.maxStreak}x | Accuracy: ${accuracy}%\nThink Fast. React Faster!`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          this.showNoticeToast('Score copied to clipboard!');
        }).catch(() => {
          this.showNoticeToast(`Score: ${this.score} pts!`);
        });
      } else {
        this.showNoticeToast(`Score: ${this.score} pts!`);
      }
    }

    showNoticeToast(msg) {
      const toast = this.dom.toast;
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }

    cleanupTimers() {
      clearInterval(this.timerInterval);
      clearInterval(this.blitzInterval);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.speedBrain = new SpeedBrainApp();
  });
})();
