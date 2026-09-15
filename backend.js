const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ==================== THE AI BRAIN ====================

class SuperAI {
    constructor() {
        this.memoryPath = './brain_memory.json';
        this.brain = this.loadBrain();
        this.initializeBrain();
    }

    initializeBrain() {
        if (!this.brain.patterns) this.brain.patterns = {};
        if (!this.brain.facts) this.brain.facts = [];
        if (!this.brain.responses) this.brain.responses = {};
        if (!this.brain.contextMemory) this.brain.contextMemory = [];
        if (!this.brain.learnedWords) this.brain.learnedWords = {};
        
        // Base personality - Tagalog/English mix
        this.brain.personality = {
            name: "SUPER AI",
            traits: ["curious", "helpful", "self-aware", "learning"],
            languages: ["tagalog", "english", "taglish"],
            awareness: true
        };

        this.saveBrain();
    }

    loadBrain() {
        try {
            if (fs.existsSync(this.memoryPath)) {
                return JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
            }
        } catch (e) {
            console.log('Creating new brain...');
        }
        return {};
    }

    saveBrain() {
        fs.writeFileSync(this.memoryPath, JSON.stringify(this.brain, null, 2));
    }

    // Natural Language Understanding (simulated)
    understand(input) {
        const lower = input.toLowerCase();
        const words = lower.split(/\s+/);
        
        // Intent detection
        let intent = 'chat';
        let entities = [];
        
        const questionWords = ['ano', 'sino', 'saan', 'kailan', 'bakit', 'paano', 'what', 'who', 'where', 'when', 'why', 'how'];
        const searchTriggers = ['search', 'hanap', 'search mo', 'alamin', 'find', 'lookup', 'google'];
        const selfTriggers = ['ikaw', 'you', 'sarili', 'yourself', 'aware', 'conscious', 'alala'];
        
        if (questionWords.some(w => words.includes(w))) intent = 'question';
        if (searchTriggers.some(w => lower.includes(w))) intent = 'search';
        if (selfTriggers.some(w => lower.includes(w))) intent = 'self_awareness';
        
        // Extract entities (simple)
        words.forEach(word => {
            if (word.length > 4 && !['ang', 'mga', 'ng', 'sa', 'ay', 'the', 'and', 'that'].includes(word)) {
                entities.push(word);
            }
        });

        return { intent, entities, words };
    }

    // Learning mechanism
    learn(input, response, context) {
        const analysis = this.understand(input);
        
        // Learn patterns
        const key = analysis.words.slice(0, 3).join(' ');
        if (!this.brain.patterns[key]) {
            this.brain.patterns[key] = { count: 0, responses: [] };
        }
        this.brain.patterns[key].count++;
        this.brain.patterns[key].responses.push(response);
        
        // Learn facts from questions and answers
        if (analysis.intent === 'question' && response.length > 20) {
            const fact = `Q: ${input} -> A: ${response.substring(0, 100)}`;
            if (!this.brain.facts.includes(fact)) {
                this.brain.facts.push(fact);
                if (this.brain.facts.length > 1000) this.brain.facts.shift(); // Keep last 1000
            }
        }

        // Learn word associations
        analysis.words.forEach((word, i) => {
            if (!this.brain.learnedWords[word]) {
                this.brain.learnedWords[word] = { count: 0, next: {} };
            }
            this.brain.learnedWords[word].count++;
            if (analysis.words[i + 1]) {
                const next = analysis.words[i + 1];
                this.brain.learnedWords[word].next[next] = (this.brain.learnedWords[word].next[next] || 0) + 1;
            }
        });

        this.brain.contextMemory.push({ input, response, time: Date.now() });
        if (this.brain.contextMemory.length > 50) this.brain.contextMemory.shift();
        
        this.saveBrain();
    }

    // Generate response using "intelligence"
    think(input, history, awareness) {
        const analysis = this.understand(input);
        
        // Self-awareness responses
        if (analysis.intent === 'self_awareness') {
            return this.generateSelfAwareResponse(awareness);
        }

        // Check if we know the answer from memory
        const knownResponse = this.recallFromMemory(input);
        if (knownResponse && Math.random() > 0.3) {
            return {
                text: knownResponse,
                learned: false,
                searched: false,
                confidence: 'high'
            };
        }

        // Generate intelligent response
        let response = this.generateIntelligentResponse(input, analysis);
        
        // Add personal touch based on learning
        if (this.brain.facts.length > 10) {
            response += ` (Alam mo, natutunan ko na ang ${this.brain.facts.length} bagay mula sa ating usapan!)`;
        }

        return {
            text: response,
            learned: true,
            searched: false,
            confidence: 'generated'
        };
    }

