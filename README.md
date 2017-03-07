# Little script on top of babel to compare src and lib before running babel on needed files



## Install
```
npm install --save-dev dir-babel
```

## usage
add to package.json scripts
```
scripts: {
  ....
  "build": "npm run dir-babel --src-dir=src --out-dir=lib"
  ....
}
```
This will compare all source files in scr-dir and only transpile files that are newer or midding in out-dir

## arguments:

- --src-dir - source folder
- --out-dir - destination folder (folder to put transpiled files to)
- --watch  - run in watch mode
- --copy-files - copy files that are not needed to be transplied (images, styles, e.t.c.). When given, all thoe files will be copied from src-dir for out-dir
- --skip-initial-build - do not do initial build 
