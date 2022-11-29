const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');

gulp.task('override-css', () => {
  return gulp
    .src(`src/assets/field/dist/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'compact',
      }).on('error', sass.logError)
    )
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('src/assets/field/dist'));
});

gulp.task('default', ['override-css']);
