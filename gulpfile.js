/**
 * @author: point
 * @time: 16/06/2018
 */

'use strict'

/* 任务：
 * LESS 编译 压缩 合并
 * JS 合并 压缩混淆
 * HTML 压缩
 * img 复制
 * 静态资源复制
 */

let gulp = require('gulp')
let less = require('gulp-less')
let cssnano = require('gulp-cssnano')
let concat = require('gulp-concat')
let uglify = require('gulp-uglify')
let htmlmin = require('gulp-htmlmin')
let browserSync = require('browser-sync')

//  字体图标复制
gulp.task('fonts', () => {
  gulp
    .src('src/fonts/*.*')
    .pipe(gulp.dest('dist/fonts'))
    .pipe(browserSync.reload({stream:true}))
})

// LESS 编译 压缩 // 合并没有必要，一般预处理 CSS 都可以导包
gulp.task('css', () => {
  gulp
    .src(['src/css/*.less', '!src/css/_*.less', 'src/css/*.css'])
    .pipe(less()) // LESS 编译
    // .pipe(cssnano()) // CSS 压缩
    .pipe(gulp.dest('dist/css')) // 输出到目标文件
    .pipe(browserSync.reload({stream:true})) // 刷新浏览器
})

// JS 合并 压缩混淆
gulp.task('js', () => {
  gulp
    .src('src/js/*.js')
    // .pipe(concat('all.js')) // JS 合并
    // .pipe(uglify()) // 压缩混淆
    .pipe(gulp.dest('dist/js'))
    .pipe(browserSync.reload({stream:true}))
})

// 图片复制
gulp.task('img', () => {
  gulp
    .src('src/images/*.*')
    .pipe(gulp.dest('dist/images'))
    .pipe(browserSync.reload({stream:true}))
})

// 静态资源复制
gulp.task('lib', () => {
  gulp
    .src('src/lib/**/*')
    .pipe(gulp.dest('dist/lib'))
    .pipe(browserSync.reload({stream:true}))
})

// 网站图标复制
gulp.task('icon', () => {
  gulp
    .src('src/favicon.ico')
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.reload({stream:true}))
})

// HTML 压缩
gulp.task('html', () => {
  gulp
    .src('src/*.html')
    .pipe(htmlmin({ // HTML 压缩
      // collapseWhitespace: true, // 移出空格
      // removeComments: true, // 移出注释
      // removeAttributeQuotes: true, // 移出属性的引号
      // collapseBooleanAttributes: true,
      // removeEmptyAttributes: true, // 移出空属性
      // removeScriptTypeAttributes: true, // 移出脚本类型属性
      // removeStyleLinkTypeAttributes: true, // 移出样式类型属性
    }))
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.reload({stream:true}))
})

// 执行上述任务，并启动一个静态服务器
gulp.task('serve', ['fonts', 'css', 'js', 'img', 'lib', 'icon', 'html'], () => {
  browserSync({
    notify: false, // 浏览器刷新时不通知
    port: 2018,
    server: {
      baseDir: ['dist'] // 默认启动目录
    }
  })

  // 监视文件变化，如果有文件发生变化，则执行相应任务
  gulp.watch('src/css/*.css',['css'])
  gulp.watch('src/css/*.less',['css'])
  gulp.watch('src/js/*.js',['js'])
  gulp.watch('src/fonts/*.*',['fonts'])
  gulp.watch('src/images/*.*',['img'])
  gulp.watch('src/lib/**/*',['lib'])
  gulp.watch('src/*.html',['html'])
})




