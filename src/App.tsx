import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024;

const SAMPLE_REGEX = '[a-zA-Z]+';
const SAMPLE_TEXT = 'Hello World! This is a test string with 123 numbers and symbols!@#$';

interface Match {
  index: number;
  text: string;
  length: number;
}

interface CheatSheetItem {
  category: string;
  items: Array<{ syntax: string; description: string }>;
}

const CHEAT_SHEET: CheatSheetItem[] = [
  {
    category: 'Character Classes',
    items: [
      { syntax: '\\d', description: 'Digit (0-9)' },
      { syntax: '\\D', description: 'Non-digit' },
      { syntax: '\\w', description: 'Word char (a-z, A-Z, 0-9, _)' },
      { syntax: '\\W', description: 'Non-word char' },
      { syntax: '\\s', description: 'Whitespace' },
      { syntax: '\\S', description: 'Non-whitespace' },
      { syntax: '.', description: 'Any character (except newline)' },
    ],
  },
  {
    category: 'Quantifiers',
    items: [
      { syntax: '*', description: '0 or more times' },
      { syntax: '+', description: '1 or more times' },
      { syntax: '?', description: '0 or 1 time' },
      { syntax: '{n}', description: 'Exactly n times' },
      { syntax: '{n,}', description: 'n or more times' },
      { syntax: '{n,m}', description: 'Between n and m times' },
    ],
  },
  {
    category: 'Anchors & Boundaries',
    items: [
      { syntax: '^', description: 'Start of line/string' },
      { syntax: '$', description: 'End of line/string' },
      { syntax: '\\b', description: 'Word boundary' },
      { syntax: '\\B', description: 'Non-word boundary' },
    ],
  },
  {
    category: 'Logic & Groups',
    items: [
      { syntax: '(x|y)', description: 'Alternation (OR)' },
      { syntax: '(x)', description: 'Capturing group' },
      { syntax: '(?:x)', description: 'Non-capturing group' },
      { syntax: '[abc]', description: 'Character set' },
      { syntax: '[^abc]', description: 'Negated set' },
      { syntax: '[a-z]', description: 'Character range' },
    ],
  },
];

