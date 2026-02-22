// Dork Search Pro v4.0
class DorkSearchPro {
    constructor() {
        this.groqClient = null;
        this.searchHistory = this.loadHistory();
        this.dorkTemplates = this.loadTemplates();
        this.currentResults = [];
        this.apiKey = '';
        
        this.initializeEventListeners();
        this.initializeTabs();
        this.loadSettings();
    }
    
    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Search buttons
        document.getElementById('generateDorkBtn').addEventListener('click', () => this.generateDorks());
        document.getElementById('searchBtn').addEventListener('click', () => this.searchAll());
        document.getElementById('aiAnalyzeBtn').addEventListener('click', () => this.switchToAITab());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearInputs());
        
        // Copy and export
        document.getElementById('copyAllBtn').addEventListener('click', () => this.copyAllDorks());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportDorks());
        document.getElementById('openAllBtn').addEventListener('click', () => this.openAllResults());
        
        // AI Analysis
        document.getElementById('connectGroqBtn').addEventListener('click', () => this.connectGroq());
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeWithGroq());
        document.getElementById('copyResponseBtn').addEventListener('click', () => this.copyAnalysis());
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('aiPrompt').value = e.target.dataset.prompt;
            });
        });
        
        // Temperature slider
        document.getElementById('temperature').addEventListener('input', (e) => {
            document.getElementById('tempValue').textContent = e.target.value;
        });
        
        // History
        document.getElementById('historySearch').addEventListener('input', () => this.filterHistory());
        document.getElementById('historyFilter').addEventListener('change', () => this.filterHistory());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        
        // Settings
        document.getElementById('saveTemplateBtn').addEventListener('click', () => this.saveTemplate());
        document.getElementById('exportSettingsBtn').addEventListener('click', () => this.exportSettings());
        document.getElementById('importSettingsBtn').addEventListener('click', () => this.importSettings());
        document.getElementById('exportHistoryBtn').addEventListener('click', () => this.exportHistory());
        
        // Template type change
        document.getElementById('templateType').addEventListener('change', () => this.loadTemplateForEdit());
        
        // Dork type change
        document.getElementById('dorkType').addEventListener('change', () => this.onDorkTypeChange());
    }
    
    initializeTabs() {
        // Check URL hash for initial tab
        const hash = window.location.hash.substring(1) || 'search';
        this.activateTab(hash);
    }
    
    switchTab(e) {
        const tabName = e.currentTarget.dataset.tab;
        this.activateTab(tabName);
        window.location.hash = tabName;
    }
    
    activateTab(tabName) {
        // Update menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabName) {
                item.classList.add('active');
            }
        });
        
        // Update tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
    }
    
    switchToAITab() {
        this.activateTab('ai');
        
        // Prepare context for AI
        const context = this.prepareAIContext();
        document.getElementById('aiPrompt').value = 
            `Analyze these search results for potential data leaks:\n\n${context}`;
    }
    
    generateDorks() {
        const data = this.getInputData();
        const dorkType = document.getElementById('dorkType').value;
        const templates = this.getTemplatesForType(dorkType);
        
        const dorks = [];
        
        templates.forEach(template => {
            let dork = template;
            
            // Replace placeholders
            if (data.nik) dork = dork.replace(/{nik}/g, data.nik);
            if (data.kk) dork = dork.replace(/{kk}/g, data.kk);
            if (data.nama) dork = dork.replace(/{nama}/g, data.nama);
            if (data.alamat) dork = dork.replace(/{alamat}/g, data.alamat);
            if (data.email) dork = dork.replace(/{email}/g, data.email);
            if (data.hp) dork = dork.replace(/{nomor}/g, data.hp);
            
            dorks.push(dork);
        });
        
        this.displayDorks(dorks);
        this.showToast(`${dorks.length} dorks generated`, 'success');
        
        // Save to history
        this.addToHistory({
            type: 'dork',
            data: data,
            dorks: dorks,
            timestamp: new Date().toISOString()
        });
    }
    
    getInputData() {
        return {
            nik: document.getElementById('nik').value.trim(),
            kk: document.getElementById('kk').value.trim(),
            nama: document.getElementById('nama').value.trim(),
            alamat: document.getElementById('alamat').value.trim(),
            email: document.getElementById('email').value.trim(),
            hp: document.getElementById('hp').value.trim()
        };
    }
    
    getTemplatesForType(type) {
        const templates = {
            'nik': [
                'filetype:pdf "NIK" "{nik}"',
                'intext:"NIK" "{nik}" -site:gov.id',
                '"{nik}" "Nomor Induk Kependudukan"',
                'intext:"{nik}" ext:doc OR ext:docx OR ext:xls',
                'site:scribd.com "{nik}"',
                'site:docs.google.com "{nik}"'
            ],
            'kk': [
                'filetype:pdf "Nomor KK" "{kk}"',
                'intext:"Kartu Keluarga" "{kk}"',
                '"{kk}" "No. KK"',
                'site:drive.google.com "{kk}"',
                'ext:pdf "{kk}" "keluarga"'
            ],
            'alamat': [
                '"{alamat}" "RT" "RW" "kelurahan"',
                'intext:"{alamat}" "kode pos"',
                'site:maps.google.com "{alamat}"',
                '"{alamat}" filetype:pdf',
                'inurl:alamat "{alamat}"'
            ],
            'email': [
                'intext:"{email}" filetype:pdf',
                '"{email}" "contact"',
                'site:linkedin.com "{email}"',
                'site:facebook.com "{email}"',
                '"{email}" ext:txt OR ext:csv'
            ],
            'hp': [
                '"{nomor}" "kontak"',
                'intext:"{nomor}" "telepon"',
                'site:whatsapp.com "{nomor}"',
                '"{nomor}" "hp" filetype:pdf',
                'inurl:"contact" "{nomor}"'
            ],
            'kombinasi': [
                'intext:"{nik}" AND intext:"{nama}"',
                '"{nama}" "{alamat}" filetype:pdf',
                '"{email}" OR "{nomor}" site:gov.id',
                'intext:"{nik}" OR intext:"{kk}" -site:gov.id',
                '"{nik}"|"{kk}"|"{nama}" -site:gov.id'
            ]
        };
        
        return templates[type] || templates['nik'];
    }
    
    displayDorks(dorks) {
        const container = document.getElementById('dorkList');
        container.innerHTML = '';
        
        dorks.forEach((dork, index) => {
            const dorkItem = document.createElement('div');
            dorkItem.className = 'dork-item';
            
            dorkItem.innerHTML = `
                <div class="dork-text">${this.escapeHtml(dork)}</div>
                <div class="dork-actions">
                    <button class="dork-btn" onclick="app.copyDork('${this.escapeHtml(dork)}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="dork-btn" onclick="app.searchDork('${this.escapeHtml(dork)}')">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(dorkItem);
        });
        
        document.getElementById('dorkCount').textContent = `${dorks.length} dorks`;
    }
    
    async searchAll() {
        const dorks = Array.from(document.querySelectorAll('.dork-item .dork-text')).map(
            el => el.textContent
        );
        
        if (dorks.length === 0) {
            this.showToast('Generate dorks first!', 'error');
            return;
        }
        
        this.showLoading('Searching...');
        
        const engine = document.getElementById('searchEngine').value;
        const maxResults = parseInt(document.getElementById('maxResults').value);
        const results = [];
        
        // Simulate search (in real app, you'd use a search API or proxy)
        for (let i = 0; i < Math.min(dorks.length, maxResults); i++) {
            await this.delay(500); // Rate limiting
            
            // Mock results (replace with actual search API)
            const mockResults = this.generateMockResults(dorks[i]);
            results.push(...mockResults);
            
            // Update progress
            this.updateLoadingProgress((i + 1) / dorks.length * 100);
        }
        
        this.currentResults = results;
        this.displayResults(results);
        this.hideLoading();
        
        this.showToast(`Found ${results.length} results`, 'success');
    }
    
    generateMockResults(dork) {
        // This is a mock function - replace with actual search API
        const results = [];
        const count = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < count; i++) {
            results.push({
                title: `Search Result ${i + 1} for: ${dork.substring(0, 50)}...`,
                url: `https://example.com/result/${i}`,
                snippet: `This is a mock search result containing information related to your dork query. In a real implementation, this would be actual search results from Google/Bing API.`,
                dork: dork
            });
        }
        
        return results;
    }
    
    displayResults(results) {
        const container = document.getElementById('searchResults');
        container.innerHTML = '';
        
        results.forEach(result => {
            const card = document.createElement('div');
            card.className = 'result-card';
            
            card.innerHTML = `
                <div class="result-title">${this.escapeHtml(result.title)}</div>
                <div class="result-url">${this.escapeHtml(result.url)}</div>
                <div class="result-snippet">${this.escapeHtml(result.snippet)}</div>
                <a href="${result.url}" target="_blank" class="result-link">
                    <i class="fas fa-external-link-alt"></i> Open
                </a>
            `;
            
            container.appendChild(card);
        });
        
        document.getElementById('resultCount').textContent = `${results.length} results`;
    }
    
    async connectGroq() {
        const apiKey = document.getElementById('groqApiKey').value.trim();
        
        if (!apiKey) {
            this.showToast('Please enter Groq API Key', 'error');
            return;
        }
        
        this.showLoading('Connecting to Groq...');
        
        try {
            // Test connection
            const response = await fetch('https://api.groq.com/openai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (!response.ok) throw new Error('Invalid API Key');
            
            this.apiKey = apiKey;
            this.groqClient = true;
            
            document.querySelector('.api-status').classList.add('connected');
            document.querySelector('.api-status span').textContent = 'Groq AI: Connected';
            
            this.showToast('Connected to Groq AI', 'success');
            
        } catch (error) {
            this.showToast('Failed to connect: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async analyzeWithGroq() {
        if (!this.groqClient) {
            this.showToast('Please connect to Groq first', 'error');
            return;
        }
        
        const prompt = document.getElementById('aiPrompt').value.trim();
        if (!prompt) {
            this.showToast('Please enter analysis prompt', 'error');
            return;
        }
        
        const model = document.getElementById('aiModel').value;
        const temperature = parseFloat(document.getElementById('temperature').value);
        
        this.showLoading('Analyzing with Groq AI...');
        
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert OSINT and data analysis assistant. Analyze the provided information and extract valuable insights.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 2048
                })
            });
            
            if (!response.ok) throw new Error('Analysis failed');
            
            const data = await response.json();
            const analysis = data.choices[0].message.content;
            
            this.displayAnalysis(analysis);
            
            // Save to history
            this.addToHistory({
                type: 'ai',
                prompt: prompt,
                analysis: analysis,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            this.showToast('Analysis error: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    displayAnalysis(analysis) {
        const container = document.getElementById('analysisResult');
        
        // Format analysis with markdown-like syntax
        let formatted = analysis
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```(.*?)```/gs, '<pre>$1</pre>')
            .replace(/\n/g, '<br>');
        
        container.innerHTML = formatted;
    }
    
    copyDork(dork) {
        navigator.clipboard.writeText(dork).then(() => {
            this.showToast('Dork copied to clipboard', 'success');
        });
    }
    
    searchDork(dork) {
        const engine = document.getElementById('searchEngine').value;
        let url = '';
        
        switch(engine) {
            case 'google':
                url = `https://www.google.com/search?q=${encodeURIComponent(dork)}`;
                break;
            case 'bing':
                url = `https://www.bing.com/search?q=${encodeURIComponent(dork)}`;
                break;
            case 'yandex':
                url = `https://yandex.com/search/?text=${encodeURIComponent(dork)}`;
                break;
            case 'duckduckgo':
                url = `https://duckduckgo.com/?q=${encodeURIComponent(dork)}`;
                break;
        }
        
        window.open(url, '_blank');
    }
    
    copyAllDorks() {
        const dorks = Array.from(document.querySelectorAll('.dork-item .dork-text'))
            .map(el => el.textContent)
            .join('\n');
        
        navigator.clipboard.writeText(dorks).then(() => {
            this.showToast('All dorks copied to clipboard', 'success');
        });
    }
    
    exportDorks() {
        const dorks = Array.from(document.querySelectorAll('.dork-item .dork-text'))
            .map(el => el.textContent);
        
        const data = {
            timestamp: new Date().toISOString(),
            dorks: dorks
        };
        
        this.downloadJSON(data, 'dorks_export.json');
        this.showToast('Dorks exported', 'success');
    }
    
    openAllResults() {
        this.currentResults.forEach(result => {
            window.open(result.url, '_blank');
        });
    }
    
    copyAnalysis() {
        const analysis = document.getElementById('analysisResult').innerText;
        navigator.clipboard.writeText(analysis).then(() => {
            this.showToast('Analysis copied to clipboard', 'success');
        });
    }
    
    clearInputs() {
        document.getElementById('nik').value = '';
        document.getElementById('kk').value = '';
        document.getElementById('nama').value = '';
        document.getElementById('alamat').value = '';
        document.getElementById('email').value = '';
        document.getElementById('hp').value = '';
    }
    
    onDorkTypeChange() {
        const type = document.getElementById('dorkType').value;
        // Auto-focus relevant input
        switch(type) {
            case 'nik':
                document.getElementById('nik').focus();
                break;
            case 'kk':
                document.getElementById('kk').focus();
                break;
            case 'email':
                document.getElementById('email').focus();
                break;
            case 'hp':
                document.getElementById('hp').focus();
                break;
        }
    }
    
    prepareAIContext() {
        const data = this.getInputData();
        const results = this.currentResults;
        
        let context = `Data being searched:\n`;
        if (data.nik) context += `- NIK: ${data.nik}\n`;
        if (data.kk) context += `- KK: ${data.kk}\n`;
        if (data.nama) context += `- Nama: ${data.nama}\n`;
        if (data.alamat) context += `- Alamat: ${data.alamat}\n`;
        if (data.email) context += `- Email: ${data.email}\n`;
        if (data.hp) context += `- HP: ${data.hp}\n`;
        
        context += `\nSearch Results (${results.length} found):\n`;
        results.forEach((r, i) => {
            context += `\n${i+1}. ${r.title}\n`;
            context += `   URL: ${r.url}\n`;
            context += `   Snippet: ${r.snippet}\n`;
        });
        
        return context;
    }
    
    addToHistory(item) {
        this.searchHistory.unshift(item);
        
        // Keep only last 100 items
        if (this.searchHistory.length > 100) {
            this.searchHistory.pop();
        }
        
        this.saveHistory();
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        const container = document.getElementById('historyList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.searchHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleString();
            
            let title = '';
            if (item.type === 'dork') {
                const data = item.data;
                title = `Search: ${data.nik || data.kk || data.email || data.hp || 'General'}`;
            } else {
                title = `AI Analysis: ${item.prompt.substring(0, 50)}...`;
            }
            
            historyItem.innerHTML = `
                <div class="history-info">
                    <h4>${this.escapeHtml(title)}</h4>
                    <p>${item.type === 'dork' ? `${item.dorks.length} dorks` : 'AI Analysis'}</p>
                    <span class="history-time">${timeStr}</span>
                </div>
                <div class="history-actions">
                    <button class="icon-btn" onclick="app.loadHistoryItem(${this.searchHistory.indexOf(item)})">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(historyItem);
        });
    }
    
    filterHistory() {
        const searchTerm = document.getElementById('historySearch').value.toLowerCase();
        const filter = document.getElementById('historyFilter').value;
        
        // Implement filtering logic
        this.updateHistoryDisplay(); // Simplified - implement actual filtering
    }
    
    clearHistory() {
        if (confirm('Clear all history?')) {
            this.searchHistory = [];
            this.saveHistory();
            this.updateHistoryDisplay();
            this.showToast('History cleared', 'success');
        }
    }
    
    loadHistoryItem(index) {
        const item = this.searchHistory[index];
        
        if (item.type === 'dork') {
            // Load data into inputs
            if (item.data.nik) document.getElementById('nik').value = item.data.nik;
            if (item.data.kk) document.getElementById('kk').value = item.data.kk;
            if (item.data.nama) document.getElementById('nama').value = item.data.nama;
            if (item.data.alamat) document.getElementById('alamat').value = item.data.alamat;
            if (item.data.email) document.getElementById('email').value = item.data.email;
            if (item.data.hp) document.getElementById('hp').value = item.data.hp;
            
            // Generate dorks
            this.displayDorks(item.dorks);
            this.switchToTab('search');
        } else {
            // Load AI analysis
            this.switchToTab('ai');
            document.getElementById('aiPrompt').value = item.prompt;
            this.displayAnalysis(item.analysis);
        }
    }
    
    loadHistory() {
        const saved = localStorage.getItem('dorkHistory');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveHistory() {
        localStorage.setItem('dorkHistory', JSON.stringify(this.searchHistory));
    }
    
    loadTemplates() {
        const saved = localStorage.getItem('dorkTemplates');
        if (saved) return JSON.parse(saved);
        
        // Default templates
        return {
            nik: this.getTemplatesForType('nik'),
            kk: this.getTemplatesForType('kk'),
            alamat: this.getTemplatesForType('alamat'),
            email: this.getTemplatesForType('email'),
            hp: this.getTemplatesForType('hp')
        };
    }
    
    saveTemplates() {
        localStorage.setItem('dorkTemplates', JSON.stringify(this.dorkTemplates));
    }
    
    loadTemplateForEdit() {
        const type = document.getElementById('templateType').value;
        const templates = this.dorkTemplates[type] || [];
        document.getElementById('templateText').value = templates.join('\n');
    }
    
    saveTemplate() {
        const type = document.getElementById('templateType').value;
        const text = document.getElementById('templateText').value;
        this.dorkTemplates[type] = text.split('\n').filter(line => line.trim());
        this.saveTemplates();
        this.showToast('Template saved', 'success');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('dorkSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            document.getElementById('defaultEngine').value = settings.engine || 'google';
            document.getElementById('defaultResults').value = settings.maxResults || '50';
            document.getElementById('saveHistory').checked = settings.saveHistory !== false;
        }
    }
    
    saveSettings() {
        const settings = {
            engine: document.getElementById('defaultEngine').value,
            maxResults: document.getElementById('defaultResults').value,
            saveHistory: document.getElementById('saveHistory').checked
        };
        localStorage.setItem('dorkSettings', JSON.stringify(settings));
        this.showToast('Settings saved', 'success');
    }
    
    exportSettings() {
        const settings = {
            templates: this.dorkTemplates,
            config: {
                engine: document.getElementById('defaultEngine').value,
                maxResults: document.getElementById('defaultResults').value,
                saveHistory: document.getElementById('saveHistory').checked
            }
        };
        this.downloadJSON(settings, 'dork_settings.json');
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    
                    if (settings.templates) {
                        this.dorkTemplates = settings.templates;
                        this.saveTemplates();
                    }
                    
                    if (settings.config) {
                        document.getElementById('defaultEngine').value = settings.config.engine || 'google';
                        document.getElementById('defaultResults').value = settings.config.maxResults || '50';
                        document.getElementById('saveHistory').checked = settings.config.saveHistory !== false;
                        this.saveSettings();
                    }
                    
                    this.showToast('Settings imported', 'success');
                } catch (error) {
                    this.showToast('Invalid settings file', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    exportHistory() {
        this.downloadJSON(this.searchHistory, 'dork_history.json');
    }
    
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    showLoading(message) {
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    updateLoadingProgress(percent) {
        // Could add progress bar
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show';
        
        if (type === 'error') {
            toast.style.borderLeftColor = '#ff4444';
        } else if (type === 'success') {
            toast.style.borderLeftColor = '#00C851';
        } else {
            toast.style.borderLeftColor = '#4ecdc4';
        }
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    switchToTab(tabName) {
        this.activateTab(tabName);
        window.location.hash = tabName;
    }
}

// Initialize app
const app = new DorkSearchPro();

// Make functions globally available
window.app = app;
