import React, { useState } from 'react'

const TECH = [
  { icon: '🤖', name: 'ESP32 Microcontroller', desc: 'Robot locomotion and motor control' },
  { icon: '🍓', name: 'Raspberry Pi 5', desc: 'Image processing and AI inference' },
  { icon: '📷', name: 'Dual Webcams', desc: 'Top-view and middle-view cameras' },
  { icon: '🧠', name: 'Computer Vision / AI', desc: 'Disease classification model' },
  { icon: '🗺️', name: 'Leaflet.js Mapping', desc: 'Real-time GPS disease mapping' },
  { icon: '⚛️', name: 'React + Tailwind CSS', desc: 'Modern responsive frontend' },
  { icon: '🟢', name: 'Node.js + Express', desc: 'Backend API server' },
  { icon: '💾', name: 'PostgreSQL (Supabase)', desc: 'Scan history and data persistence' },
]

const TEAM = [
  {
    name: 'Owen M. Espiritu',
    role: 'Project Lead, Web Developer & Software Engineer',
    initial: 'O',
    image: '/team/owen.png',
    gradient: 'from-forest-600 to-eggplant-700',
  },
  {
    name: 'Paul Andre N. Lozada',
    role: 'Research & Documentation',
    initial: 'P',
    image: '/team/paul.png',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Jordan S. Pangilinan',
    role: 'Research, Documentation & Hardware Assembly',
    initial: 'J',
    image: '/team/jordan.png',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    name: 'Justine S. Soliman',
    role: 'Research, Documentation & Hardware Assembly',
    initial: 'J',
    image: '/team/justine.png',
    gradient: 'from-purple-500 to-violet-600',
  },
]

function TeamCard({ name, role, initial, image, gradient }) {
  const [errored, setErrored] = useState(false) // ✅ now works

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-7 text-center border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="mx-auto mb-4 w-24 h-24 rounded-2xl overflow-hidden shadow-md">
        {!errored ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl font-bold text-white`}
          >
            {initial}
          </div>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{name}</h3>
      <p className="text-gray-400 text-xs leading-relaxed">{role}</p>
    </div>
  )
}

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
          {TEAM.map((member) => (
            <TeamCard key={member.name} {...member} />
          ))}
        </div>
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
