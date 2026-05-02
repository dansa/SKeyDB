# Awakener In-Game ID Map Note

Last updated: 2026-05-02

## Why this exists

- Preserve the public V2 mapping between awakeners and in-game portrait relic asset IDs.
- Document the convention that public V2 relic portrait assets follow `Icon_Creation_Unique_<ingameId>`, while UI linkage uses public `ownerAwakenerId`.

## Current state

- `src/data/public-v2/lite/awakeners.json` stores `ingameId` for mapped awakeners.
- `src/data/public-v2/full/relics.json` portrait entries are keyed by public `ownerAwakenerId` and carry stable generated `assetId` values.
- Portrait relic naming convention in data: `Dimensional Image: <Character>`.

## Key decisions or observations

- IDs follow grouped prefixes:
  - `B##`: Caro
  - `C##`: Chaos
  - `D##`: Ultra
  - `O##`: Aequor
- `Icon_Creation_Unique_Common.png` is treated as placeholder art, not awakener-linked data.
- `D12` maps to `hameln` even though Hameln is a Chaos awakener.
- `D11` maps to `castor` and `D14` maps to `pollux` (confirmed correction).

## Mapping

| ID | Awakener |
|---|---|
| B01 | thais |
| B02 | salvador |
| B03 | aigis |
| B04 | sorel |
| B05 | helot |
| B05EX | helot: catena |
| B06 | agrippa |
| B07 | uvhash |
| B08 | leigh |
| B09 | faint |
| B10 | doresain |
| B12 | pickman |
| B14 | xu |
| C01 | ramona |
| C01EX | ramona: timeworn |
| C02 | doll |
| C02EX | doll: inferno |
| C03 | ogier |
| C04 | lotan |
| C05 | ryker |
| C06 | 24 |
| C07 | nautila |
| C08 | nymphaea |
| C09 | pandia |
| C10 | lily |
| C11 | alva |
| C12 | karen |
| C15 | tawil |
| C16 | kathigu-ra |
| C17 | mouchette |
| D01 | liz |
| D02 | daffodil |
| D03 | tinct |
| D04 | wanda |
| D05 | winkle |
| D06 | horla |
| D07 | jenkins |
| D08 | erica |
| D09 | casiah |
| D11 | castor |
| D12 | hameln |
| D13 | clementine |
| D14 | pollux |
| O01 | tulu |
| O02 | murphy |
| O02EX | murphy: fauxborn |
| O03 | faros |
| O04 | caecus |
| O05 | aurita |
| O06 | goliath |
| O07 | miryam |
| O08 | sanga |
| O09 | celeste |
| O10 | corposant |

## Implications

- Portrait relic rendering can use `awakener.ingameId` as the stable join key.
- Future generic relic support can share the same relic data schema with `kind: "GENERIC"` entries.
- If any ID mappings change, update this note and both data files in the same change.

## Follow-up links

- Roadmap: `docs/roadmap.md`
- Related note: `docs/notes/2026-03-31-awakener-db-v2-data-model.md`
