const { createClient } = require('@supabase/supabase-js');
const url = 'https://ppdgxwpyjtnsffjkvolf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZGd4d3B5anRuc2Zmamt2b2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzc5OTcsImV4cCI6MjA5MzkxMzk5N30.gWMcI_DSClOrTdb_Ctam72v6zP8xdy_al8OpYxAILUg';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('branches').select('*').limit(1);
  if (error) {
    console.error('Error fetching branches:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample row:', data[0]);
    } else {
      console.log('No branches found in table.');
    }
  }
}
check();
