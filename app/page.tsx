import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-black">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Scribex</h1>
          <nav>
            <Link
              href="/edit"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Advanced Editor for Local Documents
          </h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto">
            Create, edit, and store your documents entirely on your device.
            No cloud, no accounts, just you and your words.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/edit"
              className="px-6 py-3 border border-black rounded-md text-lg font-semibold hover:bg-black hover:text-white transition-colors"
            >
              Start Writing
            </Link>
            <a
              href="#features"
              className="px-6 py-3 border border-black rounded-md text-lg font-semibold hover:bg-black hover:text-white transition-colors"
            >
              Learn More
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">Why Scribex?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-black rounded-lg">
              <div className="text-4xl mb-4">📄</div>
              <h4 className="text-xl font-semibold mb-2">Local-First Storage</h4>
              <p>
                Your documents live on your device. No uploads, no sync conflicts,
                and complete control over your data.
              </p>
            </div>
            <div className="p-6 border border-black rounded-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-xl font-semibold mb-2">Powerful Editing</h4>
              <p>
                Rich text formatting, markdown support, and a distraction-free
                interface that keeps you in the flow.
              </p>
            </div>
            <div className="p-6 border border-black rounded-lg">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-semibold mb-2">Privacy by Default</h4>
              <p>
                Nothing leaves your browser. Your writing is yours alone — always.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="text-center">
              <div className="w-16 h-16 border border-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto">1</div>
              <p className="mt-4 font-medium">Open the Editor</p>
            </div>
            <div className="text-4xl hidden md:block">→</div>
            <div className="text-center">
              <div className="w-16 h-16 border border-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto">2</div>
              <p className="mt-4 font-medium">Write Freely</p>
            </div>
            <div className="text-4xl hidden md:block">→</div>
            <div className="text-center">
              <div className="w-16 h-16 border border-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto">3</div>
              <p className="mt-4 font-medium">Stored Locally</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm">© {new Date().getFullYear()} Scribex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
