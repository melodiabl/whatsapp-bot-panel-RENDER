import { db } from './index.js';
import { processWhatsAppMedia } from './file-manager.js';
import { analyzeProviderMessage } from './gemini-ai-handler.js';
import path from 'path';

/**
 * Detectar título de manhwa desde texto del mensaje
 */
function detectManhwaTitle(messageText, filename = '') {
  const knownTitles = [
    'jinx', 'painter of the night', 'killing stalking', 'bj alex',
    'cherry blossoms after winter', 'love is an illusion', 'warehouse',
    'sign', 'pearl boy', 'banana scandal', 'semantic error', 'viewfinder',
    'under the green light', 'define the relationship', 'love shuttle',
    'at the end of the road', 'walk on water', 'royal servant',
    'blood bank', 'ten count', 'given', 'doukyuusei', 'hitorijime my hero'
  ];

  const text = (messageText + ' ' + filename).toLowerCase();

  for (const title of knownTitles) {
    if (text.includes(title.toLowerCase())) {
      return title.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }

  const patterns = [
    /(?:manhwa|manga|webtoon)[\s\-_]*([a-zA-Z\s]+?)[\s\-_]*(?:cap|chapter|ch|episodio|ep)/i,
    /([a-zA-Z\s]+?)[\s\-_]*(?:cap|chapter|ch|episodio|ep)[\s\-_]*\d+/i,
    /([a-zA-Z\s]{3,30})[\s\-_]*(?:extra|special|bonus)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }

  return 'Desconocido';
}

/**
 * Detectar tipo de contenido
 */
function detectContentType(messageText, filename = '') {
  const text = (messageText + ' ' + filename).toLowerCase();

  if (text.match(/(?:cap|chapter|ch|episodio|ep)[\s\-_]*\d+/i)) return 'capítulo';
  if (text.match(/(?:extra|special|bonus|omake|side)/i)) return 'extra';
  if (text.match(/(?:ilustr|art|fanart|cover|portada)/i)) return 'ilustración';
  if (text.match(/(?:pack|bundle|collection|vol|volume)/i)) return 'pack';

  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'ilustración';
  if (['.pdf', '.cbr', '.cbz'].includes(ext)) return 'capítulo';

  return 'desconocido';
}

/**
 * Obtener información del grupo proveedor
 */
async function getProviderInfo(groupJid) {
  try {
    const provider = await db('grupos_autorizados')
      .where({ jid: groupJid, tipo: 'proveedor' })
      .first();
    return provider;
  } catch (error) {
    console.error('Error obteniendo info del proveedor:', error);
    return null;
  }
}

/**
 * Procesar mensaje automáticamente desde grupo proveedor
 */
async function processProviderMessage(message, groupJid, groupName) {
  try {
    const providerInfo = await getProviderInfo(groupJid);
    if (!providerInfo) return null;

    const hasMedia =
      message.message.imageMessage ||
      message.message.videoMessage ||
      message.message.documentMessage ||
      message.message.audioMessage;

    if (!hasMedia) return null;

    const messageText =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      message.message.imageMessage?.caption ||
      message.message.videoMessage?.caption ||
      message.message.documentMessage?.caption || '';

    const filename =
      message.message.documentMessage?.fileName ||
      message.message.documentMessage?.title || '';

    console.log(`🤖 Procesando con IA: "${messageText}" | Archivo: "${filename}"`);
    const aiAnalysis = await analyzeProviderMessage(
      messageText,
      filename,
      providerInfo.nombre || groupName
    );

    const mediaResult = await processWhatsAppMedia(
      message,
      aiAnalysis.tipo,
      'auto_provider'
    );

    if (!mediaResult.success) {
      throw new Error('Error procesando media: ' + mediaResult.message);
    }

    const fecha = new Date().toISOString();
    const aporteData = {
      contenido: aiAnalysis.descripcion,
      tipo: 'proveedor_auto',
      usuario: 'sistema_auto',
      grupo: groupJid,
      fecha,
      archivo_path: mediaResult.filepath,
      archivo_size: mediaResult.size,
      proveedor: providerInfo.nombre || groupName,
      manhwa_titulo: aiAnalysis.titulo,
      contenido_tipo: aiAnalysis.tipo,
      mensaje_original: JSON.stringify({
        messageText,
        filename,
        mediaType: mediaResult.mediaType,
        originalMessage: {
          id: message.key.id,
          timestamp: message.messageTimestamp
        }
      })
    };

    await db('aportes').insert(aporteData);
    await logProviderActivity('auto_procesado', aiAnalysis.descripcion, groupJid, providerInfo.nombre);

    console.log(`✅ Aporte automático procesado: ${aiAnalysis.descripcion} desde ${providerInfo.nombre}`);
    return { success: true, ...mediaResult, ...aiAnalysis, provider: providerInfo.nombre };
  } catch (error) {
    console.error('Error procesando mensaje de proveedor:', error);
    await logProviderActivity('error', error.message, groupJid, groupName);
    return { success: false, error: error.message };
  }
}

/**
 * Registrar actividad en logs
 */
async function logProviderActivity(tipo, descripcion, groupJid, providerName) {
  try {
    const fecha = new Date().toISOString();
    await db('logs').insert({
      tipo: 'proveedor',
      comando: tipo,
      usuario: 'sistema_auto',
      grupo: groupJid,
      fecha,
      detalles: JSON.stringify({
        descripcion,
        proveedor: providerName,
        timestamp: fecha
      })
    });
  } catch (error) {
    console.error('Error registrando log de proveedor:', error);
  }
}

/**
 * Obtener estadísticas
 */
async function getProviderStats() {
  try {
    const detallado = await db('aportes')
      .select(
        'proveedor',
        'manhwa_titulo',
        'contenido_tipo'
      )
      .count('id as total')
      .sum('archivo_size as total_size')
      .max('fecha as ultimo_aporte')
      .where('tipo', 'proveedor_auto')
      .groupBy('proveedor', 'manhwa_titulo', 'contenido_tipo');

    const resumen = await db('aportes')
      .select('proveedor')
      .count('id as total_aportes')
      .sum('archivo_size as espacio_usado')
      .countDistinct('manhwa_titulo as manhwas_diferentes')
      .where('tipo', 'proveedor_auto')
      .groupBy('proveedor');

    return { detallado, resumen };
  } catch (error) {
    console.error('Error obteniendo estadísticas de proveedores:', error);
    return { detallado: [], resumen: [] };
  }
}

/**
 * Obtener aportes
 */
async function getProviderAportes(filtros = {}) {
  try {
    let query = db('aportes')
      .select(
        'id',
        'contenido',
        'manhwa_titulo',
        'contenido_tipo',
        'proveedor',
        'archivo_path',
        'archivo_size',
        'fecha',
        'mensaje_original',
        'grupo'
      )
      .where('tipo', 'proveedor_auto');

    if (filtros.proveedor) query.andWhere('proveedor', filtros.proveedor);
    if (filtros.manhwa) query.andWhere('manhwa_titulo', 'like', `%${filtros.manhwa}%`);
    if (filtros.tipo) query.andWhere('contenido_tipo', filtros.tipo);
    if (filtros.fecha_desde) query.andWhere('fecha', '>=', filtros.fecha_desde);
    if (filtros.fecha_hasta) query.andWhere('fecha', '<=', filtros.fecha_hasta);
    query.orderBy('fecha', 'desc').limit(filtros.limit || 100);

    const aportes = await query;

    return aportes.map(aporte => ({
      id: aporte.id,
      titulo: aporte.manhwa_titulo,
      tipo: aporte.contenido_tipo,
      proveedor: aporte.proveedor,
      archivo: {
        path: aporte.archivo_path,
        size: aporte.archivo_size,
        nombre: path.basename(aporte.archivo_path)
      },
      fecha: aporte.fecha,
      descripcion: aporte.contenido,
      metadata: aporte.mensaje_original ? JSON.parse(aporte.mensaje_original) : {}
    }));
  } catch (error) {
    console.error('Error obteniendo aportes de proveedores:', error);
    return [];
  }
}

/**
 * Limpiar títulos
 */
async function cleanupManhwaTitles() {
  try {
    const titles = await db('aportes')
      .select('manhwa_titulo')
      .count('id as count')
      .whereNot('manhwa_titulo', 'Desconocido')
      .andWhere('tipo', 'proveedor_auto')
      .groupBy('manhwa_titulo')
      .orderBy('count', 'desc');

    console.log('📊 Títulos de manhwa detectados:');
    titles.forEach(title => console.log(`  - ${title.manhwa_titulo}: ${title.count} aportes`));

    return titles;
  } catch (error) {
    console.error('Error limpiando títulos:', error);
    return [];
  }
}

export {
  processProviderMessage,
  getProviderStats,
  getProviderAportes,
  cleanupManhwaTitles,
  detectManhwaTitle,
  detectContentType
};
