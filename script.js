const notes = ['c4.png', 'd4.png', 'e4.png', 'f4.png', 'g4.png', 'a4.png', 'b4.png'];
let totalQuestions = 0;
let currentQuestion = 0;
let correctAnswers = [];
let userAnswers = [];
let isVoiceMode = false;
let correctAnswer = '';

function startQuiz() {
  totalQuestions = parseInt(document.getElementById('question-count').value);
  currentQuestion = 0;
  correctAnswers = [];
  userAnswers = [];
  isVoiceMode = document.getElementById('voice-mode').checked;

  document.getElementById('quiz-area').style.display = 'block';
  document.querySelector('h2').style.display = 'none';
  document.getElementById('question-count').style.display = 'none';
  document.getElementById('voice-mode').style.display = 'none';
  event.target.style.display = 'none';

  if (!isVoiceMode) {
    document.getElementById('choices').style.display = 'block';
  }

  showNextNote();

  if (isVoiceMode) {
    startVoiceRecognition();
  }
}

function showNextNote() {
  if (currentQuestion >= totalQuestions) {
    showResults();
    return;
  }

  const randomNote = notes[Math.floor(Math.random() * notes.length)];
  correctAnswer = randomNote[0]; // 'c4.png' → 'c'
  correctAnswers.push(correctAnswer);

  document.getElementById('note-image').src = 'notes/' + randomNote;
  document.getElementById('progress-text').innerText = `${currentQuestion + 1} / ${totalQuestions}`;
  document.getElementById('voice-detected').innerText = '';
}

function selectAnswer(answer) {
  userAnswers.push(answer);
  currentQuestion++;
  showNextNote();
}

// 🎤 音声認識（clarity緩和・デバッグ表示あり）
function startVoiceRecognition() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);

    function detect() {
      analyser.getFloatTimeDomainData(buffer);
      const [pitch, clarity] = pitchy(buffer, audioContext.sampleRate);

      if (pitch) {
        const note = freqToNoteName(pitch);
        const userNote = note.replace(/[0-9]/g, '').toLowerCase(); // オクターブ無視
        document.getElementById('voice-detected').innerText =
          `あなたの音: ${note} / clarity: ${clarity.toFixed(2)}`;

        if (clarity > 0.6) {  // ゆるめ設定で反応しやすく
          userAnswers.push(userNote);
          currentQuestion++;
          showNextNote();
        }
      }

      if (currentQuestion < totalQuestions) {
        requestAnimationFrame(detect);
      }
    }

    detect();
  });
}

// 🎵 周波数 → 音名
function freqToNoteName(freq) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const index = Math.round(12 * Math.log2(freq / 440)) + 69;
  const note = notes[index % 12];
  const octave = Math.floor(index / 12) - 1;
  return `${note}${octave}`;
}

// ✅ 結果画面
function showResults() {
  document.getElementById('quiz-area').style.display = 'none';
  document.getElementById('result-area').style.display = 'block';

  const resultList = document.getElementById('result-list');
  resultList.innerHTML = '';

  let correctCount = 0;
  for (let i = 0; i < totalQuestions; i++) {
    const li = document.createElement('li');
    const isCorrect = userAnswers[i] === correctAnswers[i];
    if (isCorrect) correctCount++;
    li.innerText = `第${i + 1}問: あなたの答え → ${userAnswers[i]?.toUpperCase() ?? '-'} / 正解 → ${correctAnswers[i].toUpperCase()} ${isCorrect ? '✅' : '❌'}`;
    resultList.appendChild(li);
  }

  const percent = Math.round((correctCount / totalQuestions) * 100);
  document.getElementById('score-summary').innerText = `正解数：${correctCount} / ${totalQuestions}（正答率：${percent}%）`;
}
