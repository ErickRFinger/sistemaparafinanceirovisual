import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload, deleteFile } from '../middleware/upload.js';
import { processReceipt } from '../services/ocr.js';
import supabase from '../database/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Processar nota fiscal/comprovante
router.post('/processar', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imagePath = req.file.path;
    let resultado = null;

    try {
      // Processar OCR
      resultado = await processReceipt(imagePath);

      // Se encontrou valor, criar transação automaticamente
      if (resultado.valor && resultado.valor > 0) {
        // Buscar categoria padrão ou criar uma genérica
        const { data: categorias } = await supabase
          .from('categorias')
          .select('id')
          .eq('user_id', req.user.userId)
          .eq('tipo', resultado.tipo)
          .limit(1);

        const categoriaId = categorias && categorias.length > 0 ? categorias[0].id : null;

        // Criar transação
        const { data: transacao, error: transacaoError } = await supabase
          .from('transacoes')
          .insert([{
            user_id: req.user.userId,
            categoria_id: categoriaId,
            tipo: resultado.tipo,
            descricao: resultado.descricao,
            valor: resultado.valor,
            data: new Date().toISOString().split('T')[0]
          }])
          .select(`
            *,
            categorias (
              nome,
              cor
            )
          `)
          .single();

        if (transacaoError) {
          console.error('Erro ao criar transação:', transacaoError);
        } else {
          resultado.transacaoCriada = {
            id: transacao.id,
            descricao: transacao.descricao,
            valor: transacao.valor,
            tipo: transacao.tipo
          };
        }
      }

      res.json({
        success: true,
        resultado: {
          texto: resultado.texto,
          valor: resultado.valor,
          descricao: resultado.descricao,
          tipo: resultado.tipo,
          confianca: resultado.confianca
        },
        transacao: resultado.transacaoCriada || null,
        mensagem: resultado.valor 
          ? 'Nota fiscal processada e transação criada automaticamente!' 
          : 'Imagem processada, mas não foi possível identificar o valor. Revise os dados.'
      });
    } finally {
      // Limpar arquivo após processamento
      deleteFile(imagePath);
    }
  } catch (error) {
    console.error('Erro ao processar nota fiscal:', error);
    
    // Limpar arquivo em caso de erro
    if (req.file) {
      deleteFile(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Erro ao processar imagem',
      detalhes: error.message 
    });
  }
});

// Apenas processar sem criar transação (para revisão)
router.post('/processar-preview', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imagePath = req.file.path;

    try {
      const resultado = await processReceipt(imagePath);

      res.json({
        success: true,
        resultado: {
          texto: resultado.texto,
          valor: resultado.valor,
          descricao: resultado.descricao,
          tipo: resultado.tipo,
          confianca: resultado.confianca
        }
      });
    } finally {
      deleteFile(imagePath);
    }
  } catch (error) {
    console.error('Erro ao processar preview:', error);
    
    if (req.file) {
      deleteFile(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Erro ao processar imagem',
      detalhes: error.message 
    });
  }
});

export default router;

