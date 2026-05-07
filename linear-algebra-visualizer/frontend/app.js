const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let history = [];
let busy = false;

const TOPIC_KR = {
  eigenvalue: '고유값/고유벡터', linear_transform: '선형변환', determinant: '행렬식',
  basis_change: '기저변환', taylor_series: '테일러 급수', fourier: '푸리에 급수',
  derivative: '미분', clt: '중심극한정리', mle: 'MLE',
  hypothesis_test: '가설검정', standard_error: '표준오차',
};

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function scrollEnd() {
  document.getElementById('chat-container').scrollTop = 99999;
}

function addUserMsg(text) {
  const d = document.createElement('div');
  d.className = 'msg user';
  d.innerHTML = `<div class="avatar">U</div><div class="bubble">${esc(text)}</div>`;
  messagesEl.appendChild(d);
  scrollEnd();
}

function addLoadingMsg() {
  const d = document.createElement('div');
  d.className = 'msg ai';
  d.id = 'loading';
  d.innerHTML = `
    <div class="avatar">∑</div>
    <div class="bubble">
      <div class="status">
        <div class="step active" id="s1"><span class="dots"><span></span><span></span><span></span></span> 주제 분석 중...</div>
      </div>
    </div>`;
  messagesEl.appendChild(d);
  scrollEnd();
}

function stepToRendering() {
  const s1 = document.getElementById('s1');
  if (!s1) return;
  s1.className = 'step done';
  s1.textContent = '✓ 주제 분석 완료';
  const s2 = document.createElement('div');
  s2.className = 'step active';
  s2.id = 's2';
  s2.innerHTML = `<span class="dots"><span></span><span></span><span></span></span> 시각화 생성 중... (5~15초)`;
  s1.parentElement.appendChild(s2);
  scrollEnd();
}

function resolveLoading(explanation, videoUrl, topicId) {
  const el = document.getElementById('loading');
  if (!el) return;

  const badge = topicId && TOPIC_KR[topicId]
    ? `<div class="topic-badge">${TOPIC_KR[topicId]}</div>`
    : '';

  const video = videoUrl
    ? `<div class="video-wrap"><video controls preload="metadata"><source src="${videoUrl}" type="video/mp4"></video></div>`
    : '';

  el.querySelector('.bubble').innerHTML = `${badge}<div class="explanation">${esc(explanation)}</div>${video}`;
  el.removeAttribute('id');
  scrollEnd();
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;
  inputEl.value = '';
  inputEl.style.height = 'auto';

  addUserMsg(text);
  addLoadingMsg();

  const renderTimer = setTimeout(stepToRendering, 1600);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });

    clearTimeout(renderTimer);
    stepToRendering();

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: data.explanation });

    resolveLoading(data.explanation, data.video_url, data.topic_id);
  } catch {
    clearTimeout(renderTimer);
    resolveLoading('오류가 발생했어요. 잠시 후 다시 시도해주세요.', null, null);
  } finally {
    busy = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
