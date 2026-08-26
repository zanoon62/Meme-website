const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('product_images').select('id, product_id, url');
  if (error) { console.error(error); return; }
  const base64Images = data.filter(img => img.url.startsWith('data:image'));
  console.log('Total images in DB:', data.length);
  console.log('Base64 images to delete:', base64Images.length);
  if (base64Images.length > 0) {
    const idsToDelete = base64Images.map(img => img.id);
    const { error: delError } = await supabase.from('product_images').delete().in('id', idsToDelete);
    if (delError) console.error('Delete error:', delError);
    else console.log('Successfully deleted', idsToDelete.length, 'base64 images.');
  }
}
run();
