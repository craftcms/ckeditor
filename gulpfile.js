var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');

var ckeditorPath = 'node_modules/@ckeditor';
var libPath = 'lib';
var fieldPath = 'src/assets/field/dist';

gulp.task('ckeditor-classic', function() {
    return gulp.src(ckeditorPath+'/ckeditor5-build-classic/build/*')
        .pipe(gulp.dest(libPath+'/ckeditor/dist'));
});

gulp.task('craft-sass', function() {
    return gulp.src('node_modules/craftcms-sass/src/_mixins.scss')
        .pipe(gulp.dest('lib/craftcms-sass'));
});

gulp.task('field-css', function() {
    return gulp.src(fieldPath+'/css/ckeditor-field.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(fieldPath+'/css'));
});

gulp.task('ckeditor', ['ckeditor-classic']);
gulp.task('field', ['field-css']);
gulp.task('default', ['ckeditor', 'field']);
