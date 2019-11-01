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
    this.app = `./`;
    const vendorsRoot = 'node_modules';

    return {

        app: this.app,
        templates: `root`,
        css: `root/css`,
        sass: `root/sass`,
        fonts: `root/fonts`,
        media: `root/media`,
        js: `root/js`,
    };
}

var paths = pathsConfig();

////////////////////////////////
// Tasks
////////////////////////////////

// Styles autoprefixing and minification
function styles() {
    let processCss = [
        {% if cookiecutter.framework == "TailWind" %}
        require('tailwindcss'),
        {% endif %}
        autoprefixer(), // adds vendor prefixes
        pixrem(),       // add fallback for rem units
    ];

    let minifyCss = [
        cssnano({preset: 'default'})   // minify result
    ];

    return src(`${paths.sass}/**/*.sass`)
        .pipe(sass({
            includePaths: [
                paths.sass
            ]
        }).on('error', sass.logError))
        .pipe(plumber()) // Checks for errors
        .pipe(postcss(processCss))
        .pipe(dest(paths.css))
        .pipe(rename({suffix: '.min'}))
        .pipe(postcss(minifyCss)) // Minifies the result
        .pipe(dest(paths.css))
}

// Javascript minification
function scripts() {
    return src(`${paths.js}/**/*.js`)
        .pipe(plumber()) // Checks for errors
        .pipe(uglify()) // Minifies the js
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(paths.js))
}


// Image compression
function imgCompression() {
    return src(`${paths.media}/*`)
        .pipe(imagemin()) // Compresses PNG, JPEG, GIF and SVG images
        .pipe(dest(paths.media))
}

// Run django server
function runServer(cb) {
    // let post = spawn('startpost', {stdio: 'inherit'});
    console.log("Developer:\t{{ cookiecutter.author }}");
    console.log("Website:\t{{ cookiecutter.website }}");
    initBrowserSync();
}


// Browser sync server for live reload
function initBrowserSync() {
    browserSync.init(
        [
            `${paths.css}/**/*.css`,
            `${paths.js}/**/*.js`,
            `${paths.templates}/**/*.html`
        ], {
            // https://www.browsersync.io/docs/options/#option-proxy
            server: 'root',
            browser: "Google Chrome"
        }
    )

}

// Watch
function watchPaths() {
    watch(`${paths.sass}/**/*.sass`, styles);
    watch(`${paths.templates}/**/*.html`).on("change", reload);
    watch([`!${paths.js}/**/*.min.js`], scripts).on("change", reload)
}

// Generate all assets
const generateAssets = parallel(
    styles,
    scripts,
    imgCompression
);


// Set up dev environment
const dev = parallel(
    runServer,
    watchPaths
);

exports.default = series(generateAssets, dev);
exports["generate"] = generateAssets;
exports["dev"] = dev;
