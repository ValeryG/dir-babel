#!/usr/bin/env node
import glob from 'glob';
import fs from 'fs';
import path from 'path';

import batchPromises from 'batch-promises';
var babel = require("babel-core");
import mkdirP from 'mkdirp';


var argv = require('yargs')
.usage('Usage: $0 --')
.option('copy-files', {
    alias: 'c',
    describe: 'copy non-babel files'
})
.option('src-dir', {
    alias: 's',
    describe: 'src folder'
})
.option('out-dir', {
    alias: 'o',
    describe: 'output folder'
})
.option('watch', {
    alias: 'w',
    describe: 'watch source files a n rebuild as needed'
})
.help()
.alias('help', 'h')
.example('$0', 'compile')
.argv

const srcRegExp = new RegExp(`^\.\/${argv['src-dir']}\/`);
const babelRegExp = new RegExp(`^\.jsx?$`);

const compileFile = (srcF) => {
    return new Promise((resolve, reject) => {

        const destF = srcF.replace(srcRegExp, `./${argv['out-dir']}/`).replace(/\.jsx$/, '.js');
        const logStr = `${srcF} -> ${destF}`;

        //let's see if we have in dest and it is newer that in src

        const srcStat = fs.existsSync(srcF) && fs.statSync(srcF);
        const destStat = fs.existsSync(destF) ? fs.statSync(destF): {mtime:new Date(-1)};


        if (srcStat.mtime.getTime() < destStat.mtime.getTime()) {
            console.log(`${logStr} ...skip`);
            return resolve({srcF});
        }

        mkdirP.sync(path.dirname(destF));

        if (!/\.jsx?$/.test(srcF)) {
            if (argv['copy-files']) {
                console.log(`${logStr} ...copy`);
                fs.writeFileSync(destF, fs.readFileSync(srcF));
                return resolve({srcF});
            }
            console.log(`${logStr} ...skip`);
            return resolve({srcF});
        }

        babel.transformFile(srcF, {}, (err, res)=> {
            if (err) {
                return reject({srcF, err});
            }
            fs.writeFile(destF, res.code, err=> {
                if (err) {
                    return reject({srcF, err});
                }
                console.log(`${logStr} ...babel`);
                resolve({srcF});
            });
        });

    });
}


const compile = (files) => {
  console.log(files);
    batchPromises(20, files, f => compileFile(f)).then((results) => {
    }).catch((err) => {
        console.log(err);
        process.exit(-1);
    });
}

const getFiles = () =>  (glob.sync(`./${argv['src-dir']}/**/*`, {nodir: true}))

compile(getFiles());

if (argv.watch) {
    console.log('start watching');

    fs.watch(argv['src-dir'], {recursive: true}, (et, fn) => {
        let files =  [];
        console.log("detected:", et, fn);

        switch (et) {
            case "change":
              compile([`./${argv['src-dir']}/${fn}`]);
              break;
            default:
                // in all other cases do full rebuild for now
                compile(getFiles());
                break;
        }
    });

}
