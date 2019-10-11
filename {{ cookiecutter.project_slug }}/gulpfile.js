////////////////////////////////
// Setup
////////////////////////////////

// Gulp and package
const {src, dest, parallel, series, watch} = require('gulp');
const pjson = require('./package.json');

// Plugins
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();

const cssnano = require('cssnano');
const imagemin = require('gulp-imagemin');
const pixrem = require('pixrem');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const reload = browserSync.reload;
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const spawn = require('child_process').spawn;
const uglify = require('gulp-uglify-es').default;
const request = require('request');
const waitOn = require('wait-on');

// Relative paths function
function pathsConfig(appName) {
    this.app = `./source`;
    const vendorsRoot = 'node_modules';

    return {

        app: this.app,
        templates: `${this.app}/templates`,
        css: `${this.app}/static/css`,
        sass: `${this.app}/static/sass`,
        fonts: `${this.app}/static/fonts`,
        images: `${this.app}/static/images`,
        js: `${this.app}/static/js`,
    };
}

var paths = pathsConfig();

////////////////////////////////
// Tasks
////////////////////////////////

// Styles autoprefixing and minification
function styles() {
    let processCss = [
        autoprefixer(), // adds vendor prefixes
        pixrem(),       // add fallback for rem units
    ];

    let minifyCss = [
        cssnano({preset: 'default'})   // minify result
    ];

    return src(`${paths.sass}/project.sass`)
        .pipe(sass({
            includePaths: [
                paths.sass
            ]
        }).on('error', sass.logError))
        .pipe(plumber()) // Checks for errors
        .pipe(postcss(processCss))
        // .pipe(dest(paths.css))
        .pipe(rename({suffix: '.min'}))
        .pipe(postcss(minifyCss)) // Minifies the result
        .pipe(dest(paths.css))
}

// Javascript minification
function scripts() {
    return src(`${paths.js}/project.js`)
        .pipe(plumber()) // Checks for errors
        .pipe(uglify()) // Minifies the js
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(paths.js))
}


// Image compression
function imgCompression() {
    return src(`${paths.images}/*`)
        .pipe(imagemin()) // Compresses PNG, JPEG, GIF and SVG images
        .pipe(dest(paths.images))
}

// Run django server
function runServer(cb) {
    // let post = spawn('startpost', {stdio: 'inherit'});
    let cmd = spawn('pipenv', ['run', 'python', 'manage.py', 'runserver_plus', '0.0.0.0:8000'], {stdio: 'inherit'});
    console.log('\n\n' +
        '  ____            _     _ _               \n' +
        ' / ___|  __ _  __| | __| | | ___  ___     \n' +
        ' \\___ \\ / _` |/ _` |/ _` | |/ _ \\/ __|    \n' +
        '  ___) | (_| | (_| | (_| | |  __/\\__ \\    \n' +
        ' |____/ \\__,_|\\__,_|\\__,_|_|\\___||___/    \n' +
        ' |  _ \\  ___  ___(_) __ _ _ __   ___ _ __ \n' +
        ' | | | |/ _ \\/ __| |/ _` | \'_ \\ / _ \\ \'__|\n' +
        ' | |_| |  __/\\__ \\ | (_| | | | |  __/ |   \n' +
        ' |____/ \\___||___/_|\\__, |_| |_|\\___|_|   \n' +
        '                    |___/                 \n' +
        '\n');
    console.log("Developer:\tAnand Magaji, Rahul Uddhi");
    console.log("Documentation:\thttps://saddlesindia.github.io/Designer/");
    console.log("Website:\thttps://saddlesindia.studio\n");
    cmd.on('close', function (code) {
        console.log('runServer exited with code ' + code);
        cb(code)
    });
}


// Browser sync server for live reload
function initBrowserSync() {
    waitOn(
        {
            resources: [
                'http-get://0.0.0.0:8000/'
            ],
            // delay: 1000, // initial delay in ms, default 0
            interval: 1000, // poll interval in ms, default 250ms
            timeout: 500, // timeout in ms, default Infinity
            tcpTimeout: 1000, // tcp timeout in ms, default 300ms
            // window: 1000, // stabilization time in ms, default 750ms
        }, function (err) {
            if (err) {
            } else {
                browserSync.init(
                    [
                        `${paths.css}/*.css`,
                        `${paths.js}/*.js`,
                        `${paths.templates}/*.html`
                    ], {
                        // https://www.browsersync.io/docs/options/#option-proxy
                        proxy: '0.0.0.0:8000',
                        browser: "Google Chrome"
                    }
                )
            }
        });
}

// Watch
function watchPaths() {
    watch(`${paths.sass}/*.sass`, styles);
    watch(`${paths.templates}/**/*.html`).on("change", reload);
    watch([`!${paths.js}/*.min.js`], scripts).on("change", reload)
}

// Generate all assets
const generateAssets = parallel(
    styles,
    scripts,
    imgCompression
);

function setDB() {
   let cmd = spawn('createdb', ["studio", "-U", "postgres"], {stdio: 'inherit'});
}

// Set up dev environment
const dev = parallel(
    runServer,
    initBrowserSync,
    watchPaths
);

exports.default = series(generateAssets, dev);
exports["generate"] = generateAssets;
exports["dev"] = dev;
exports.setUp = series(setDB);