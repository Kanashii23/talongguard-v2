import React from 'react'

const DISEASES = [
  {
    key: 'healthy',
    image: '/diseases/healthy.jpg',
    name: 'Healthy Leaf',
    color: '#22c55e',
    bg: 'from-green-50 to-emerald-50',
    tagBg: 'bg-green-100',
    tagText: 'text-green-700',
    desc: 'Eggplant (Solanum melongena) leaves in optimal condition with no signs of infection, pest damage, or nutritional deficiency. Healthy leaves indicate proper crop management and favorable growing conditions.',
    symptoms: [
      'Deep, uniform green color across the entire leaf',
      'No spots, lesions, or discoloration of any kind',
      'Firm, full leaf structure with intact edges',
      'Normal growth pattern with no curling or distortion',
      'Leaves respond normally to sunlight and water',
    ],
  },
  {
    key: 'insect',
    image: '/diseases/insect.jpg',
    name: 'Insect Pest Disease',
    color: '#ef4444',
    bg: 'from-red-50 to-rose-50',
    tagBg: 'bg-red-100',
    tagText: 'text-red-700',
    desc: 'Physical damage caused by insects feeding on eggplant leaves. Common pests include aphids (Aphis gossypii, Myzus persicae), whiteflies, flea beetles, and leaf miners — all of which cause significant yield losses and quality degradation if not managed promptly.',
    symptoms: [
      'Irregular holes, pits, or chewed edges on leaf surfaces',
      'Silvery, bronze, or stippled discoloration from feeding',
      'Sticky honeydew residue promoting sooty mold growth',
      'Visible insects or larvae on undersides of leaves',
      'Distorted or curled leaves from heavy infestations',
    ],
  },
  {
    key: 'leafspot',
    image: '/diseases/leafspot.jpg',
    name: 'Leaf Spot Disease',
    color: '#f97316',
    bg: 'from-orange-50 to-amber-50',
    tagBg: 'bg-orange-100',
    tagText: 'text-orange-700',
    desc: 'Fungal or bacterial infection causing distinct spots on eggplant leaf surfaces. Cercospora leaf spot and Phomopsis blight are common culprits, spreading rapidly in warm, humid conditions and causing severe defoliation that reduces fruit size and crop yield.',
    symptoms: [
      'Small circular yellow lesions that enlarge over time',
      'Brown or black spots with yellow halo surrounding them',
      'Gray fuzz or dark brown rings at the center of spots',
      'Concentric ring patterns ("frog eye" appearance)',
      'Premature leaf drop in severe infections',
    ],
  },
  {
    key: 'mosaic',
    image: '/diseases/mosaic.jpg',
    name: 'Mosaic Virus Disease',
    color: '#eab308',
    bg: 'from-yellow-50 to-lime-50',
    tagBg: 'bg-yellow-100',
    tagText: 'text-yellow-700',
    desc: 'Viral disease transmitted primarily by aphid vectors causing characteristic mosaic-like discoloration on eggplant leaves. The virus disrupts normal chlorophyll distribution, leading to stunted growth and significantly reduced yields if not controlled early.',
    symptoms: [
      'Mosaic pattern of alternating light and dark green patches',
      'Mottled or speckled appearance especially on young leaves',
      'Leaf curling, puckering, and distortion',
      'Stunted plant growth and reduced fruit set',
      'Yellowing interveinal areas on affected leaves',
    ],
  },
  {
    key: 'wilt',
    image: '/diseases/wilt.jpg',
    name: 'Wilt Disease',
    color: '#a855f7',
    bg: 'from-purple-50 to-violet-50',
    tagBg: 'bg-purple-100',
    tagText: 'text-purple-700',
    desc: 'Bacterial or fungal pathogens (Ralstonia solanacearum, Fusarium oxysporum, Verticillium dahliae) that invade and block the vascular system of eggplant, cutting off water and nutrient transport. One of the most destructive eggplant diseases, often resulting in total plant death.',
    symptoms: [
      'Sudden drooping and wilting of leaves during the day',
      'Yellowing starting from lower leaves progressing upward',
      'Dark brown streaks or discoloration inside the stem when cut',
      'Slimy bacterial ooze from cut stems (bacterial wilt)',
      'Rapid spread to the entire plant despite the stem remaining upright',
    ],
  },
]

