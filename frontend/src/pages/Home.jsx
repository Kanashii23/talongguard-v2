import { Link } from 'react-router-dom'
import { DISEASE_CONFIG } from '../data/data.js'

export default function Home({ records }) {
  const healthy = records.reduce((s, r) => s + (parseInt(r.healthy) || 0), 0)
  const diseased = records.reduce(
    (s, r) =>
      s +
      (parseInt(r.insect) || 0) +
      (parseInt(r.leafspot) || 0) +
      (parseInt(r.mosaic) || 0) +
      (parseInt(r.wilt) || 0),
    0
  )
  const totalSamples = healthy + diseased

  const features = [
    {
      icon: '🤖',
      title: 'Autonomous Robot',
      desc: 'ESP32-powered robot navigates fields autonomously, scanning each plant with precision using dual cameras — top view and side view.',
    },
    {
      icon: '📷',
      title: 'Dual-Camera System',
      desc: 'Two webcams capture simultaneous top and middle views of leaves. Raspberry Pi 4 processes images in real-time using an AI model.',
    },
    {
      icon: '🗺️',
      title: 'GPS Disease Mapping',
      desc: 'Every scanned plant is plotted on a live map with GPS coordinates, showing exactly which field zones need attention.',
    },
    {
      icon: '📊',
      title: 'Historical Tracking',
      desc: 'Browse past scan sessions by date. Track how disease spread changes over time and monitor the impact of treatments.',
    },
    {
      icon: '🔬',
      title: '5 Disease Classes',
      desc: 'Detects and classifies Healthy Leaf, Insect Pest, Leaf Spot, Mosaic Virus, and Wilt Disease with high accuracy.',
    },
    {
      icon: '🔐',
      title: 'Role-Based Access',
      desc: 'Public visitors can view all data freely. Licensed Agriculturists can log in to edit, annotate, and manage records.',
    },
  ]

  return (
    <div className="page-enter">
      {/* HERO — already dark, no changes needed */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-950 via-forest-900 to-eggplant-950" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a855f7 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-forest-800/60 border border-forest-600/40 text-forest-300 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Intelligent Disease Diagnostic Rover
            </div>
            <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.05] mb-6">
              Intelligent
              <br />
              Eggplant
              <br />
              <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                Diagnostic Rover
              </em>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md mb-10">
              TalongGuard is an intelligent eggplant disease diagnostic rover equipped with a
              portable imaging system — autonomously scanning crops, detecting diseases, and mapping
              outbreaks to help farmers act fast and protect their harvest.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-forest-500 hover:bg-forest-400 text-white font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                View Dashboard →
              </Link>
              <Link
                to="/diseases"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all duration-200"
              >
                Disease Guide
              </Link>
            </div>
          </div>

          <div
            className="hidden lg:block animate-fade-up"
            style={{ animationDelay: '0.15s', opacity: 0 }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-7 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-forest-500/30 flex items-center justify-center text-xl">
                  🌿
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Detection Active</div>
                  <div className="text-green-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Robot scanning field
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(DISEASE_CONFIG).map(([key, cfg]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3.5 py-2.5"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: cfg.color }}
                    />
                    <span className="text-white/80 text-xs font-medium leading-tight">
                      {cfg.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                {[
                  { val: totalSamples, lbl: 'Total Samples' },
                  { val: healthy, lbl: 'Healthy', color: 'text-green-400' },
                  { val: diseased, lbl: 'Diseased', color: 'text-red-400' },
                ].map(({ val, lbl, color }) => (
                  <div key={lbl} className="text-center">
                    <div className={`font-display text-2xl font-bold text-white ${color || ''}`}>
                      {val}
                    </div>
                    <div className="text-white/50 text-xs mt-0.5">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              val: totalSamples,
              lbl: 'Total Number of Samples',
              color: 'text-forest-700 dark:text-forest-400',
            },
            { val: healthy, lbl: 'Healthy Plants', color: 'text-green-600' },
            { val: diseased, lbl: 'Diseased Plants', color: 'text-red-500' },
            {
              val: 5,
              lbl: 'Disease Types Detected',
              color: 'text-eggplant-700 dark:text-eggplant-400',
            },
          ].map(({ val, lbl, color }) => (
            <div
              key={lbl}
              className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:-translate-y-1 transition-transform duration-200"
            >
              <div className={`font-display text-4xl font-bold ${color} mb-1`}>{val}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-forest-600 dark:text-forest-400 text-sm font-semibold uppercase tracking-widest mb-3">
            What TalongGuard Does
          </p>
          <h2 className="font-display text-4xl font-bold text-forest-950 dark:text-white">
            Built for the Field
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white dark:bg-gray-800 rounded-2xl p-7 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-forest-50 dark:bg-forest-900/30 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
