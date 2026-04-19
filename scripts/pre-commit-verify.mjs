import {execFileSync, execSync} from 'node:child_process'
import process from 'node:process'

const projectRoot = process.cwd()

runScript('data:refresh-awakener-v2')
runNodeScript('scripts/format-changed-files.mjs', ['--quiet', '--fail-on-write'])
runScript('lint')
runScript('test', ['--', '--run'])
runScript('build:quiet')

function runScript(scriptName, extraArgs = []) {
  const command = ['npm', 'run', scriptName, ...extraArgs].join(' ')
  execSync(command, {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}

function runNodeScript(scriptPath, args = []) {
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}