export default function App() {
  const [pattern, setPattern] = useState(SAMPLE_REGEX);
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState(SAMPLE_TEXT);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (window.location.hash.includes('#:~:text=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const updateMatches = useCallback((pat: string, flgs: string, text: string) => {
    setError(null);
    setSizeError(false);

    if (!pat.trim() || !text.trim()) {
      setMatches([]);
      return;
    }

    if (new Blob([text]).size > MAX_BYTES) {
      setSizeError(true);
      setMatches([]);
      return;
    }

    setTimeout(() => {
      try {
        const regex = new RegExp(pat, flgs);
        const foundMatches: Match[] = [];
        let match;

        if (flgs.includes('g')) {
          while ((match = regex.exec(text)) !== null) {
            foundMatches.push({
              index: match.index,
              text: match[0],
              length: match[0].length,
            });
          }
        } else {
          match = regex.exec(text);
          if (match) {
            foundMatches.push({
              index: match.index,
              text: match[0],
              length: match[0].length,
            });
          }
        }

        setMatches(foundMatches);
      } catch (err) {
        setError((err as Error).message);
        setMatches([]);
      }
    }, 20);
  }, []);

  const handlePatternChange = (value: string) => {
    setPattern(value);
    updateMatches(value, flags, testString);
  };

  const handleFlagChange = (flag: string) => {
    const newFlags = flags.includes(flag)
      ? flags.replace(flag, '')
      : flags + flag;
    setFlags(newFlags);
    updateMatches(pattern, newFlags, testString);
  };

  const handleTestStringChange = (value: string) => {
    setTestString(value);
    updateMatches(pattern, flags, value);
  };

  const handleSampleData = () => {
    setPattern(SAMPLE_REGEX);
    setFlags('g');
    setTestString(SAMPLE_TEXT);
    updateMatches(SAMPLE_REGEX, 'g', SAMPLE_TEXT);
  };

  const handleClear = () => {
    setPattern('');
    setTestString('');
    setMatches([]);
    setError(null);
    setSizeError(false);
  };

  const handleCheatSheetClick = (syntax: string) => {
    const newPattern = pattern + syntax;
    setPattern(newPattern);
    updateMatches(newPattern, flags, testString);
  };

  const handleCopyMatches = async () => {
    if (matches.length === 0) return;
    const text = matches.map(m => m.text).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const renderHighlightedText = () => {
    if (matches.length === 0) return testString;

    const parts: Array<{ text: string; isMatch: boolean }> = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      if (match.index > lastIndex) {
        parts.push({ text: testString.slice(lastIndex, match.index), isMatch: false });
      }
      parts.push({ text: match.text, isMatch: true });
      lastIndex = match.index + match.length;
    });

    if (lastIndex < testString.length) {
      parts.push({ text: testString.slice(lastIndex), isMatch: false });
    }

    return parts.map((part, idx) =>
      part.isMatch ? (
        <span key={idx} className="bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
          {part.text}
        </span>
      ) : (
        <span key={idx}>{part.text}</span>
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-lg">
              .*
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">Clean Regex</h2>
          </div>
          <div className="border-t border-slate-700 pt-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Clean Regex Online</h1>
            <p className="text-slate-300 text-base">
              Test, debug, and clean regular expressions with real-time browser-based string matching, or reference our interactive formatting matrix.
            </p>
          </div>
        </div>
      </header>

      {/* Privacy Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <ShieldCheck className="text-emerald-400 mt-0.5 shrink-0 flex-none" size={20} aria-hidden="true" />
          <p className="text-sm text-slate-100 leading-relaxed">
            <span className="font-semibold text-emerald-400">Privacy First:</span> Your testing strings and expression patterns are parsed entirely inside your local browser memory via JavaScript. No data is ever uploaded to a server, keeping your development code 100% secure.
          </p>
        </div>
      </div>

      <main className="flex-1 px-4 py-8" id="main-content">
        <div className="max-w-7xl mx-auto">
          {/* Step 1 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-lg">
                1
              </div>
              <h2 className="text-xl font-bold text-white">Define Expression & Flags</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="mb-6">
                <label htmlFor="pattern-input" className="block text-sm font-bold uppercase tracking-widest text-slate-100 mb-3">
                  Regex Pattern
                </label>
                <div className="relative">
                  <input
                    id="pattern-input"
                    type="text"
                    value={pattern}
                    onChange={(e) => handlePatternChange(e.target.value)}
                    placeholder="e.g., [a-zA-Z]+ or \d{3}-\d{4}"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  {error && <p className="absolute -bottom-6 left-0 text-xs text-rose-400 mt-1">{error}</p>}
                </div>
                {error && <p className="text-xs text-rose-400 mt-6 bg-rose-950/30 border border-rose-700/30 rounded px-3 py-2">Syntax Error: {error}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold uppercase tracking-widest text-slate-100">Flags</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { flag: 'g', label: 'Global (g)', desc: 'Find all matches' },
                    { flag: 'i', label: 'Insensitive (i)', desc: 'Case insensitive' },
                    { flag: 'm', label: 'Multiline (m)', desc: 'Multiline mode' },
                  ].map(({ flag, label, desc }) => (
                    <button
                      key={flag}
                      onClick={() => handleFlagChange(flag)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        flags.includes(flag)
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                      title={desc}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-lg">
                2
              </div>
              <h2 className="text-xl font-bold text-white">Input Test String Data</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <label htmlFor="test-input" className="text-sm font-bold uppercase tracking-widest text-slate-100">
                  Raw String Text Input
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSampleData}
                    className="text-sm px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium uppercase tracking-wide transition-colors"
                  >
                    Try Sample Data
                  </button>
                  <button
                    onClick={handleClear}
                    className="text-sm px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium uppercase tracking-wide transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                id="test-input"
                ref={textareaRef}
                value={testString}
                onChange={(e) => handleTestStringChange(e.target.value)}
                placeholder="Paste your test string here…"
                className="w-full h-48 bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm resize-y"
              />
              <p className="text-xs text-slate-300 mt-2">
                {testString.length > 0 ? `${testString.length.toLocaleString()} characters` : 'Ready for input'}
              </p>
            </div>
          </div>

          {/* Size Error */}
          {sizeError && (
            <div className="mb-8 bg-amber-950/50 border border-amber-700/50 rounded-2xl p-4">
              <p className="text-sm text-amber-200">
                <span className="font-bold">⚠️ Large string processing boundary reached.</span> Inputs over 5MB are paused to protect local browser paint threads from freezing. Please subset your testing text files.
              </p>
            </div>
          )}

          {/* Step 3 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-lg">
                3
              </div>
              <h2 className="text-xl font-bold text-white">Analyze Real-Time Match Output</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-100">
                  Highlighted Regex Match Results
                </label>
                <button
                  onClick={handleCopyMatches}
                  disabled={matches.length === 0}
                  className={`text-sm px-4 py-2 rounded-lg font-medium uppercase tracking-wide transition-colors flex items-center gap-2 ${
                    matches.length === 0
                      ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                      : copied
                      ? 'bg-emerald-700 border border-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Matches
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 min-h-32 font-mono text-sm text-slate-100 break-words whitespace-pre-wrap">
                {renderHighlightedText()}
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Matches Found</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{matches.length}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Total Characters</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">{testString.length.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Matched Characters</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">
                    {matches.reduce((sum, m) => sum + m.length, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Match %</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">
                    {testString.length > 0
                      ? Math.round((matches.reduce((sum, m) => sum + m.length, 0) / testString.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cheat Sheet */}
          <div className="mb-8">
            <button
              onClick={() => setCheatOpen(!cheatOpen)}
              className="flex items-center justify-between w-full mb-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors"
            >
              <h2 className="text-xl font-bold text-white">Regex Cheat Sheet & Quick Reference Guide</h2>
              {cheatOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {cheatOpen && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {CHEAT_SHEET.map((section) => (
                    <div key={section.category} className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400">{section.category}</h3>
                      <div className="space-y-2">
                        {section.items.map((item) => (
                          <button
                            key={item.syntax}
                            onClick={() => handleCheatSheetClick(item.syntax)}
                            className="block w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 transition-all"
                          >
                            <code className="text-emerald-300 font-mono font-bold text-sm">{item.syntax}</code>
                            <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-10 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <p className="text-sm text-slate-200 font-medium mb-3">
              Working with complex developer logs or database files? Try our free sister utilities:
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                href="https://cleanjsonlist.com"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-medium transition-colors"
                rel="noopener noreferrer"
              >
                Clean JSON List
              </a>
              <a
                href="https://cleanhtmlcode.com"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-medium transition-colors"
                rel="noopener noreferrer"
              >
                Clean HTML Code
              </a>
              <a
                href="https://mergecsvonline.com"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-medium transition-colors"
                rel="noopener noreferrer"
              >
                Merge CSV Online
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-300">
              Clean Regex — A free browser utility powered by{' '}
              <a
                href="https://sosadigital.com"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-medium transition-colors"
                rel="noopener noreferrer"
              >
                Sosa Digital
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
