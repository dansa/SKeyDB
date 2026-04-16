import {spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function formatGeneratedJsonFiles(repoRoot, filePaths) {
  const normalizedPaths = [...new Set(filePaths.map((filePath) => path.resolve(filePath)))]
  if (normalizedPaths.length === 0) {
    return
  }

  const prettierExecutable = path.join(repoRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs')
  await fs.access(prettierExecutable)

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [prettierExecutable, '--write', ...normalizedPaths], {
      cwd: repoRoot,
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Prettier exited with code ${code ?? 'unknown'}.`))
    })
  })
}
