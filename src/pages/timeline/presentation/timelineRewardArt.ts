const assets = import.meta.glob<string>('../../../assets/events/rewards/*.webp', {
  eager: true,
  import: 'default',
})

interface RewardArtDefinition {
  file: string
  preview?: string
  highlight?: boolean
  description?: string
}

const definitions = new Map<string, RewardArtDefinition>([
  ['My Turn: Cosmos Card', {file: 'event-reward-72824.webp', highlight: true}],
  ['Cassie-Stare', {file: 'event-reward-73463.webp', highlight: true}],
  ['Betty-Sob', {file: 'event-reward-73464.webp', highlight: true}],
  ['Ignatiss -My Turn!', {file: 'event-reward-73465.webp', highlight: true}],
  ['Cheers', {file: 'event-reward-73466.webp', highlight: true}],
  ['Bonny-Hmm?', {file: 'event-reward-73467.webp', highlight: true}],
  ['Good Game', {file: 'event-reward-73468.webp', highlight: true}],
  ['Alvis-No Way!', {file: 'event-reward-73469.webp', highlight: true}],
  ['Light-Whoa!', {file: 'event-reward-73471.webp', highlight: true}],
  ['Duran-Aha!', {file: 'event-reward-73472.webp', highlight: true}],
  ['Leah-Me Too?', {file: 'event-reward-73473.webp', highlight: true}],
  ['She and Her Tree Hole', {file: 'event-reward-vivian-wheel.webp', highlight: true}],
  ['By the Silver Key: Vivian', {file: 'event-reward-vivian-avatar.webp', highlight: true}],
  ['Shadowed by the Past', {file: 'shadowed-by-the-past.webp', highlight: true}],
  [
    'By the Silver Key: Ogier: Oathbound',
    {file: 'by-the-silver-key-ogier-oathbound.webp', highlight: true},
  ],
  ['Lone Feather', {file: 'lone-feather.webp', highlight: true}],
  ['By the Silver Key: Castor', {file: 'by-the-silver-key-castor.webp', highlight: true}],
  ['By the Silver Key: Caraboo', {file: 'by-the-silver-key-caraboo.webp', highlight: true}],
  ['Serene Truth', {file: 'serene-truth.webp', highlight: true}],
  ['By the Silver Key: Kathigu-Ra', {file: 'by-the-silver-key-kathigu-ra.webp', highlight: true}],
  ['Impending Sun', {file: 'impending-sun.webp', highlight: true}],
  ['Volleyball "Champion"', {file: 'volleyball-champion.webp', highlight: true}],
  ['By the Silver Key: Horla', {file: 'by-the-silver-key-horla.webp', highlight: true}],
  ['Poetic Bygone Days', {file: 'poetic-bygone-days.webp', highlight: true}],
  ['Til the Snow Melts', {file: 'til-the-snow-melts.webp', highlight: true}],
  [
    'By the Silver Key: Helot: Catena',
    {file: 'by-the-silver-key-helot-catena.webp', highlight: true},
  ],
  ['Undying Hungerbone', {file: 'undying-hungerbone.webp', highlight: true}],
  [
    'By the Silver Key: Lotan: Cetarchon',
    {file: 'by-the-silver-key-lotan-cetarchon.webp', highlight: true},
  ],
  ['Never-Ending Performance', {file: 'never-ending-performance.webp', highlight: true}],
  ['By the Silver Key: Hameln', {file: 'by-the-silver-key-hameln.webp', highlight: true}],
  ['The Errant Compass', {file: 'the-errant-compass.webp', highlight: true}],
  ['By the Silver Key: Pontos', {file: 'by-the-silver-key-pontos.webp', highlight: true}],
  ['By the Silver Key: Arachne', {file: 'by-the-silver-key-arachne.webp', highlight: true}],
  ['Rota Fortunae', {file: 'rota-fortunae.webp', highlight: true}],
  ['Blue Stone Throne', {file: 'blue-stone-throne.webp', highlight: true}],
  ['By the Silver Key: Tulu', {file: 'by-the-silver-key-tulu.webp', highlight: true}],
  ['By the Silver Key: Wanda', {file: 'by-the-silver-key-wanda.webp', highlight: true}],
  ['By the Silver Key: Vortice', {file: 'by-the-silver-key-vortice.webp', highlight: true}],
  ['Imprisoned Madness', {file: 'imprisoned-madness.webp', highlight: true}],
  ['By the Silver Key: Saya', {file: 'by-the-silver-key-saya.webp', highlight: true}],
  ['The Gaze of Isarawu', {file: 'the-gaze-of-isarawu.webp', highlight: true}],
  ['Muddied Fairy Tale', {file: 'muddied-fairy-tale.webp', highlight: true}],
  ['Sprout of Love', {file: 'sprout-of-love.webp', highlight: true}],
  ["The Rose's Psalm (avatar)", {file: 'the-roses-psalm.webp', highlight: true}],
  ['Concerto of Dissonance (avatar)', {file: 'concerto-of-dissonance.webp', highlight: true}],
  ['To the Stars', {file: 'anniversary-to-the-stars-icon.webp', highlight: true}],
  ['Saya', {file: 'anniversary-saya-icon.webp', highlight: true}],
  ['Crimson Kaede', {file: 'crimson-kaede-icon.webp', highlight: true}],
  ['With Spikenard and Myrrh', {file: 'spikenard-and-myrrh-icon.webp', highlight: true}],
  ['Ouvertüre Universell', {file: 'ouverture-universell-icon.webp', highlight: true}],
  ['Candy Snatcher', {file: 'candy-snatcher-icon.webp', highlight: true}],
  ['"Moirae Weaver" avatar', {file: 'conjugated-fates-avatar.webp', highlight: true}],
  ['"Bon Appetite" avatar', {file: 'unfading-memories-avatar.webp', highlight: true}],
  ['"Trickery in Motion" avatar', {file: 'myriad-wishcraft-avatar.webp', highlight: true}],
  ['"Do Not Knock" avatar', {file: 'witchs-nocturnal-operation-avatar.webp', highlight: true}],
  ['Stakes of Wisdom', {file: 'archive-wheel-jp06.webp', highlight: true}],
  ['Private Afternoon', {file: 'archive-wheel-jp12.webp', highlight: true}],
  ['Sakura Reveries', {file: 'archive-wheel-jp07.webp', highlight: true}],
  ['Dreaming of Wonderland', {file: 'archive-wheel-jp08.webp', highlight: true}],
  ['Falling Upward', {file: 'archive-wheel-jp09.webp', highlight: true}],
  ['Soul Synchronization', {file: 'archive-wheel-jp10.webp', highlight: true}],
  ['Darker than Darkness', {file: 'archive-wheel-jp11.webp', highlight: true}],
  ["Imago's Clinic", {file: 'archive-wheel-jp20.webp', highlight: true}],
  [
    'Curriculum Honor selector box',
    {
      file: 'curriculum-honor.webp',
      highlight: true,
      description: 'Choose one: Spring in Yakutsk, Sunfall, Birth of a Soul, or 5 Luminous Cores.',
    },
  ],
  ["Collector's Stamp: Caecus", {file: 'caecus-stamp.webp', highlight: true}],
  ['Unfading Yesterday: Corposant', {file: 'corposant-blocks.webp', highlight: true}],
  [
    'Cuckoo at Seven',
    {file: 'cuckoo-at-seven.webp', highlight: true, description: "Lily's 1☆ skin."},
  ],
  ['Mythag Interlude: Alva', {file: 'alva-interlude.webp', highlight: true}],
  ['Keeper: Majesty', {file: 'keeper-majesty.webp', highlight: true}],
  ['Mouchette: Tornado', {file: 'mouchette-tornado.webp', highlight: true}],
  ['Arachne: The Seer', {file: 'arachne-seer.webp', highlight: true}],
  [
    'Thirsting Brush',
    {
      file: 'thirsting-brush.webp',
      highlight: true,
      description: "SR Wheel available from event achievements and Pickman's Studio.",
    },
  ],
  [
    'By the Silver Key: Pickman',
    {
      file: 'by-the-silver-key-pickman.webp',
      highlight: true,
      description: 'Limited avatar earned through event achievements.',
    },
  ],
  [
    'Next Time It Rains',
    {file: 'next-time-it-rains.webp', preview: 'next-time-it-rains-preview.webp', highlight: true},
  ],
  [
    '"Weight of the Crown" avatar',
    {
      file: 'weight-of-the-crown.webp',
      preview: 'weight-of-the-crown-preview.webp',
      highlight: true,
    },
  ],
  [
    "Formless One's Invitation",
    {
      file: 'formless-ones-invitation.webp',
      description:
        'Collect enough Invitations to choose an unowned avatar or emote from the Formless One’s Gift Card.',
    },
  ],
  ['Thousand Faces Seal', {file: 'event-reward-thousand-faces-seal.webp'}],
  ['Worm Pupa', {file: 'worm-pupa.webp'}],
  ['Shining Crystalfly', {file: 'shining-crystalfly.webp'}],
  ['Spore Polymer', {file: 'spore-polymer.webp'}],
  ['Emotion Replica', {file: 'emotion-replica.webp'}],
  ["Yucatan's Star", {file: 'yucatans-star.webp'}],
  ['Tempered Reason', {file: 'tempered-reason.webp'}],
  ['Gnosis Template', {file: 'gnosis-template.webp'}],
  ['Chaos Crystal', {file: 'chaos-crystal.webp'}],
  ['Pale Files', {file: 'pale-files.webp'}],
  ['Pale Tomes', {file: 'pale-tomes.webp'}],
  ['Uintacrinus', {file: 'uintacrinus.webp'}],
  ['Gnosis Elixir II', {file: 'gnosis-elixir-ii.webp'}],
  ['Psyche Template', {file: 'psyche-template.webp'}],
  ['Sentience Replica', {file: 'sentience-replica.webp'}],
  ['Tempered Spirit', {file: 'tempered-spirit.webp'}],
  ['Meteorite Fragment', {file: 'meteorite-fragment.webp'}],
  ['Tall Sea Lily', {file: 'tall-sea-lily.webp'}],
  ['Ultra Mapping: Astral Reign', {file: 'ultra-mapping-astral-reign.webp'}],
  ['Ultra Prophecy: Astral Reign', {file: 'ultra-prophecy-astral-reign.webp'}],
  ['Caro Birth: Astral Reign', {file: 'caro-birth-astral-reign.webp'}],
  ['Caro Whisper: Astral Reign', {file: 'caro-whisper-astral-reign.webp'}],
  ['Aequor Mystery: Astral Reign', {file: 'aequor-mystery-astral-reign.webp'}],
  ['Aequor Codex: Astral Reign', {file: 'aequor-codex-astral-reign.webp'}],
  ['Chaos Echo: Astral Reign', {file: 'chaos-echo-astral-reign.webp'}],
  ['Chaos Experiment: Astral Reign', {file: 'chaos-experiment-astral-reign.webp'}],
  ['D-Jewel', {file: 'd-jewel.webp'}],
  ['Black Offering', {file: 'black-offering.webp'}],
  ['Gnosis Elixir III', {file: 'gnosis-elixir-iii.webp'}],
  ['Ethereal Core', {file: 'anniversary-ethereal-core-icon.webp'}],
  ['Soul Rewind Core', {file: 'anniversary-soul-rewind-core-icon.webp'}],
  ['Fate Rewind Core', {file: 'anniversary-fate-rewind-core-icon.webp'}],
  ['Gnosis Fragment', {file: 'anniversary-gnosis-fragment-icon.webp'}],
  ['Refined Gnosis Fragment', {file: 'anniversary-refined-gnosis-fragment-icon.webp'}],
  ['Special Potion Supply', {file: 'special-potion-supply.webp'}],
  ['Aetheric Shard', {file: 'aetheric-shard.webp'}],
  ['Aetheric Stone', {file: 'aetheric-stone.webp'}],
  ['Remembrance Quill', {file: 'remembrance-quill.webp'}],
  ['Mimetic Crystal', {file: 'mimetic-crystal.webp'}],
  ['Dreamshard', {file: 'dreamshard.webp'}],
  ['Dreamspark', {file: 'dreamspark.webp'}],
  ['Gnosis Primer', {file: 'gnosis-primer.webp'}],
  ['Refined Gnosis Primer', {file: 'refined-gnosis-primer.webp'}],
  ['Investigation Badge', {file: 'investigation-badge.webp'}],
  ['Luminous Core', {file: 'luminous-core.webp'}],
  ['Prototype Horizon', {file: 'prototype-horizon.webp'}],
  ['Pure Core', {file: 'pure-core.webp'}],
  ['Rose Scrip', {file: 'rose-scrip.webp'}],
  ['Silver', {file: 'silver.webp'}],
  ['Timeloop Copy', {file: 'timeloop-copy.webp'}],
])

function resolve(file: string) {
  const url = assets[`../../../assets/events/rewards/${file}`]
  if (!url) throw new Error(`Missing timeline reward art: ${file}`)
  return url
}

const rewardArt = new Map(
  [...definitions].map(
    ([name, {file, preview, ...rest}]) =>
      [
        name,
        {icon: resolve(file), previewImage: preview ? resolve(preview) : undefined, ...rest},
      ] as const,
  ),
)

export const rewardArtNames = [...rewardArt.keys()]
export function getRewardArt(name: string) {
  return rewardArt.get(name)
}
