var gulp = require('gulp');
var gutil = require('gulp-util');
var streamify = require('gulp-streamify');
var autoprefixer = require('gulp-autoprefixer');
var cssmin = require('gulp-cssmin');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');

/*
 |--------------------------------------------------------------------------
 | Combine all JS libraries into a single file for fewer HTTP requests.
 |--------------------------------------------------------------------------
 */
gulp.task('createVendorJS', function() {
  return gulp.src([
    'app/components/jquery/dist/jquery.js',
    'app/components/bootstrap/js/dropdown.js',
    'app/components/d3/d3.js',
    'app/components/queue-async/queue.js',
    'app/components/colorbrewer/colorbrewer.js'
  ]).pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

gulp.task('createMainJS', function() {
  return gulp.src('app/js/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

gulp.task('minifyCSS', function() {
  return gulp.src([
    'app/components/bootstrap/dist/css/bootstrap.css',
    'app/css/*.css'
  ]).pipe(cssmin())
    .pipe(concat('main.css'))
    .pipe(gulp.dest('public/css'));
});

gulp.task('default', ['createMainJS', 'createVendorJS', 'minifyCSS']);
gulp.task('build', ['createMainJS', 'createVendorJS', 'minifyCSS']);
