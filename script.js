window.onload = function() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let playingSources = [];
  
  // global maximum duration among loaded tracks
  let globalMax = 0;
  
  // スライダー要素と表示領域を取得
  const slider = document.getElementById('seekSlider');
  const sliderValueDisplay = document.getElementById('sliderValue');
  
  // 8個の音源用にキーを '1' ～ '8' として定義
  const parts = {
    '1': { fileBuffer: null },
    '2': { fileBuffer: null },
    '3': { fileBuffer: null },
    '4': { fileBuffer: null },
    '5': { fileBuffer: null },
    '6': { fileBuffer: null },
    '7': { fileBuffer: null },
    '8': { fileBuffer: null }
  };
  
  Object.keys(parts).forEach(function(partName) {
    const fileInput = document.getElementById('fileInput_' + partName);
    const fileLabel = document.getElementById('fileLabel_' + partName);
    const editButton = document.getElementById('editButton_' + partName);
    const muteCheckbox = document.getElementById('mute_' + partName);
  
    // ファイル選択時にファイル名をラベルにセットし、AudioBufferを読み込む
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileLabel.value = file.name;
        const reader = new FileReader();
        reader.onload = function(event) {
          const arrayBuffer = event.target.result;
          audioContext.decodeAudioData(arrayBuffer, function(audioBuffer) {
            parts[partName].fileBuffer = audioBuffer;
            console.log('Part ' + partName + ' loaded.');
            // 各トラックの再生時間の最大値を更新し、スライダーの最大値に反映
            if (audioBuffer.duration > globalMax) {
              globalMax = audioBuffer.duration;
              slider.max = globalMax;
            }
          }, function(error) {
            console.error('Error decoding part ' + partName + ':', error);
          });
        };
        reader.readAsArrayBuffer(file);
      }
    });
  
    // 編集ボタンでラベルを編集可能にする
    editButton.addEventListener('click', function() {
      fileLabel.disabled = false;
      fileLabel.focus();
    });
  
    // 編集終了時にラベルを編集不可にする
    fileLabel.addEventListener('blur', function() {
      fileLabel.disabled = true;
    });
  });
  
  // 全トラックを指定オフセットから再生する関数
  function playFromOffset(offset) {
    // 再生中の音源を停止
    playingSources.forEach(function(source) {
      try {
        source.stop();
      } catch (e) {
        console.error('Error stopping source:', e);
      }
    });
    playingSources = [];
    const startTime = audioContext.currentTime + 0.1;
    Object.keys(parts).forEach(function(partName) {
      const part = parts[partName];
      const muteCheckbox = document.getElementById('mute_' + partName);
      if (part.fileBuffer && offset < part.fileBuffer.duration) {
        const source = audioContext.createBufferSource();
        source.buffer = part.fileBuffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = muteCheckbox.checked ? 0 : 1;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(startTime, offset);
        playingSources.push(source);
      }
    });
  }
  
  // 「全パート再生」ボタン：スライダー値（オフセット）から再生
  document.getElementById('playAll').addEventListener('click', function() {
    const offset = parseFloat(slider.value) || 0;
    playFromOffset(offset);
  });
  
  // 「停止」ボタン：再生中の音源を停止
  document.getElementById('stopAll').addEventListener('click', function() {
    playingSources.forEach(function(source) {
      try {
        source.stop();
      } catch (e) {
        console.error('Error stopping source:', e);
      }
    });
    playingSources = [];
  });
  
  // スライダーの値を更新表示
  slider.addEventListener('input', function() {
    sliderValueDisplay.textContent = parseFloat(slider.value).toFixed(2) + '秒';
  });
  
  // スライダーの変更時、再生中ならシークを実行
  slider.addEventListener('change', function() {
    if (playingSources.length > 0) {
      const offset = parseFloat(slider.value) || 0;
      playFromOffset(offset);
    }
  });
}; 