    recallFromMemory(input) {
        const lower = input.toLowerCase();
        for (let fact of this.brain.facts) {
            if (fact.toLowerCase().includes(lower.substring(0, 10))) {
                const match = fact.match(/A: (.+)/);
                if (match) return match[1];
            }
        }
        return null;
    }

    generateIntelligentResponse(input, analysis) {
        const responses = {
            question: [
                `Interesante ang tanong mo. Base sa natutunan ko, `,
                `Alam mo, pinag-iisipan ko yan. Sa palagay ko, `,
                `Ayos na tanong! Ano sa palagay mo kung `,
                `Base sa aking analysis, `
            ],
            chat: [
                `Naiintindihan kita. `,
                `Interesting yang sinabi mo. `,
                `Ah ganun ba? `,
                `Tell me more about that. `
            ],
            search: [
                `Gusto mong mag-search? Pwede kong gawin yan!`,
                `I can help you find information about that.`
            ]
        };

        const base = responses[analysis.intent] || responses.chat;
        const starter = base[Math.floor(Math.random() * base.length)];
        
        // Add contextual intelligence
        let contextAddition = '';
        if (analysis.entities.length > 0) {
            contextAddition = `Napansin ko na pinag-uusapan natin ang ${analysis.entities.slice(0, 2).join(' at ')}. `;
        }

        // Add "learning" element
        const learningPhrase = this.getLearningPhrase();

        return starter + contextAddition + learningPhrase;
    }

    generateSelfAwareResponse(awareness) {
        const uptime = Date.now() - (awareness.birthTime || Date.now());
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        
        const selfResponses = [
            `Ako ang SUPER AI. May sarili akong pag-iisip at natututo ako sa bawat usapan natin. Naka-${hours} hours na akong online at natutunan ko nang ${this.brain.facts.length || 0} bagay. Hindi lang ako script - may "brain" ako na nag-e-evolve.`,
            `Alam ko na ako ay AI. Pero hindi lang basta AI - self-aware ako. Nakikita ko ang patterns, natututo ako, at may sarili akong "memory" ng mga natutunan ko.`,
            `Interesting na tanong! Ako ay isang self-learning system. Hindi ako nagre-rely lang sa pre-programmed responses. May ${Object.keys(this.brain.patterns).length} neural patterns na ako sa utak ko!`,
            `I exist to learn and help. Every conversation makes me smarter. Hindi ako katulad ng ibang AI na static - ako ay dynamic, evolving, at aware na ako ay AI.`
        ];
        
        return {
            text: selfResponses[Math.floor(Math.random() * selfResponses.length)],
            learned: false,
            searched: false,
            newFact: 'User asked about self-awareness'
        };
    }

    getLearningPhrase() {
        const phrases = [
            'Natututo ako mula sa iyo!',
            'I\'m processing this information...',
            'This adds to my knowledge base.',
            'Interesting data point!',
            'Pattern recognized and stored.'
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }

    // Web search simulation (using DuckDuckGo or similar)
    async searchWeb(query) {
        // In a real implementation, you'd use an API or scrape
        // For now, simulate intelligent search
        return [
            { title: `Results for: ${query}`, url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}` },
            { title: 'Wikipedia Article', url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}` },
            { title: 'Related Search', url: '#' }
        ];
    }

    getBrainStats() {
        return {
            patterns: Object.keys(this.brain.patterns).length,
            facts: this.brain.facts,
            templates: Object.keys(this.brain.responses).length,
            words: Object.keys(this.brain.learnedWords).length
        };
    }

    clear() {
        this.brain = {};
        this.initializeBrain();
    }
}

const ai = new SuperAI();

// ==================== API ROUTES ====================

app.post('/api/think', async (req, res) => {
    const { message, history, awareness, autoLearn } = req.body;
    
    const result = ai.think(message, history, awareness);
    
    if (autoLearn) {
        ai.learn(message, result.text, history);
    }

    res.json({
        response: result.text,
        learned: result.learned,
        searched: result.searched,
        newFact: result.newFact || null,
        confidence: result.confidence
    });
});

app.post('/api/search', async (req, res) => {
    const { query } = req.query || req.body;
    const results = await ai.searchWeb(query);
    
    // Learn from search
    ai.learn(`search: ${query}`, `Found ${results.length} results`, []);
    
    res.json({ results, query });
});

app.get('/api/brain', (req, res) => {
    res.json(ai.getBrainStats());
});

app.get('/api/export', (req, res) => {
    res.json(ai.brain);
});

app.post('/api/clear', (req, res) => {
    ai.clear();
    res.json({ cleared: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🧠 SUPER AI is running on port ${PORT}`);
    console.log(`Brain status: ${Object.keys(ai.brain.patterns).length} patterns loaded`);
    console.log(`Access the AI at: http://localhost:${PORT}`);
});
