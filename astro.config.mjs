import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  build: {
    format: 'file'
  },
  server: {
    port: 9060,
    host: true
  }
});
