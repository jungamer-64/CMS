export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to Test Website
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A modern blog platform built with Next.js, MongoDB Atlas, and Tailwind CSS.
        </p>
        <div className="flex gap-4 justify-center">
          <a 
            href="/blog" 
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Browse Blog
          </a>
          <a 
            href="/about" 
            className="px-6 py-3 border border-slate-300 text-slate-700 dark:text-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>
    </main>
  );
}