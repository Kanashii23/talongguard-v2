import React from "react"
// Place your leaf images in /public/diseases/ with these exact filenames:
// healthy.jpg, insect.jpg, leafspot.jpg, mosaic.jpg, wilt.jpg
const DISEASES = [
  {
    key: 'healthy', image: '/diseases/healthy.jpg', name: 'Healthy Leaf', color: '#22c55e',
    bg: 'from-green-50 to-emerald-50', tagBg: 'bg-green-100', tagText: 'text-green-700',
    desc: 'Eggplant (Solanum melongena) leaves in optimal condition with no signs of infection, pest damage, or nutritional deficiency. Healthy leaves indicate proper crop management and favorable growing conditions.',
    symptoms: ['Deep, uniform green color across the entire leaf', 'No spots, lesions, or discoloration of any kind', 'Firm, full leaf structure with intact edges', 'Normal growth pattern with no curling or distortion', 'Leaves respond normally to sunlight and water'],
  },
  {
    key: 'insect', image: '/diseases/insect.jpg', name: 'Insect Pest Disease', color: '#ef4444',
    bg: 'from-red-50 to-rose-50', tagBg: 'bg-red-100', tagText: 'text-red-700',
    desc: 'Physical damage caused by insects feeding on eggplant leaves. Common pests include aphids (Aphis gossypii, Myzus persicae), whiteflies, flea beetles, and leaf miners — all of which cause significant yield losses and quality degradation if not managed promptly.',
    symptoms: ['Irregular holes, pits, or chewed edges on leaf surfaces', 'Silvery, bronze, or stippled discoloration from feeding', 'Sticky honeydew residue promoting sooty mold growth', 'Visible insects or larvae on undersides of leaves', 'Distorted or curled leaves from heavy infestations'],
  },
  {
    key: 'leafspot', image: '/diseases/leafspot.jpg', name: 'Leaf Spot Disease', color: '#f97316',
    bg: 'from-orange-50 to-amber-50', tagBg: 'bg-orange-100', tagText: 'text-orange-700',
    desc: 'Fungal or bacterial infection causing distinct spots on eggplant leaf surfaces. Cercospora leaf spot and Phomopsis blight are common culprits, spreading rapidly in warm, humid conditions and causing severe defoliation that reduces fruit size and crop yield.',
    symptoms: ['Small circular yellow lesions that enlarge over time', 'Brown or black spots with yellow halo surrounding them', 'Gray fuzz or dark brown rings at the center of spots', 'Concentric ring patterns ("frog eye" appearance)', 'Premature leaf drop in severe infections'],
  },
  {
    key: 'mosaic', image: '/diseases/mosaic.jpg', name: 'Mosaic Virus Disease', color: '#eab308',
    bg: 'from-yellow-50 to-lime-50', tagBg: 'bg-yellow-100', tagText: 'text-yellow-700',
    desc: 'Viral disease transmitted primarily by aphid vectors causing characteristic mosaic-like discoloration on eggplant leaves. The virus disrupts normal chlorophyll distribution, leading to stunted growth and significantly reduced yields if not controlled early.',
    symptoms: ['Mosaic pattern of alternating light and dark green patches', 'Mottled or speckled appearance especially on young leaves', 'Leaf curling, puckering, and distortion', 'Stunted plant growth and reduced fruit set', 'Yellowing interveinal areas on affected leaves'],
  },
  {
    key: 'wilt', image: '/diseases/wilt.jpg', name: 'Wilt Disease', color: '#a855f7',
    bg: 'from-purple-50 to-violet-50', tagBg: 'bg-purple-100', tagText: 'text-purple-700',
    desc: 'Bacterial or fungal pathogens (Ralstonia solanacearum, Fusarium oxysporum, Verticillium dahliae) that invade and block the vascular system of eggplant, cutting off water and nutrient transport. One of the most destructive eggplant diseases, often resulting in total plant death.',
    symptoms: ['Sudden drooping and wilting of leaves during the day', 'Yellowing starting from lower leaves progressing upward', 'Dark brown streaks or discoloration inside the stem when cut', 'Slimy bacterial ooze from cut stems (bacterial wilt)', 'Rapid spread to the entire plant despite the stem remaining upright'],
  },
]

function DiseaseImage({ src, alt, bg }) {
  const [errored, setErrored] = React.useState(false)
  return (
    <div className={`h-48 bg-gradient-to-br ${bg} relative overflow-hidden flex items-center justify-center`}>
      {!errored
        ? <img src={src} alt={alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setErrored(true)} />
        : <div className="flex flex-col items-center justify-center gap-2 text-gray-400 text-sm font-medium">
            <span className="text-3xl">🍃</span>
            <span>Add {alt} image</span>
          </div>
      }
    </div>
  )
}

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
            Learn to identify the 5 conditions TalongGuard detects — from healthy leaves to serious fungal and viral diseases.
          </p>
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 items-stretch">
          {DISEASES.map((d, i) => (
            <div key={d.key}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <DiseaseImage src={d.image} alt={d.name} bg={d.bg} />
              <div className="p-4 flex flex-col flex-1">
                <span className={`inline-block text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full mb-2 ${d.tagBg} ${d.tagText}`}>
                  ● {d.name}
                </span>
                <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-3">{d.desc}</p>
                <div className="border-t border-gray-100 pt-3 mt-auto">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Symptoms</p>
                  <div className="flex flex-col gap-1" style={{ minHeight: "185px" }}>
                    {d.symptoms.map(s => (
                      <div key={s} className="flex items-start gap-1.5 text-xs text-gray-600">
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