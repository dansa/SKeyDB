const LEGACY_PROMOTED_DERIVED_EXTRA_IDS = new Set([
  'derived.castor.onyx-plume',
  'derived.corposant.pilot',
  'derived.doll-inferno.illusions-end',
  'derived.doresain.evernights-revel',
  'derived.helot-catena.bloodthirsty-flail',
  'derived.jenkins.swarm-impact',
  'derived.kathigu-ra.hyperflare',
  'derived.liz.corrupted-flames',
  'derived.lotan-cetarchon.deadly-duel',
  'derived.lotan-cetarchon.great-blade-whalefall',
  'derived.pollux.sacred-heart',
  'derived.tawil.four-wings',
  'derived.tawil.six-wings',
  'derived.tawil.twin-wings',
  'derived.vortice.vortex-shell',
])

export function isLegacyPromotedDerivedExtra(id: string): boolean {
  return LEGACY_PROMOTED_DERIVED_EXTRA_IDS.has(id)
}
