#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const { program } = require('commander');
const pkg = require('../package.json');
//Consts
const pack = 'bare-pack';
const linked = '--linked';
const out = '--out';
const bundle = 'app.bundle.js';
const source = 'bare/main.js';
//Options
const ios = '--target ios';
const iossim = '--target ios --simulator';
const android = '--target android';
const builtin = '--builtins bare/builtins.json';

let flags = [];

console.log('Starting bundle...');

const build = () => {
  const options = program.opts();

  console.log('                     ');
  console.log('---------*----------');
  console.log('------Bundling------');
  console.log('---------*----------');
  console.log('                     ', options);

  if (program.options.releaseIos) {
    flags.push(ios);
  }

  if (options.releaseAndroid) {
    flags.push(android);
  }

  if (options.iosSim == true) {
    flags.push(iossim);
  }

  //TODO add individual arch, simulator options etc.
  if (!options.releaseAndroid && !options.releaseIos && !options.iosSim) {
    throw new Error('No available options set.');
  }

  flags = [...flags, linked, builtin, out, bundle, source];

  console.log('Settings:', flags);

  const bundling = spawnSync(pack, flags, {
    stdio: 'inherit',
    shell: true, //windows
  });

  if (bundling.status) throw new Error('Bundle failed.');
  console.log('Bundle success.');
};

program
  .version(pkg.version)
  .option('-c, --cross', 'build + package for Android/iOS')
  .option('-i, --ios', 'build + package for iOS')
  .option('-s, --ios-sim', 'build + package for iOS simulator')
  .option('-ra, --release-android', 'build + package for Android release')
  .option('-ri, --release-ios', 'build + package for iOS release')
  .option(
    '-a, --android <arch...>',
    'build + package for Android architectures (arm64, arm, x64, ia32)',
  )
  .parseAsync()
  .then(build)
  .catch((err) => {
    console.error(`error: ${err.message}`);
    process.exitCode = 1;
  });