const PREVENTION_GUIDE = [
  {
    number: 1,
    key: 'healthy',
    emoji: '🌱',
    name: 'Healthy Leaf Maintenance',
    color: '#22c55e',
    tagBg: 'bg-green-100',
    tagText: 'text-green-700',
    borderColor: 'border-green-200',
    tips: [
      'Apply a balanced NPK fertilizer (10-10-10 or 14-14-14) at planting time and every 4–6 weeks throughout the growing season to maintain strong leaf and fruit development.',
      'Use Ammonium Phosphate (16-20-0) as basal fertilizer applied along planting rows before transplanting to strengthen root formation.',
      'Irrigate once a week during the dry season. During the fruiting stage, increase to twice a week to support consistent moisture levels.',
      'Use plastic mulch (silver side up) over planting beds to control weeds, preserve soil moisture, prevent soil erosion, and reflect sunlight to repel insects hiding under leaves.',
      'Plow the field 2–3 times before planting to eliminate weeds, hibernating insect pests, and soil-borne diseases. Harrow twice to break clods and improve soil aeration.',
      'Regularly inspect leaves for early signs of disease, pest damage, or abnormal discoloration. Early detection prevents rapid spread to neighboring plants.',
      'Ensure full sun exposure of at least 6–8 hours daily and well-drained, fertile soil with a pH range of 5.5–6.5 for optimal eggplant health.',
    ],
    source: {
      label: 'Talong (Eggplant) Cultivation Guide — Juan Magsasaka',
      url: 'https://www.juanmagsasaka.com/2020/12/talong-eggplant-cultivation-guide-all.html',
    },
  },
  {
    number: 2,
    key: 'insect',
    emoji: '🐛',
    name: 'Insect Pest Disease',
    color: '#ef4444',
    tagBg: 'bg-red-100',
    tagText: 'text-red-700',
    borderColor: 'border-red-200',
    tips: [
      'Apply Neem oil spray as an organic insecticide. Neem oil disrupts the life cycle of insects such as aphids, whiteflies, and flea beetles without harming beneficial insects when used correctly.',
      'Use Imidacloprid (systemic insecticide) for severe infestations. Apply as a soil drench or foliar spray following label instructions. Effective against aphids, whiteflies, and leafhoppers.',
      'For Eggplant Fruit and Shoot Borer (EFSB): Spray Azadirachtin 0.03% EC (neem-based insecticide such as Azatrol) — mix 1 part Azatrol with 1 part water and spray at 7–10 day intervals for sustained control.',
      'Apply insecticidal soap (e.g., Safer Soap) to control soft-bodied insects such as aphids and whiteflies. Spray directly onto pests on the undersides of leaves.',
      'Use silver or aluminum reflective plastic mulch on planting beds to repel winged aphids and whiteflies before they land on plants. Most effective in the first few weeks after transplanting.',
      'Monitor the undersides of leaves regularly for insect colonies or larvae. Remove heavily infested leaves promptly and dispose of them away from the field.',
      'Avoid early-season use of broad-spectrum insecticides that disrupt natural enemies (lady beetles, lacewings) which naturally suppress aphid populations.',
    ],
    source: {
      label: 'PlantWise Knowledge Bank — Eggplant Fruit Borer Management',
      url: 'https://plantwiseplusknowledgebank.org/doi/full/10.1079/pwkb.20187800468',
    },
  },
  {
    number: 3,
    key: 'leafspot',
    emoji: '🟠',
    name: 'Leaf Spot Disease',
    color: '#f97316',
    tagBg: 'bg-orange-100',
    tagText: 'text-orange-700',
    borderColor: 'border-orange-200',
    tips: [
      'Apply Chlorothalonil fungicide as a preventive and curative treatment. Chlorothalonil is a broad-spectrum contact fungicide effective against Cercospora leaf spot and early blight on eggplant.',
      'Apply Mancozeb fungicide as a protectant spray. Mancozeb prevents fungal spore germination and is most effective when applied before symptoms appear or at the first sign of infection.',
      'Apply copper-based fungicide (e.g., copper hydroxide or copper oxychloride) as an alternative or rotation fungicide. Copper-based products are effective against both fungal and bacterial leaf spot.',
      'Immediately remove and destroy infected leaves at the first appearance of spots. Do not compost infected plant material as the fungal spores can survive and reinfect.',
      'Avoid overhead irrigation or watering in the late afternoon. Wet leaves promote fungal spore germination. Use drip irrigation or water early in the morning so leaves dry quickly.',
      'Rotate fungicide classes regularly (e.g., alternate Chlorothalonil with Mancozeb) to prevent the development of fungicide resistance in fungal populations.',
      'Maintain adequate plant spacing to improve air circulation between plants, reducing the humidity that favors fungal growth and spore spread.',
    ],
    source: {
      label: 'FMC Philippines — Cercospora Leaf Spot Disease Control',
      url: 'https://ag.fmc.com/ph/en/pests-diseases/disease-control/cercospora-leaf-spot',
    },
  },
  {
    number: 4,
    key: 'mosaic',
    emoji: '🟡',
    name: 'Mosaic Virus Disease',
    color: '#eab308',
    tagBg: 'bg-yellow-100',
    tagText: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    tips: [
      'There is no cure for Mosaic Virus. Once a plant is infected, it cannot recover. Immediately remove all infected plants and destroy them by burning or disposing in sealed garbage bags. Never compost infected plants.',
      'Control aphids and whiteflies — the primary virus vectors — using insecticidal soap (e.g., Safer Soap or Bon-Neem) or neem oil. Note: insecticides cannot stop transmission because aphids transmit the virus within minutes before dying.',
      'Install silver or aluminum reflective plastic mulch on planting beds before transplanting to repel winged aphids. Mulch loses effectiveness when more than 60% of the surface is covered by foliage.',
      'Do NOT save seeds from infected crops. Mosaic Virus can be transmitted through infected seeds to the next generation of plants.',
      'Disinfect all gardening tools (scissors, knives, stakes) after every use with a bleach solution or antiviral spray to prevent mechanical transmission of the virus between plants.',
      'Remove and control perennial weeds within and around the farm. Weeds serve as a reservoir for mosaic viruses and the aphids that carry them.',
      'Plant resistant eggplant varieties when available. Consult your local agricultural extension office for locally adapted resistant cultivars.',
      'Minimize unnecessary handling of plants, especially moving from infected to healthy areas, as the virus can spread mechanically through plant sap contact.',
    ],
    source: {
      label: 'UC IPM — Mosaic Diseases Caused by Potyviruses in Eggplant',
      url: 'https://ipm.ucanr.edu/agriculture/eggplant/mosaic-diseases-caused-by-potyviruses/',
    },
  },
  {
    number: 5,
    key: 'wilt',
    emoji: '🟣',
    name: 'Wilt Disease',
    color: '#a855f7',
    tagBg: 'bg-purple-100',
    tagText: 'text-purple-700',
    borderColor: 'border-purple-200',
    tips: [
      'There is no effective cure once wilt disease is established. Immediately remove and discard all wilted plants in sealed garbage bags. Do not compost infected plant material as pathogens survive in soil for years.',
      'Apply Mancozeb or Carbendazim as a preventive soil treatment before transplanting. These fungicides help suppress fungal wilt pathogens (Fusarium oxysporum, Verticillium dahliae) in the soil.',
      'Practice crop rotation — avoid planting eggplant or other solanaceous crops (tomato, pepper, potato) in the same field for at least 2 years. Rotate with non-host crops such as corn or sugarcane.',
      'Apply Trichoderma harzianum (a beneficial biological fungicide) as a soil drench at transplanting time. T. harzianum colonizes root tissue, suppresses wilt pathogens, and improves plant immune responses.',
      'Disinfect all farming tools, stakes, and equipment used in infected areas using a bleach solution before using them in other parts of the field to prevent the spread of soilborne pathogens.',
      'Use drip or micro-sprinkler irrigation directed at the root zone. Avoid overwatering or waterlogging which creates favorable conditions for Fusarium and bacterial wilt development.',
      'Consider grafting eggplant onto wilt-resistant rootstocks. Grafted plants have significantly increased resistance to soilborne wilt diseases.',
      'Perform soil solarization (covering moist soil with clear plastic for 4–6 weeks during the hottest months) before planting to reduce soilborne pathogen populations.',
    ],
    source: {
      label: 'Novobac — Fusarium Wilt in Eggplant: Causes and Treatments',
      url: 'https://www.novobac.com/fusarium-wilt-in-eggplant/',
    },
  },
]

