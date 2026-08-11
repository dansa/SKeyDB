# Database reference behavioral regression harness

Run the clean branch's portable database behavior contract with:

```powershell
npm run test:database:regression
```

This is the acceptance boundary for replacing the current database reference implementation. The stable-ID characterization test protects the collisions and live-state failures reported during the modal rework. The rendered modal, popover, controller, and detail-host tests protect the user-facing interaction seams around it.

## Stable behavior contract

| Behavior | Stable source/reference evidence |
| --- | --- |
| Devour collision | global `overlay.global.devour` remains distinct from `derived.global.devour-card` |
| Daffodil scope and collisions | `derived.daffodil.thousand-mirage`, local Insight and Vulnerable cards, and global `overlay.global.vulnerable` |
| Tawil local card | `derived.tawil.silver-key-dawn` |
| Strength aliases | `overlay.global.str` and `overlay.global.strength` |
| Live E3 projection | `overlay.clementine.psychic-trauma`, base -> E3 -> base |
| Modal behavior | awakener, wheel, relic, recommendation, nested popover, and generic detail-host controls |
| Session lifecycle | modal-local portal ownership, nested close, outside dismissal, and focus restoration |

## Portability rules

- Keep this command and the stable IDs when replacing the runtime. Adapt the implementation behind the existing rendered modal and popover seams.
- Assert logical identity and nonblank presentation independently of mutable English prose.
- Live rank, formula, enlighten, E3, or relic-variant changes must update an open popover without blanking or changing its logical identity.
- A cold or failed load must expose loading, cancellation, failure, retry, and focus restoration. Silent no-op interactions do not satisfy the contract.
- Catalog and resolver unit tests may supplement this suite, but they do not replace the rendered behavioral assertions.

The clean branch intentionally does not retain the abandoned generated binding shards or provider graph. During the producer-owned runtime migration, add rendered exact-reference cases for every stable-ID row before deleting this legacy characterization adapter.
