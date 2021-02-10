const path = require('path');

const CompressionWebpackPlugin = require("compression-webpack-plugin");         // 开启gzip压缩， 按需引用

const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;   // 开启gzip压缩， 按需写入

// 打包分析 图形化打包详情
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const resolve = (dir) => path.join(__dirname, dir);

// 代码打包之后取出console.log压缩代码
const TerserPlugin = require('terser-webpack-plugin');

// 环境判断
const IS_PROD = ['production', 'prod'].includes(process.env.NODE_ENV);

// https://cli.vuejs.org/zh/config/#vue-config-js 可以找到所有配置项
module.exports = {
    // 默认情况下，Vue CLI 会假设你的应用是被部署在一个域名的根路径上，例如 https://foo.github.io/，publicPath:'/'。
    // 也可指定应用被部署在子路径下。例：https://foo.github.io/blog/，则设置 publicPath: '/blog/'。
    // 在开发环境下，如果想把开发服务器架设在根路径，可以使用一个条件式的值
    publicPath: process.env.NODE_ENV === 'production' ? '/production-sub-path/' : '/',
    outputDir: 'dist',      // 输出文件目录; 当运行 vue-cli-service build 时生成的生产环境构建文件的目录
    assetsDir: 'static',    // 放置生成的静态资源
    indexPath: 'index.html',// 相对于打包路径index.html的路径

    // 是否在开发环境下通过 eslint-loader 在每次保存时 lint 代码。这个值会在 @vue/cli-plugin-eslint 被安装之后生效。
    lintOnSave: process.env.NODE_ENV === 'development',

    // 生产环境的 source map，可以设置为 false 以加速生产环境构建。
    productionSourceMap: false,

    pwa: {}, // 向 PWA 插件传递选项。

    // webpack-dev-server 相关配置: https://www.webpackjs.com/configuration/dev-server/#devserver
    devServer: {
        port: process.env.port || process.env.npm_config_port || 7501,  // 设置端口
        open: true,     // 设置自动打开

        // proxy: 'http://localhost:8080'  // 配置跨域处理,只有一个代理
        // proxy: { //配置多个跨域
        //     "/api": {
        //         target: "http://172.11.11.11:7071", // 代理地址，这里设置的地址会代替axios中设置的baseURL
        //         changeOrigin: true,                 // 如果接口跨域，需要进行这个参数配置
        //         // ws: true,//websocket支持
        //         secure: false,                      // false为http访问，true为https访问；默认是http
        //         pathRewrite: {                      // 重写接口
        //             "^/api": "/"
        //         }
        //     },
        //     "/api2": {
        //         target: "http://172.12.12.12:2018",
        //         changeOrigin: true,
        //         //ws: true,//websocket支持
        //         secure: false,
        //         pathRewrite: {
        //             "^/api2": "/"
        //         }
        //     },
        // },

        // 在浏览器中显示了一个全屏覆盖当有编译错误或警告。
        overlay: {
            warnings: false,
            errors: true
        },
    },

    // css配置
    css: {
        // 是否将组件中的 CSS 提取至一个独立的 CSS 文件中,当作为一个库构建时，你也可以将其设置为 false 免得用户自己导入 CSS
        // 默认生产环境下是 true，开发环境下是 false
        extract: false,
        // 是否为 CSS 开启 source map。设置为 true 之后可能会影响构建的性能
        sourceMap: false,
        // 设置为 false 后你就可以去掉文件名中的 .module 并将所有的 *.(css|scss|sass|less|styl(us)?) 文件视为 CSS Modules 模块。
        requireModuleExtension: false,
        //向 CSS 相关的 loader 传递选项(支持 css-loader postcss-loader sass-loader less-loader stylus-loader)
        loaderOptions: {
            css: {},
            less: {
                // `globalVars` 定义全局对象，可加入全局变量
                // globalVars: {
                //     primary: '#333'
                // }
            },
            sass: {
                // 定义全局scss无需引入即可使用
                // prependData:`
                // @import "@/assets/css/variable.scss";
                // @import "@/assets/css/common.scss";
                // `
            }
        }
    },

    // 可以用来传递任何第三方插件选项
    pluginOptions: {},

    // 对内部的 webpack 配置（比如修改、增加Loader选项）(链式操作)
    chainWebpack: config => {
        config.resolve.symlinks(true); // 修复热更新失效

        // 移除prefetch插件，避免加载多余的资源
        config.plugins.delete('prefetch')

        // 定义文件夹的路径
        config.resolve.alias
            .set('@', resolve('src'))
            .set('assets', resolve('src/assets'))
            .set('components', resolve('src/components'))
            .set('router', resolve('src/router'))
            .set('store', resolve('src/store'))
            .set('views', resolve('src/views'))

        // 压缩图片 需要 npm i -D image-webpack-loader
        config.module
            .rule("images")
            .use("image-webpack-loader")
            .loader("image-webpack-loader")
            .options({
                mozjpeg: {progressive: true, quality: 65},
                optipng: {enabled: false},
                pngquant: {quality: [0.65, 0.9], speed: 4},
                gifsicle: {interlaced: false},
                webp: {quality: 75}
            });
    },

    // webpack的配置
    configureWebpack: config => {

        // 生产环境配置
        if (process.env.NODE_ENV === 'production') {
            // 代码压缩去除console.log
            config.plugins.push(
                new TerserPlugin({
                    terserOptions: {
                        ecma: undefined,
                        warnings: false,
                        parse: {},
                        compress: {
                            drop_console: true,
                            drop_debugger: false,
                            pure_funcs: ['console.log'] // 移除console
                        }
                    }
                })
            )
        }


        // 开启 gzip 压缩; 需要 npm i -D compression-webpack-plugin
        const plugins = [];
        if (IS_PROD) {
            plugins.push(
                new CompressionWebpackPlugin({
                    filename: "[path].gz[query]",
                    algorithm: "gzip",
                    test: productionGzipExtensions,
                    threshold: 10240,
                    minRatio: 0.8
                })
            );
        }
        config.plugins = [...config.plugins, ...plugins];


        // 展示打包图形化信息
        config.plugins.push(
            new BundleAnalyzerPlugin()
        )
    },

}

