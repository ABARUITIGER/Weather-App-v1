import React, { useState } from 'react';
import { Terminal, Github, Cloud, X, ChevronRight, HelpCircle } from 'lucide-react';

export default function DeploymentNotes() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-900 text-white p-3 rounded-none shadow-xl hover:bg-slate-800 transition flex items-center gap-2 font-bold tracking-widest uppercase text-[10px] z-50 border border-slate-700"
      >
        <HelpCircle className="h-4 w-4" />
        Deployment Help
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-none border border-gray-200 shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-slate-800">
            <Terminal className="h-5 w-5" />
            <h2 className="text-sm font-black tracking-widest uppercase">Deployment Notes</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-slate-800 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-8 text-slate-700 text-sm">
          {/* Local Development Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Terminal className="h-5 w-5" />
              <h3 className="font-bold tracking-widest uppercase text-xs">Local Development</h3>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 space-y-3">
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span><strong>Install dependencies:</strong> <br/>
                    <code className="bg-white px-2 py-1 text-xs text-orange-600 border border-gray-200 mt-1 block w-fit">npm install</code>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span><strong>Run the dev server:</strong> <br/>
                    <code className="bg-white px-2 py-1 text-xs text-orange-600 border border-gray-200 mt-1 block w-fit">npm run dev</code>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span><strong>Build for production (Node):</strong> <br/>
                    <code className="bg-white px-2 py-1 text-xs text-orange-600 border border-gray-200 mt-1 block w-fit">npm run build</code>
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* GitHub Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Github className="h-5 w-5" />
              <h3 className="font-bold tracking-widest uppercase text-xs">1. Export from AI Studio to GitHub</h3>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 space-y-3">
              <p className="leading-relaxed">To move this codebase to your own GitHub repository:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Click the <strong>Download</strong> or <strong>Export to GitHub</strong> button in the AI Studio menu (top right).</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>If downloading as ZIP, extract the files, initialize a new Git repository (<code className="bg-white px-1 py-0.5 text-xs text-orange-600 border border-gray-200">git init</code>), and commit the code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Push the code to a new public or private repository on your GitHub account.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Cloudflare Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Cloud className="h-5 w-5" />
              <h3 className="font-bold tracking-widest uppercase text-xs">2. Deploy to Cloudflare Workers</h3>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 space-y-3">
              <p className="leading-relaxed">Once your code is locally setup or in GitHub, deploy to Cloudflare:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Open a terminal in your project directory and run <code className="bg-white px-1 py-0.5 text-xs text-orange-600 border border-gray-200">npm install</code> to ensure dependencies are loaded.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Log in to Cloudflare CLI by running: <br/>
                    <code className="bg-white px-2 py-1 text-xs text-orange-600 border border-gray-200 mt-1 block w-fit">npx wrangler login</code>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Deploy the application using the predefined script: <br/>
                    <code className="bg-white px-2 py-1 text-xs text-orange-600 border border-gray-200 mt-1 block w-fit">npm run deploy:cf</code>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>If you are using the Gemini API, you need to set your API Key in Cloudflare: <br/>
                    <code className="bg-white px-2 py-1 text-xs text-orange-600 border border-gray-200 mt-1 block w-fit">npx wrangler secret put GEMINI_API_KEY</code>
                  </span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-4 italic">Note: The configuration is ready in wrangler.toml with the name "weather-app-v2".</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