function DiseaseImage({ src, alt, bg }) {
  const [errored, setErrored] = React.useState(false)
  return (
    <div
      className={`h-48 bg-gradient-to-br ${bg} relative overflow-hidden flex items-center justify-center`}
    >
      {!errored ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 text-sm font-medium">
          <span className="text-3xl">🍃</span>
          <span>Add {alt} image</span>
        </div>
      )}
    </div>
  )
}

export default function DiseaseGuide() {
  return (
    <div className="page-enter">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-forest-950 to-eggplant-950 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-green-300 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            🔬 Disease Reference Guide
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4">
            Know Your
            <br />
            <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              Eggplant Diseases
            </em>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Learn to identify the 5 conditions TalongGuard detects — from healthy leaves to serious
            fungal and viral diseases.
          </p>
        </div>
      </section>

      {/* ── Disease Cards ──────────────────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 items-stretch">
          {DISEASES.map((d, i) => (
            <div
              key={d.key}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <DiseaseImage src={d.image} alt={d.name} bg={d.bg} />
              <div className="p-4 flex flex-col flex-1">
                <span
                  className={`inline-block text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full mb-2 ${d.tagBg} ${d.tagText}`}
                >
                  ● {d.name}
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-3 line-clamp-3">
                  {d.desc}
                </p>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-auto">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                    Symptoms
                  </p>
                  <div className="flex flex-col gap-1" style={{ minHeight: '185px' }}>
                    {d.symptoms.map((s) => (
                      <div
                        key={s}
                        className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300"
                      >
                        <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: d.color }}>
                          →
                        </span>
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

      {/* ── Prevention Guide ───────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              💊 Treatment & Prevention
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Guide to Prevent the Diseases
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
              Evidence-based recommendations for managing and preventing each disease detected by
              TalongGuard.
            </p>
          </div>

          {/* Disease Prevention List */}
          <div className="flex flex-col gap-8">
            {PREVENTION_GUIDE.map((guide) => (
              <div
                key={guide.key}
                className={`bg-white dark:bg-gray-800 rounded-2xl border ${guide.borderColor} dark:border-gray-700 overflow-hidden shadow-sm`}
              >
                {/* Disease Header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: guide.color }}
                  >
                    {guide.number}
                  </div>
                  <div>
                    <span
                      className={`inline-block text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full ${guide.tagBg} ${guide.tagText}`}
                    >
                      {guide.emoji} {guide.name}
                    </span>
                  </div>
                </div>

                {/* Tips */}
                <div className="px-6 py-5">
                  <ul className="flex flex-col gap-3">
                    {guide.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: guide.color }}
                        >
                          {idx + 1}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {tip}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {/* Source Link */}
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide flex-shrink-0">
                      📖 Source:
                    </span>
                    <a
                      href={guide.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold hover:underline transition-colors"
                      style={{ color: guide.color }}
                    >
                      {guide.source.label} ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-10 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-6 py-4">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <span className="font-bold">⚠️ Disclaimer:</span> The treatment and prevention
              recommendations listed above are based on published agricultural research and
              extension resources. Always consult a licensed agriculturist or your local Department
              of Agriculture extension office before applying any pesticide or fungicide to ensure
              correct dosage, timing, and safety for your specific farm conditions.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
