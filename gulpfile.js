var gulp = require('gulp');

var jsPath = 'node_modules/@ckeditor/ckeditor5-build-classic/build/*';
var destPath = 'lib/ckeditor/build';

gulp.task('ckeditor', function() {
    return gulp.src(jsPath)
        .pipe(gulp.dest(destPath))
    ;
});
