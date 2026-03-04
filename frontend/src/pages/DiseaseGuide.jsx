const DISEASES = [
  {
    key: 'healthy', emoji: '🌱', name: 'Healthy Leaf', color: '#22c55e',
    bg: 'from-green-50 to-emerald-50', tagBg: 'bg-green-100', tagText: 'text-green-700',
    desc: 'No signs of disease or damage. The plant is in optimal condition with vibrant green coloration and normal leaf structure.',
    symptoms: ['Deep, uniform green color', 'No spots, lesions, or discoloration', 'Firm and full leaf structure', 'Normal growth pattern'],
  },
  {
    key: 'insect', emoji: '🐛', name: 'Insect Pest Disease', color: '#ef4444',
    bg: 'from-red-50 to-rose-50', tagBg: 'bg-red-100', tagText: 'text-red-700',
    desc: 'Damage caused by insects feeding on leaves — including aphids, whiteflies, and leaf miners that commonly attack eggplant crops.',
    symptoms: ['Irregular holes or chewed leaf edges', 'Silvery or bronze discoloration', 'Sticky residue (honeydew) on leaves', 'Visible insects under leaves'],
  },
  {
    key: 'leafspot', emoji: '🟠', name: 'Leaf Spot Disease', color: '#f97316',
    bg: 'from-orange-50 to-amber-50', tagBg: 'bg-orange-100', tagText: 'text-orange-700',
    desc: 'Fungal or bacterial infection causing distinct spots on leaf surfaces, spreading rapidly in warm and humid conditions.',
    symptoms: ['Round or angular brown/black spots', 'Yellow halo surrounding spots', 'Dark center on each spot', 'Premature leaf drop in severe cases'],
  },
  {
    key: 'mosaic', emoji: '🟡', name: 'Mosaic Virus', color: '#eab308',
    bg: 'from-yellow-50 to-lime-50', tagBg: 'bg-yellow-100', tagText: 'text-yellow-700',
    desc: 'Viral disease transmitted by aphids causing mosaic-like patterns of contrasting green and yellow on leaf surfaces.',
    symptoms: ['Mosaic pattern of light/dark green', 'Leaf curling and distortion', 'Stunted plant growth', 'Mottled appearance on young leaves'],
  },
  {
    key: 'mold', emoji: '☁️', name: 'White Mold Disease', color: '#3b82f6',
    bg: 'from-blue-50 to-sky-50', tagBg: 'bg-blue-100', tagText: 'text-blue-700',
    desc: 'Fungal disease caused by Sclerotinia, producing white cottony growth on stems and leaves, especially in dense plantings.',
    symptoms: ['White fluffy/cottony mold growth', 'Water-soaked lesions on stems', 'Hard black structures (sclerotia)', 'Rapid wilting of affected parts'],
  },
  {
    key: 'wilt', emoji: '🟣', name: 'Wilt Disease', color: '#a855f7',
    bg: 'from-purple-50 to-violet-50', tagBg: 'bg-purple-100', tagText: 'text-purple-700',
    desc: 'Bacterial or fungal wilt blocking water transport within the plant, leading to rapid wilting and eventual plant death.',
    symptoms: ['Sudden drooping of leaves', 'Yellowing starting from lower leaves', 'Brown discoloration inside stem', 'Rapid spread to whole plant'],
  },
]

export default function DiseaseGuide() {
  return (
    <div className="page-enter">
      <section className="bg-gradient-to-br from-forest-950 to-eggplant-950 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-green-300 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            🔬 Disease Reference Guide
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4">
            Know Your<br />
            <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              Eggplant Diseases
            </em>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Learn to identify the 6 conditions TalongGuard detects — from healthy leaves to serious fungal and viral diseases.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DISEASES.map((d, i) => (
            <div key={d.key}
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`h-32 bg-gradient-to-br ${d.bg} flex items-center justify-center relative overflow-hidden`}>
                <div className="text-6xl group-hover:scale-110 transition-transform duration-300">{d.emoji}</div>
              </div>
              <div className="p-6">
                <span className={`inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3 ${d.tagBg} ${d.tagText}`}>
                  ● {d.name}
                </span>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{d.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{d.desc}</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">Symptoms</p>
                  <div className="flex flex-col gap-1.5">
                    {d.symptoms.map(s => (
                      <div key={s} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: d.color }}>→</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}