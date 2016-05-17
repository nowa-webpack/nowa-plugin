/*
* @Author: gbk <ck0123456@gmail.com>
* @Date:   2016-04-21 17:34:00
* @Last Modified by:   gbk
* @Last Modified time: 2016-05-17 22:54:58
*/

'use strict';

var path = require('path');
var fs = require('fs');
var gitConfig = require('git-config');
var inquirer = require('inquirer');
var glob = require('glob');
var ejs = require('ejs');
var mkdirp = require('mkdirp');

var pkg = require('../package.json');

// plugin defination
module.exports = {

  command: 'plugin <name>',

  description: pkg.description,

  action: function(name) {

    console.log('\nWelcome to nowa plugin generator!\n');

    // interaction
    var config = gitConfig.sync('.git/config') || {};
    inquirer.prompt([{
      name: 'name',
      message: 'Plugin name(command name)',
      default: name.replace(/^nowa\-/, ''),
      validate: function(name) {
        return /^\w[\w\-]*\w$/.test(name) ? true : 'name is not valid';
      }
    }, {
      name: 'description',
      message: 'Plugin description',
      default: 'An awesome nowa plugin'
    }, {
      name: 'author',
      message: 'Author name',
      default: process.env['USER'] || process.env['USERNAME'] || ''
    }, {
      name: 'version',
      message: 'Plugin version',
      default: '1.0.0',
      validate: function(version) {
        return /^\d+\.\d+\.\d+([\.\-\w])*$/.test(version) ? true : 'version is not valid';
      }
    }, {
      name: 'repository',
      message: 'Plugin repository',
      default: (config['remote "origin"'] || {}).url || ''
    }, {
      name: 'homepage',
      message: 'Plugin homepage'
    }]).then(makeFiles);
  }
};

// make files
function makeFiles(data) {
  console.log('\nStart to copy files ...\n');
  var prompts = [];

  // traverse all template files
  var templateDir = path.join(__dirname, 'templates');
  glob.sync('**', {
    cwd: templateDir,
    nodir: true
  }).forEach(function(source) {

    // real target file
    var target = source.replace(/^_/, '.');

    // ensure target dir exists
    if (target.indexOf(path.sep) !== -1) {
      mkdirp.sync(path.dirname(target));
    }

    // real source file
    source = path.join(templateDir, source);

    try {

      // file exists, push to confirm list
      fs.statSync(target);
      prompts.push({
        type: 'confirm',
        name: source + ',' + target,
        message: 'Override ' + target + ' ?'
      });

    } catch (e) {

      // file not exist, just write
      writeFile(source, target, data);
    }
  });

  if (prompts.length) {

    // blank line
    console.log('');

    // confirm override files
    inquirer.prompt(prompts).then(function(answers) {

      // blank line
      console.log('');

      // write confirmed files
      for (var k in answers) {
        if (answers[k]) {
          var p = k.split(',');
          writeFile(p[0], p[1], data);
        }
      }
    });
  }
}

// write file by tpl
function writeFile(source, target, data) {
  console.log('Generate file ' + target);
  var tpl = fs.readFileSync(source, 'utf-8');
  fs.writeFileSync(target, ejs.render(tpl, data));
}
