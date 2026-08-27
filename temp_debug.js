const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  if (line.includes('=')) {
    const [key, ...val] = line.split('=');
    acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  }
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
sb.from('product_images').select('product_id, url, sort_order').then(r => {
  const imgs = (r.data || []).filter(x => x.url.includes('unsplash'));
  console.log('Total images:', (r.data || []).length);
  console.log('Unsplash images:', imgs.length);
  console.log('Base64 images:', (r.data || []).length - imgs.length);
  const pId = '35d918ba-42d0-4fd9-8775-38906c1b282f';
  const pImgs = (r.data || []).filter(x => x.product_id === pId);
  console.log('Wide-leg vest images in DB:', pImgs.length);
});
