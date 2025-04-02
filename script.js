const notes = ['A4.png', 'B4.png', 'C4.png', 'D4.png', 'E4.png', 'F4.png', 'G4.png'];
let totalQuestions = 5;
let currentQuestion = 0;
let correctAnswers = [];
let userAnswers = [];
let correctAnswer = '';
let isVoiceMode = true;

function startQuiz() {
  currentQuestion = 0;
  correctAnswers = [];
  userAnswers = [];

  document.getElementById('start-voice').style.display = 'none';
  document.getElementById('choices-container').style.display = isVoiceMode ? 'none' : 'block';
  document.getElementById('result-container').style.display = 'none';

  showNextNote();

  if (isVoiceMode) {
    startVoiceRecognition();
  } else {
    renderChoiceButtons();
  }
}

function showNextNote() {
  if (currentQuestion >= totalQuestions) {
    showResults();
    return;
  }

  const randomNote = notes[Math.floor(Math.random() * notes.length)];
  correctAnswer = randomNote[0]; // e.g., 'A' from 'A4.png'
  correctAnswers.push(correctAnswer);

  const noteImage = document.getElementById('note-image');
  noteImage.src = 'notes/' + randomNote;
  noteImage.alt = '音符: ' + correctAnswer;

  document.getElementById('question-counter').innerText = `${currentQuestion + 1} / ${totalQuestions}`;
  document.getElementById('voice-detected').innerText = '';
}

function selectAnswer(answer) {
  userAnswers.push(answer);
  currentQuestion++;
  showNextNote();
}

function renderChoiceButtons() {
  const container = document.getElementById('choices-container');
  container.innerHTML = '';

  ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(note => {
    const btn = document.createElement('button');
    btn.innerText = note;
    btn.addEventListener('click', () => selectAnswer(note));
    container.appendChild(btn);
  });
}

function startVoiceRecognition() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);
    const detectPitch = Pitchfinder.YIN({ sampleRate: audioContext.sampleRate });

    function detect() {
      analyser.getFloatTimeDomainData(buffer);
      const pitch = detectPitch(buffer);

      if (pitch) {
        const note = freqToNoteName(pitch); // e.g., "A4"
        const userNote = note.replace(/[0-9]/g, '').toUpperCase();

        document.getElementById('voice-detected').innerText = `あなたの音: ${note}`;
        userAnswers.push(userNote);
        currentQuestion++;
        showNextNote();
      }

      if (currentQuestion < totalQuestions) {
        requestAnimationFrame(detect);
      }
    }

    detect();
  }).catch(err => {
    alert('マイクの使用が許可されていません。音声認識モードを使用できません。');
    console.error(err);
  });
}

function freqToNoteName(freq) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const index = Math.round(12 * Math.log2(freq / 440)) + 69;
  const note = notes[index % 12];
  const octave = Math.floor(index / 12) - 1;
  return `${note}${octave}`;
}

function showResults() {
  document.getElementById('result-container').style.display = 'block';
  const resultList = document.getElementById('result-list');
  resultList.innerHTML = '';

  let correctCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const li = document.createElement('li');
    const isCorrect = userAnswers[i] === correctAnswers[i];
    if (isCorrect) correctCount++;
    li.textContent = `第${i + 1}問: あなたの答え → ${userAnswers[i] ?? '-'} / 正解 → ${correctAnswers[i]} ${isCorrect ? '✅' : '❌'}`;
    resultList.appendChild(li);
  }

  const percent = Math.round((correctCount / totalQuestions) * 100);
  document.getElementById('accuracy').textContent = `正解数：${correctCount} / ${totalQuestions}（正答率：${percent}%）`;
}
