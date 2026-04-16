import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import enlightens from '../src/data/awakeners/awakener-enlightens.json' with {type: 'json'}
import kits from '../src/data/awakeners/awakener-kits.json' with {type: 'json'}
import roster from '../src/data/awakeners/awakener-roster.json' with {type: 'json'}
import skills from '../src/data/awakeners/awakener-skills.json' with {type: 'json'}
import talents from '../src/data/awakeners/awakener-talents.json' with {type: 'json'}
import derivedSkills from '../src/data/awakeners/derived-skills.json' with {type: 'json'}
import {compileAwakenersFullV2} from '../src/domain/awakeners-full-v2-compiler.ts'
import {formatGeneratedJsonFiles} from './format-generated-json.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const outputPath = path.join(
  repoRoot,
  'src',
  'data',
  'awakeners',
  'compiled',
  'awakeners-full.v2.json',
)
const recordsOutputDir = path.join(
  repoRoot,
  'src',
  'data',
  'awakeners',
  'compiled',
  'awakeners-full-v2-records',
)

async function main() {
  const compiled = compileAwakenersFullV2({
    roster,
    kits,
    skills,
    talents,
    enlightens,
    derivedSkills,
  })

  await fs.mkdir(path.dirname(outputPath), {recursive: true})
  await fs.writeFile(outputPath, `${JSON.stringify(compiled, null, 2)}\n`)
  await fs.rm(recordsOutputDir, {recursive: true, force: true})
  await fs.mkdir(recordsOutputDir, {recursive: true})

  const recordOutputPaths = compiled.map((record) =>
    path.join(recordsOutputDir, `${String(record.id)}.json`),
  )

  await Promise.all(
    compiled.map((record, index) =>
      fs.writeFile(recordOutputPaths[index], `${JSON.stringify(record, null, 2)}\n`),
    ),
  )
  await formatGeneratedJsonFiles(repoRoot, [outputPath, recordsOutputDir])

  console.log(`Wrote ${path.relative(repoRoot, outputPath)}`)
  console.log(
    `Wrote ${compiled.length} full V2 records to ${path.relative(repoRoot, recordsOutputDir)}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
