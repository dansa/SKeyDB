import {execFileSync} from 'node:child_process'
import process from 'node:process'

const projectRoot = process.cwd()

runNodeScript('scripts/format-changed-files.mjs', ['--staged', '--quiet', '--fail-on-write'])
runScript('lint')
runScript('test:bounded')
runScript('test:scripts')
runScript('build:quiet')

function runScript(scriptName, extraArgs = []) {
  const npmExecPath = process.env.npm_execpath
  const {args, command} = npmExecPath
    ? {command: process.execPath, args: [npmExecPath, 'run', scriptName, ...extraArgs]}
    : getNpmInvocation(scriptName, extraArgs)

  execFileSync(command, args, {
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

function getNpmInvocation(scriptName, extraArgs) {
  if (process.platform !== 'win32') {
    return {command: 'npm', args: ['run', scriptName, ...extraArgs]}
  }

  return {
    command: process.env.ComSpec ?? 'cmd.exe',
    args: ['/d', '/s', '/c', 'npm', 'run', scriptName, ...extraArgs],
  }
}
