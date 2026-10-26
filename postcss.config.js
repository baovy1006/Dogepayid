import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/**
 * DogeOS SDK ships precompiled CSS using native Cascade Layers: @layer base,
 * @layer components and @layer utilities. Tailwind v3 in this app intercepts
 * those standard names and throws because the vendor file has no @tailwind
 * directives. Namespace ONLY the vendor layer identifiers before running
 * Tailwind, without removing the SDK CSS or editing node_modules.
 *
 * The app's own src/index.css (including @tailwind and @apply) is untouched.
 */
const namespaceDogeOsVendorLayers = {
  postcssPlugin: 'dogepay-namespace-dogeos-vendor-layers',
  Once(root, { result }) {
    const source = String(root.source?.input?.file || result.opts.from || '').replace(/\\/g, '/');
    if (!source.includes('/node_modules/@dogeos/dogeos-sdk/')) return;
    root.walkAtRules('layer', (rule) => {
      rule.params = rule.params.replace(/\b(base|components|utilities)\b/g, 'dogeos-$1');
    });
  },
};

export default {
  plugins: [namespaceDogeOsVendorLayers, tailwindcss(), autoprefixer()],
};
