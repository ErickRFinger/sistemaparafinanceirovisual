import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL não está definido!');
  console.error('⚠️  Configure a variável SUPABASE_URL no Vercel/Arquivo .env');
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY ou SUPABASE_SERVICE_KEY não está definido!');
  console.error('⚠️  Configure a variável SUPABASE_ANON_KEY no Vercel (Settings → Environment Variables)');
}

// Criar cliente apenas se tiver as credenciais, senão null
// Isso evita crash imediato, mas vai dar erro ao tentar usar
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const testConnection = async () => {
  if (!supabase) {
    console.error('❌ Cliente Supabase não inicializado (credenciais faltando)');
    return false;
  }

  try {
    console.log('🔄 Testando conexão com Supabase...');
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Falha na conexão com Supabase:', error.message);
      return false;
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado ao testar conexão:', err.message);
    return false;
  }
};

export default supabase;
