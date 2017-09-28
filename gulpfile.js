var gulp = require('gulp');

var ckeditorPath = 'node_modules/@ckeditor';
var libPath = 'lib';

gulp.task('ckeditor-classic', function() {
    return gulp.src(ckeditorPath+'/ckeditor5-build-classic/build/*')
        .pipe(gulp.dest(libPath+'/ckeditor/dist'));
});

gulp.task('ckeditor', ['ckeditor-classic']);
gulp.task('default', ['ckeditor']);
