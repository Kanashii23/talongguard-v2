const TECH = [
  { icon: '🤖', name: 'ESP32 Microcontroller', desc: 'Robot locomotion and motor control' },
  { icon: '🍓', name: 'Raspberry Pi 4 Model B', desc: 'Image processing and AI inference' },
  { icon: '📷', name: 'Dual Webcams', desc: 'Top-view and middle-view cameras' },
  { icon: '🧠', name: 'Computer Vision / AI', desc: 'Disease classification model' },
  { icon: '🗺️', name: 'Leaflet.js Mapping', desc: 'Real-time GPS disease mapping' },
  { icon: '⚛️', name: 'React + Tailwind CSS', desc: 'Modern responsive frontend' },
  { icon: '🟢', name: 'Node.js + Express', desc: 'Backend API server (coming soon)' },
  { icon: '💾', name: 'Database Backend', desc: 'Scan history and data persistence' },
]

const TEAM = [
  { name: 'Team Member 1', role: 'Lead Developer', initial: '?' },
  { name: 'Team Member 2', role: 'Hardware Engineer', initial: '?' },
  { name: 'Team Member 3', role: 'AI / ML Engineer', initial: '?' },
  { name: 'Team Member 4', role: 'Data Analyst', initial: '?' },
]

export default function About() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-forest-700 to-eggplant-700 flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl">
            🍆
          </div>
          <h1 className="font-display text-5xl font-bold text-forest-950 dark:text-white mb-4">
            About TalongGuard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
            TalongGuard: An Intelligent Eggplant Disease Diagnostic Rover Equipped with Portable
            Imaging System — a thesis project combining autonomous robotics, computer vision, and AI
            to detect and map eggplant leaf diseases in real time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {[
              { icon: '🏫', label: 'Thesis Project' },
              { icon: '🇵🇭', label: 'Nueva Ecija, Philippines' },
              { icon: '🍆', label: 'Eggplant (Talong) Farming' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-300 font-medium"
              >
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-forest-600 dark:text-forest-400 text-sm font-semibold uppercase tracking-widest mb-3">
            The People
          </p>
          <h2 className="font-display text-4xl font-bold text-forest-950 dark:text-white">
            Meet the Team
          </h2>
          <p className="text-gray-400 text-sm mt-3">The minds behind TalongGuard</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map(({ name, role, initial }) => (
            <div
              key={name}
              className="bg-white dark:bg-gray-800 rounded-3xl p-7 text-center border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-forest-600 to-eggplant-700 flex items-center justify-center text-3xl font-bold font-display text-white mx-auto mb-4 shadow-md">
                {initial}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{name}</h3>
              <p className="text-gray-400 text-xs">{role}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-xs mt-5">
          📌 Update{' '}
          <code className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs">
            frontend/src/pages/About.jsx
          </code>{' '}
          with real team names and roles
        </p>
      </section>

      {/* Tech Stack */}
      <section className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-forest-600 dark:text-forest-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Under the Hood
            </p>
            <h2 className="font-display text-4xl font-bold text-forest-950 dark:text-white">
              Technology Stack
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TECH.map(({ icon, name, desc }) => (
              <div
                key={name}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-3xl flex-shrink-0">{icon}</div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight mb-1">
                    {name}
                  </div>
                  <div className="text-gray-400 text-xs leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
