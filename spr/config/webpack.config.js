const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// 加载 .env 文件
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.config({ path: envPath });

// 如果 .env 文件不存在，使用空对象
const envVars = envConfig.error || !envConfig.parsed ? {} : envConfig.parsed;

// 调试：打印加载的���境变量
console.log('========== 环境变量加载 ==========');
console.log('.env 文件路径:', envPath);
if (envConfig.error) {
  console.error('.env 加载失败:', envConfig.error);
}
console.log('环境变量数量:', Object.keys(envVars).length);
console.log('VITE_GEMINI_API_KEY:', envVars.VITE_GEMINI_API_KEY ? '✓ 已设置' : '✗ 未设置');
if (envVars.VITE_GEMINI_API_KEY) {
  console.log('API Key 长度:', envVars.VITE_GEMINI_API_KEY.length);
}
console.log('==================================');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackBar = require('webpackbar');
const {
  BitableAppWebpackPlugin,
  opdevMiddleware
} = require('@lark-opdev/block-bitable-webpack-utils');

const cwd = process.cwd();
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  entry: './src/index.tsx',
  devtool: isProduction ? false : 'inline-source-map',
  mode: isDevelopment ? 'development' : 'production',
  stats: 'errors-only',
  output: {
    path: path.resolve(__dirname, '../dist'),
    clean: true,
    publicPath: isDevelopment ? '/block/' : './',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [/node_modules\/@lark-open/],
        use: ['source-map-loader'],
        enforce: 'pre',
      },
      {
        oneOf: [
          {
            test: /\.[jt]sx?$/,
            include: [path.join(cwd, 'src')],
            exclude: /node_modules/,
            use: [
              {
                loader: require.resolve('esbuild-loader'),
                options: {
                  loader: 'tsx',
                  target: 'es2015',
                },
              },
            ],
          },
          {
            test: /\.css$/,
            use: [
              isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
              'css-loader',
              'postcss-loader',
            ],
          },
          {
            test: /\.less$/,
            use: [
              isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
              'css-loader',
              'less-loader',
            ],
          },
          {
            test: /\.(png|jpg|jpeg|gif|ico|svg)$/,
            type: 'asset/resource',
            generator: {
              filename: 'assets/[name][ext][query]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    ...(isDevelopment
      ? [new ReactRefreshWebpackPlugin(), new WebpackBar()]
      : [new MiniCssExtractPlugin()]),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(envVars.VITE_GEMINI_API_KEY || ''),
      'process.env.VITE_GEMINI_BASE_URL': JSON.stringify(envVars.VITE_GEMINI_BASE_URL || ''),
      'process.env.VITE_SILICONFLOW_API_KEY': JSON.stringify(envVars.VITE_SILICONFLOW_API_KEY || ''),
      'process.env.VITE_SILICONFLOW_BASE_URL': JSON.stringify(envVars.VITE_SILICONFLOW_BASE_URL || ''),
      'process.env.VITE_SILICONFLOW_MODEL': JSON.stringify(envVars.VITE_SILICONFLOW_MODEL || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(envVars.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_API_KEY': JSON.stringify(envVars.VITE_SUPABASE_API_KEY || ''),
      'process.env.VITE_SUPABASE_TABLE_NAME': JSON.stringify(envVars.VITE_SUPABASE_TABLE_NAME || 'blocks_sync'),
      'process.env.VITE_REDIS_REST_URL': JSON.stringify(envVars.VITE_REDIS_REST_URL || ''),
      'process.env.VITE_REDIS_PASSWORD': JSON.stringify(envVars.VITE_REDIS_PASSWORD || ''),
      'process.env.VITE_ENABLE_REDIS': JSON.stringify(envVars.VITE_ENABLE_REDIS || 'false'),
      'process.env.VITE_ATTACHMENT_FIELD_NAME': JSON.stringify(envVars.VITE_ATTACHMENT_FIELD_NAME || '附件'),
    }),
    new BitableAppWebpackPlugin({
      // open: true, // 控制是否自动打开多维表格
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './public/index.html',
      publicPath: isDevelopment ? '/block/' : './',
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      process: require.resolve("process/browser"),
    },
  },
  optimization: {
    minimize: isProduction,
    minimizer: [new ESBuildMinifyPlugin({ target: 'es2015', css: true })],
    moduleIds: 'deterministic',
    runtimeChunk: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
        },
      },
    },
  },
  devServer: isProduction
    ? undefined
    : {
      hot: true,
      client: {
        logging: 'error',
      },
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer || !devServer.app) {
          throw new Error('webpack-dev-server is not defined');
        }
        middlewares.push(opdevMiddleware(devServer))
        return middlewares;
      },
    },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};
module.exports = config;
