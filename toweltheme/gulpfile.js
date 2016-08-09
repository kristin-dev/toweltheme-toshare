/**
 * Type "gulp" on the command line to watch file changes.
 */
'use strict';
var $ = require('gulp-load-plugins')();
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var drupalBreakpoints = require('drupal-breakpoints-scss');
var gulp = require('gulp');
var importer = require('node-sass-globbing');
var insert = require('gulp-insert');
var kss = require('kss');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var stripCssComments = require('gulp-strip-css-comments');
var uglify = require('gulp-uglify');
var uncss = require('gulp-uncss');
var rename = require('gulp-rename');
var sassLint = require('gulp-sass-lint');

var paths = {
  rootPath: {
    project: __dirname + '/',
    styleGuide: __dirname + '/styleguide/',
    theme: __dirname + '/'
  },
  theme: {
    root: __dirname + '/',
    css: __dirname + '/' + 'css/',
    sass: __dirname + '/' + 'scss/',
    js: __dirname + '/' + 'js/',
    node_modules: __dirname + '/node_modules/'
  }
};

var options = {
  autoprefixer: {
    browsers: ['> 1%']
  },
  concat: {
    files: [
      paths.theme.js + 'custom/**/*.js',
      paths.theme.node_modules + 'enquire.js/dist/enquire.min.js',
      paths.theme.node_modules + 'jquery-match-height/jquery.matchHeight-min.js'
    ]
  },
  eslint: {
    files: [
      paths.theme.js + 'custom/**/*.js'
    ]
  },
  sass: {
    importer: importer,
    includePaths: [
      'node_modules/breakpoint-sass/stylesheets/',
      'node_modules/susy/sass/',
      'node_modules/modularscale-sass/stylesheets',
      'node_modules/compass-mixins/lib/'
    ]
  },
  scssLint: {
    // maxBuffer default is 300 * 1024
    'maxBuffer': 1000 * 1024,
    rules: {
      'class-name-format': 0,
      'empty-args': 0,
      'empty-line-between-blocks': 0,
      'force-element-nesting': 0,
      'nesting-depth': 0,
      'no-vendor-prefixes': 0,
      'property-sort-order': 0
    },
    'config': paths.rootPath.project + '.scss-lint.yml'
  },
  styleguide: {
    source: [
      paths.theme.sass + 'components/',
      paths.theme.css + 'style-guide/'
    ],
    destination: paths.rootPath.styleGuide,

    // The css and js paths are URLs, like '/misc/jquery.js'.
    // The following paths are relative to the generated style guide.
    css: [
      path.relative(paths.rootPath.styleGuide, paths.theme.css + 'style.css'),
      path.relative(paths.rootPath.styleGuide, paths.theme.css + 'style-guide/chroma-kss-styles.css'),
      path.relative(paths.rootPath.styleGuide, paths.theme.css + 'style-guide/kss-only.css')
    ],
    js: [],

    homepage: 'homepage.md',
    builder: paths.rootPath.styleGuide + 'custom-builder',
    title: ''
  },
  uglify: {
    compress: {
      unused: false
    }
  }

};

// JS tasks.
gulp.task('js-watch', function() {
  gulp.src(options.eslint.files)
    .pipe($.eslint())
    .pipe($.eslint.format());
  gulp.src(options.concat.files)
    .pipe(concat('script.js'))
    .pipe(gulp.dest('js_min'))
    .pipe(uglify(options.uglify))
    .pipe(gulp.dest('js_min'));
});

// Sass tasks.
gulp.task('breakpoints-watch', function () {
  gulp.src(paths.rootPath.theme + 'toweltheme.breakpoints.yml')
    .pipe(drupalBreakpoints.ymlToScss())
    .pipe(rename('_breakpoints-auto-generated.scss'))
    .pipe(insert.prepend('// Warning: This file is automatically generated. Do not modify it directly.\n// Instead, run Gulp and modify toweltheme.breakpoints.yml to regenerate the file.\n// See gulpfile.js in this theme for more details.\n'))
    .pipe(gulp.dest(paths.theme.sass))
});

gulp.task('sass-watch', function() {
  gulp.src(paths.theme.sass + 'components/**/*.scss')
    .pipe(sassLint(options.scssLint))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
  gulp.src(paths.theme.sass + '**/*.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass(options.sass).on('error', sass.logError))
    .pipe(autoprefixer(options.autoprefixer))
    .pipe(stripCssComments({preserve: false}))
    .pipe(gulp.dest('./css'));
    // .pipe(gulp.dest('./css'))
    // .pipe(cssmin())
    // .pipe(gulp.dest('./css'));
});

gulp.task('styleguide-watch', function(files) {
  return kss(options.styleguide, files);
});

gulp.task('default', function() {
  livereload.listen();
  gulp.watch(paths.rootPath.theme + 'toweltheme.breakpoints.yml', ['breakpoints-watch', 'sass-watch', 'styleguide-watch']);
  gulp.watch('./scss/**/*.scss', ['sass-watch', 'styleguide-watch']);
  gulp.watch('./scss/**/*.hbs', ['styleguide-watch']);
  gulp.watch('./js/**/*.js', ['js-watch']);
  gulp.watch(['./css/style.css', './**/*.twig', './js_min/*.js'], function(files) {
    livereload.changed(files)
  });
});