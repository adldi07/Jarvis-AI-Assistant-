'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Zap, Code, Layout, Download, Check, Terminal, Cpu, Monitor, Smartphone, RefreshCw, Play, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Dashboard() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState([]);
    const [plan, setPlan] = useState(null);
    const [files, setFiles] = useState({});
    const [activeFile, setActiveFile] = useState('index.html');
    const [view, setView] = useState('preview'); // 'preview' or 'code'
    const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' or 'mobile'
    const [model, setModel] = useState('openai'); // openai, auto, groq, openrouter, perplexity, gemini, claude

    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setLogs(prev => [...prev, { type: 'info', message: `Initializing generation with ${model} model...`, time: new Date().toLocaleTimeString() }]);
        setPlan(null);
        setFiles({});

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: prompt, model }),
            });

            if (!response.ok) throw new Error(await response.text());

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunks = decoder.decode(value).split('\n');
                for (const chunk of chunks) {
                    if (!chunk) continue;
                    try {
                        const data = JSON.parse(chunk);
                        if (data.type === 'status') {
                            setLogs(prev => [...prev, { type: 'system', message: data.message, time: new Date().toLocaleTimeString() }]);
                        }
                        if (data.type === 'plan') setPlan(data.data);
                        if (data.type === 'files') {
                            setFiles(data.data);
                            const keys = Object.keys(data.data);
                            if (keys.length > 0 && !keys.includes(activeFile)) setActiveFile(keys[0]);
                        }
                        if (data.type === 'error') throw new Error(data.message);
                    } catch (err) { }
                }
            }
            setPrompt('');
            setLogs(prev => [...prev, { type: 'success', message: 'Generation complete successfully.', time: new Date().toLocaleTimeString() }]);
        } catch (err) {
            setLogs(prev => [...prev, { type: 'error', message: `Error: ${err.message}`, time: new Date().toLocaleTimeString() }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRefine = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setLogs(prev => [...prev, { type: 'info', message: `Refining with feedback...`, time: new Date().toLocaleTimeString() }]);

        try {
            const response = await fetch('/api/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: prompt,
                    currentFiles: files,
                    plan: plan,
                    model
                }),
            });

            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();

            setFiles(prev => ({ ...prev, ...data.files }));
            setLogs(prev => [...prev, { type: 'success', message: 'Refinement applied successfully.', time: new Date().toLocaleTimeString() }]);
            setPrompt('');
        } catch (err) {
            setLogs(prev => [...prev, { type: 'error', message: `Refine Error: ${err.message}`, time: new Date().toLocaleTimeString() }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleManualEdit = (newContent) => {
        setFiles(prev => ({ ...prev, [activeFile]: newContent }));
    };

    const getPreviewSource = () => {
        // Helper to find file by exact name or fallback to extension-based search
        const findFile = (exactName, extension) => {
            // First try exact match
            let path = Object.keys(files).find(p => p.endsWith(exactName));
            if (path) return files[path];

            // Fallback: find any file with the given extension
            path = Object.keys(files).find(p => p.endsWith(extension));
            return path ? files[path] : '';
        };

        const html = findFile('index.html', '.html');
        // Try common CSS file names, then fallback to any .css file
        const css = findFile('styles.css', '.css') || findFile('style.css', '.css') || findFile('main.css', '.css') || findFile('app.css', '.css');
        // Try common JS file names, then fallback to any .js file  
        const js = findFile('script.js', '.js') || findFile('main.js', '.js') || findFile('app.js', '.js') || findFile('index.js', '.js');

        /* If no index.html, try to find any html file */
        const mainHtml = html || Object.values(files).find(c => c.trim().toLowerCase().startsWith('<!doctype html') || c.trim().toLowerCase().startsWith('<html'));

        if (!mainHtml) return '';

        let injectedHtml = mainHtml;

        // Remove existing external CSS links (they won't work in srcDoc iframe)
        injectedHtml = injectedHtml.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']+\.css["'][^>]*\/?>/gi, '');
        injectedHtml = injectedHtml.replace(/<link[^>]*href=["'][^"']+\.css["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi, '');

        // Remove existing external script tags (they won't work in srcDoc iframe)
        injectedHtml = injectedHtml.replace(/<script[^>]*src=["'][^"']+\.js["'][^>]*>[\s\S]*?<\/script>/gi, '');

        // Inject CSS inline in the head
        if (css) {
            if (injectedHtml.includes('</head>')) {
                injectedHtml = injectedHtml.replace('</head>', `<style>${css}</style></head>`);
            } else if (injectedHtml.includes('<body')) {
                injectedHtml = injectedHtml.replace(/<body/i, `<style>${css}</style><body`);
            } else {
                injectedHtml = `<style>${css}</style>` + injectedHtml;
            }
        }

        // Inject JS inline before closing body
        if (js) {
            if (injectedHtml.includes('</body>')) {
                injectedHtml = injectedHtml.replace('</body>', `<script>${js}</script></body>`);
            } else if (injectedHtml.includes('</html>')) {
                injectedHtml = injectedHtml.replace('</html>', `<script>${js}</script></html>`);
            } else {
                injectedHtml += `<script>${js}</script>`;
            }
        }
        return injectedHtml;
    };

    const handleDownload = async () => {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        Object.entries(files).forEach(([path, content]) => {
            zip.file(path, content);
        });
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${plan?.projectName || 'jarvis-project'}.zip`;
        a.click();
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* LEFT SIDEBAR: Controls & Logs */}
            <aside className="w-[400px] flex flex-col border-r border-white/5 bg-[#080808]/50 backdrop-blur-xl relative z-10">
                {/* Header */}
                <header className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap className="text-white" size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight tracking-tight">JARVIS</h1>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">AI Architect v2.0</p>
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                    {/* Activity Stream */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} />
                                <span>System Activity</span>
                            </div>
                            {logs.length > 0 && <span className="text-xs font-mono text-gray-600">{logs.length} events</span>}
                        </div>

                        <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[12px] leading-relaxed shadow-inner min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar">
                            {logs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 gap-2">
                                    <Cpu size={24} />
                                    <span>System Idle. Awaiting prompt.</span>
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="flex items-start gap-3">
                                        <span className="text-[10px] text-gray-600 mt-0.5 min-w-[50px]">{log.time}</span>
                                        <div className="flex-1">
                                            {log.type === 'system' && <span className="text-blue-400">➜ </span>}
                                            {log.type === 'error' && <span className="text-red-500">✖ </span>}
                                            {log.type === 'success' && <span className="text-green-500">✔ </span>}
                                            <span className={cn(
                                                "break-words",
                                                log.type === 'error' ? "text-red-400" :
                                                    log.type === 'success' ? "text-green-400" :
                                                        log.type === 'info' ? "text-blue-300" : "text-gray-300"
                                            )}>{log.message}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* Project Plan Card */}
                    {plan && (
                        <div className="glass-panel rounded-xl p-5 animate-in zoom-in-95 duration-500 border-l-2 border-l-blue-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-base text-gray-100">{plan.projectName}</h3>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-[10px] font-bold uppercase tracking-wider">
                                    <Check size={10} /> Active
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 mb-4 leading-relaxed">{plan.description}</p>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-2">Tech Stack</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {plan.techStack.map(t => (
                                            <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 text-[10px] rounded-md font-medium">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-white/5 bg-[#080808] space-y-3">
                    <form onSubmit={Object.keys(files).length > 0 ? handleRefine : handleGenerate} className="relative group">
                        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={Object.keys(files).length > 0 ? "Refine your creation (e.g., 'Make the button blue')..." : "Describe your dream app..."}
                            className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 pr-14 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none h-32 text-sm placeholder:text-gray-600 relative z-10 custom-scrollbar"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    Object.keys(files).length > 0 ? handleRefine() : handleGenerate();
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isGenerating || !prompt.trim()}
                            className="absolute bottom-4 right-4 p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-20 disabled:grayscale active:scale-95 z-20"
                        >
                            {isGenerating ?
                                <RefreshCw className="animate-spin" size={18} /> :
                                <Send size={18} />
                            }
                        </button>
                    </form>

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="appearance-none bg-white/5 border border-white/10 text-[10px] text-gray-300 rounded-lg pl-2 pr-6 py-1 font-mono uppercase focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <option value="openai">ChatGPT (OpenAI)</option>
                                    <option value="auto">Auto (Best)</option>
                                    <option value="claude">Claude (Anthropic)</option>
                                    <option value="groq">Groq (Llama 3)</option>
                                    <option value="openrouter">OpenRouter</option>
                                    <option value="perplexity">Perplexity</option>
                                    <option value="gemini">Gemini</option>
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-600">Shift + Enter for new line</span>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative bg-[#030303] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#030303] to-[#030303]">
                {/* Top Navigation Bar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                        <button
                            onClick={() => setView('preview')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2",
                                view === 'preview' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Layout size={14} /> Preview
                        </button>
                        <button
                            onClick={() => setView('code')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2",
                                view === 'code' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Code size={14} /> Code
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {view === 'preview' && Object.keys(files).length > 0 && (
                            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setPreviewMode('desktop')}
                                    className={cn("p-1.5 rounded-md transition-all", previewMode === 'desktop' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
                                >
                                    <Monitor size={16} />
                                </button>
                                <button
                                    onClick={() => setPreviewMode('mobile')}
                                    className={cn("p-1.5 rounded-md transition-all", previewMode === 'mobile' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
                                >
                                    <Smartphone size={16} />
                                </button>
                            </div>
                        )}

                        {Object.keys(files).length > 0 && (
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <Download size={14} /> Export
                            </button>
                        )}
                    </div>
                </header>

                {/* Workspace Content */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {view === 'preview' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5 relative">
                            {Object.keys(files).length > 0 ? (
                                <div className={cn(
                                    "transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden border border-white/10 relative",
                                    previewMode === 'mobile' ? "w-[375px] h-[812px] rounded-[40px] border-8 border-black" : "w-full h-full"
                                )}>
                                    {previewMode === 'mobile' && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-2xl z-50"></div>
                                    )}
                                    <iframe
                                        title="Jarvis Preview"
                                        className="w-full h-full"
                                        srcDoc={getPreviewSource()}
                                        sandbox="allow-scripts"
                                    />
                                </div>
                            ) : (
                                <div className="text-center opacity-30 mt-[-100px]">
                                    <Zap size={64} className="mx-auto mb-4 text-white" strokeWidth={1} />
                                    <h2 className="text-2xl font-light text-white tracking-widest uppercase">System Ready</h2>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex">
                            {/* File Explorer */}
                            <nav className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col">
                                <div className="p-4 border-b border-white/5">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Files</h4>
                                </div>
                                <div className="p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                                    {Object.keys(files).sort().map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setActiveFile(f)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-2 truncate",
                                                activeFile === f
                                                    ? "bg-blue-500/10 text-blue-400"
                                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                            )}
                                        >
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                f.endsWith('.html') ? "bg-orange-500" :
                                                    f.endsWith('.css') ? "bg-blue-500" :
                                                        f.endsWith('.js') ? "bg-yellow-500" : "bg-gray-500"
                                            )} />
                                            {f.split('/').pop()}
                                        </button>
                                    ))}
                                </div>
                            </nav>

                            {/* Code Editor */}
                            <div className="flex-1 bg-[#0c0c0c] relative flex flex-col">
                                <div className="absolute top-0 right-0 p-4 z-10 opacity-50 hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-white/10 px-2 py-1 rounded">Read-Only View</span>
                                </div>
                                <textarea
                                    spellCheck={false}
                                    value={files[activeFile] || ''}
                                    onChange={(e) => handleManualEdit(e.target.value)}
                                    className="w-full h-full bg-transparent p-6 font-mono text-sm text-gray-300 leading-7 outline-none resize-none custom-scrollbar"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
