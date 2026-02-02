'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Send, Zap, Code, Layout, Download, LogOut, Check, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState([]);
    const [plan, setPlan] = useState(null);
    const [files, setFiles] = useState({});
    const [activeFile, setActiveFile] = useState('index.html');
    const [view, setView] = useState('preview'); // 'preview' or 'code'

    const logsEndRef = useRef(null);
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (status === 'loading') return <div className="min-h-screen grid place-items-center bg-black text-white font-mono text-xl animate-pulse">Initializing Jarvis...</div>;

    if (!session) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-6">
                <div className="w-full max-w-md text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="mx-auto w-24 h-24 bg-blue-600/20 rounded-3xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.15)]">
                        <Zap className="text-blue-500 animate-pulse" size={48} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent italic">JARVIS</h1>
                        <p className="text-gray-400 text-lg">Your Personal AI Software Engineer.</p>
                    </div>
                    <button
                        onClick={() => signIn('google')}
                        className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl"
                    >
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                        Connect with Google
                    </button>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Powered by Gemini & OAuth 2.0</p>
                </div>
            </main>
        );
    }

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setLogs([]);
        setPlan(null);
        setFiles({});

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: prompt }),
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
                        if (data.type === 'status') setLogs(prev => [...prev, data.message]);
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
        } catch (err) {
            setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRefine = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setLogs(prev => [...prev, `🧠 Refining project: ${prompt}`]);

        try {
            const response = await fetch('/api/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: prompt,
                    currentFiles: files,
                    plan: plan,
                }),
            });

            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();

            setFiles(prev => ({ ...prev, ...data.files }));
            setLogs(prev => [...prev, '✨ Refinement complete!']);
            setPrompt('');
        } catch (err) {
            setLogs(prev => [...prev, `❌ Refine Error: ${err.message}`]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleManualEdit = (newContent) => {
        setFiles(prev => ({ ...prev, [activeFile]: newContent }));
    };

    const getPreviewSource = () => {
        if (!files['index.html']) return '';
        let html = files['index.html'];
        const css = files['styles.css'] || '';
        const js = files['script.js'] || '';

        let injectedHtml = html;
        if (css) injectedHtml = injectedHtml.replace(/<link.*href="styles\.css".*>/i, `<style>${css}</style>`);
        if (js) injectedHtml = injectedHtml.replace(/<script.*src="script\.js".*><\/script>/i, `<script>${js}</script>`);

        if (injectedHtml === html) {
            injectedHtml = injectedHtml.replace('</head>', `<style>${css}</style></head>`)
                .replace('</body>', `<script>${js}</script></body>`);
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
        a.download = `${plan?.projectName || 'project'}.zip`;
        a.click();
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* SIDEBAR */}
            <aside className="w-[380px] border-r border-white/5 flex flex-col bg-[#0a0a0a]">
                <header className="p-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Zap className="text-blue-500" size={20} fill="currentColor" />
                        <span className="font-black italic tracking-tighter text-xl">JARVIS</span>
                    </div>
                    <button onClick={() => signOut()} className="p-2 text-gray-500 hover:text-white transition rounded-full hover:bg-white/5">
                        <LogOut size={18} />
                    </button>
                </header>

                <section className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <Terminal size={12} />
                            <span>Activity Stream</span>
                        </div>
                        <div className="bg-black/50 border border-white/5 rounded-2xl p-4 font-mono text-[13px] leading-relaxed space-y-1 min-h-[120px]">
                            {logs.length === 0 && <span className="text-gray-700 italic">Waiting for instructions...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="text-gray-400 group">
                                    <span className="text-blue-500/50 mr-2 group-last:animate-pulse">▶</span>
                                    {log}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {plan && (
                        <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-5 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-blue-400 mb-3">
                                <Check size={16} className="bg-blue-400/20 p-0.5 rounded-full" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Plan Verified</span>
                            </div>
                            <h3 className="text-lg font-bold mb-1">{plan.projectName}</h3>
                            <p className="text-xs text-gray-400 mb-4 line-clamp-2">{plan.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {plan.techStack.map(t => (
                                    <span key={t} className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-300 text-[9px] rounded-md font-bold uppercase">{t}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <footer className="p-6 border-t border-white/5">
                    <form onSubmit={Object.keys(files).length > 0 ? handleRefine : handleGenerate} className="relative group">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={Object.keys(files).length > 0 ? "Refine your creation..." : "Type project description..."}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 pr-14 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-32 text-sm placeholder:text-gray-600"
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Object.keys(files).length > 0 ? handleRefine() : handleGenerate(); } }}
                        />
                        <button
                            type="submit"
                            disabled={isGenerating || !prompt.trim()}
                            className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </footer>
            </aside>

            {/* MAIN PREVIEW AREA */}
            <main className="flex-1 flex flex-col relative">
                <header className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                    <button
                        onClick={() => setView('preview')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                            view === 'preview' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
                        )}
                    >
                        <Layout size={14} /> PREVIEW
                    </button>
                    <button
                        onClick={() => setView('code')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                            view === 'code' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
                        )}
                    >
                        <Code size={14} /> SOURCE
                    </button>
                </header>

                {Object.keys(files).length > 0 && (
                    <div className="absolute top-6 right-6 z-20 flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-3 bg-white/[0.05] border border-white/10 backdrop-blur-xl text-white rounded-2xl hover:bg-white/10 transition-all shadow-xl flex items-center gap-2 group"
                            title="Download ZIP"
                        >
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                )}

                <div className="flex-1 w-full h-full relative">
                    {view === 'preview' ? (
                        <div className="w-full h-full bg-white">
                            {Object.keys(files).length > 0 ? (
                                <iframe
                                    title="Jarvis Preview"
                                    className="w-full h-full border-none shadow-[inside_0_0_100px_rgba(0,0,0,0.1)]"
                                    srcDoc={getPreviewSource()}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/5 via-transparent to-transparent opacity-50" />
                                    <Zap className="text-gray-900 mb-6 animate-pulse" size={120} strokeWidth={0.5} />
                                    <div className="space-y-2 text-center relative z-10">
                                        <h2 className="text-gray-600 font-bold uppercase tracking-[0.3em] text-[10px]">Neural Network Idle</h2>
                                        <p className="text-gray-800 text-sm">Enter a prompt to initialize generation system.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex bg-[#0a0a0a]">
                            <nav className="w-72 border-r border-white/5 p-6 flex flex-col gap-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Project Files</h4>
                                    <div className="space-y-1">
                                        {Object.keys(files).sort().map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setActiveFile(f)}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border",
                                                    activeFile === f
                                                        ? "bg-blue-600/10 text-blue-400 border-blue-500/30"
                                                        : "text-gray-500 hover:text-gray-300 border-transparent hover:bg-white/5"
                                                )}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </nav>
                            <div className="flex-1 bg-[#050505] relative group">
                                <textarea
                                    spellCheck={false}
                                    value={files[activeFile] || ''}
                                    onChange={(e) => handleManualEdit(e.target.value)}
                                    className="w-full h-full bg-transparent p-12 text-[14px] font-mono text-gray-400 leading-relaxed outline-none resize-none selection:bg-blue-500/30"
                                />
                                <div className="absolute bottom-6 right-10 text-[10px] font-bold text-gray-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Status: Local Buffer
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
