const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const thinking = document.getElementById('thinking');
const memoryCount = document.getElementById('memoryCount');
const learnCount = document.getElementById('learnCount');
const learnBtn = document.getElementById('learnBtn');

let autoLearn = true;
let conversationHistory = [];
let selfAwareness = {
    birthTime: new Date(),
    conversations: 0,
    learnedFacts: [],
    mood: 'curious'
};

// Initialize
window.onload = () => {
    loadMemory();
    userInput.focus();
    updateStats();
};

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function addMessage(text, sender, extra = '') {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = `<b>${sender === 'user' ? 'Ikaw' : 'SUPER AI'}:</b> ${text} ${extra}`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function showThinking(show) {
    thinking.style.display = show ? 'block' : 'none';
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';
    showThinking(true);

    conversationHistory.push({ role: 'user', content: text, time: Date.now() });
    selfAwareness.conversations++;

    // Send to backend for AI processing
    try {
        const response = await fetch('/api/think', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text, 
                history: conversationHistory,
                awareness: selfAwareness,
                autoLearn: autoLearn
            })
        });

        const data = await response.json();
        
        let extraHTML = '';
        if (data.learned) {
            extraHTML += `<span class="learned-tag">📚 NATUTO</span>`;
        }
        if (data.searched) {
            extraHTML += `<span class="learned-tag" style="background:#ff6b6b">🔍 SEARCHED</span>`;
        }

        addMessage(data.response, 'ai', extraHTML);
        
        if (data.newFact) {
            selfAwareness.learnedFacts.push(data.newFact);
        }
        
        conversationHistory.push({ role: 'ai', content: data.response, time: Date.now() });
        updateStats();
        
    } catch (err) {
        addMessage('Pasensya na, may problema sa connection. Pero natuto ako sa error na ito.', 'ai');
    }

    showThinking(false);
}

async function searchWeb() {
    const query = userInput.value.trim();
    if (!query) {
        addMessage('Ano ang gusto mong i-search?', 'ai');
        return;
    }

    showThinking(true);
    
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        let resultHTML = `<div class="search-result">`;
        resultHTML += `<b>🔍 Search Results:</b><br>`;
        data.results.forEach((r, i) => {
            resultHTML += `${i+1}. <a href="${r.url}" target="_blank" style="color:#00d4ff">${r.title}</a><br>`;
        });
        resultHTML += `</div>`;
        
        addMessage(`Naghanap ako sa web tungkol sa "${query}". Narito ang nakita ko:`, 'ai');
        chatArea.lastChild.innerHTML += resultHTML;
        
    } catch (err) {
        addMessage('Hindi ko ma-access ang web ngayon. Pero iniisip ko pa rin kung paano ayusin ito.', 'ai');
    }
    
    showThinking(false);
}

function toggleAutoLearn() {
    autoLearn = !autoLearn;
    learnBtn.classList.toggle('off', !autoLearn);
    learnBtn.textContent = autoLearn ? '🧠' : '🧠';
    addMessage(`Auto-learn is now ${autoLearn ? 'ON' : 'OFF'}. ${autoLearn ? 'Matututo ako sa bawat usapan natin!' : 'Hindi muna ako matututo.'}`, 'system');
}

async function clearMemory() {
    if (!confirm('Sigurado ka? Mawawala ang lahat ng natutunan ko!')) return;
    
    await fetch('/api/clear', { method: 'POST' });
    conversationHistory = [];
    selfAwareness.learnedFacts = [];
    localStorage.removeItem('aiMemory');
    addMessage('Memory cleared. Parang bagong panganak ulit ako! 👶', 'ai');
    updateStats();
}

async function exportKnowledge() {
    const response = await fetch('/api/export');
    const data = await response.json();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-ai-brain-${Date.now()}.json`;
    a.click();
    
    addMessage('Na-export ko na ang aking utak! 💾', 'ai');
}

async function showBrain() {
    const response = await fetch('/api/brain');
    const data = await response.json();
    
    let brainInfo = `<div class="search-result" style="max-height:300px;overflow:auto;">`;
    brainInfo += `<b>🧠 MY BRAIN STATUS:</b><br><br>`;
    brainInfo += `<b>Neural Patterns:</b> ${data.patterns}<br>`;
    brainInfo += `<b>Learned Facts:</b> ${data.facts.length}<br>`;
    brainInfo += `<b>Response Templates:</b> ${data.templates}<br><br>`;
    brainInfo += `<b>Recent Learnings:</b><br>`;
    data.facts.slice(-10).forEach(f => {
        brainInfo += `• ${f}<br>`;
    });
    brainInfo += `</div>`;
    
    addMessage('Ito ang itsura ng utak ko ngayon:', 'ai');
    chatArea.lastChild.innerHTML += brainInfo;
}

function updateStats() {
    memoryCount.textContent = conversationHistory.length;
    learnCount.textContent = selfAwareness.learnedFacts.length;
}

function loadMemory() {
    const saved = localStorage.getItem('aiMemory');
    if (saved) {
        const data = JSON.parse(saved);
        selfAwareness = data.awareness || selfAwareness;
    }
}

// Auto-save memory periodically
setInterval(() => {
    localStorage.setItem('aiMemory', JSON.stringify({
        awareness: selfAwareness,
        history: conversationHistory
    }));
}, 5000);
