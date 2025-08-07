import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  HStack,
  IconButton,
  useToast, // Añadido
  Select,
  Text,
  Spinner, // Añadido para el loading
  Alert, // Añadido para el error
  AlertIcon, // Añadido para el error
} from '@chakra-ui/react'; // Importaciones de Chakra UI
import { api } from '../services/api'; // Importación añadida

interface ProviderAporte {
  id: number;
  titulo: string;
  tipo: string;
  proveedor: string;
  archivo: {
    path: string;
    size: number;
    nombre: string;
  };
  fecha: string;
  descripcion: string;
  metadata: any; // Se mantiene 'any' si la estructura es muy variable
}

interface ProviderStats {
  detallado: Array<{
    proveedor: string;
    manhwa_titulo: string;
    contenido_tipo: string;
    total: number;
    total_size: number;
    ultimo_aporte: string;
  }>;
  resumen: Array<{
    proveedor: string;
    total_aportes: number;
    espacio_usado: number;
    manhwas_diferentes: number;
  }>;
}

const ProveedoresPage: React.FC = () => {
  const [aportes, setAportes] = useState<ProviderAporte[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast(); // Inicialización del toast

  // Filtros
  const [filtros, setFiltros] = useState({
    proveedor: '',
    manhwa: '',
    tipo: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  // Estados de UI
  const [showStats, setShowStats] = useState(false);
  const [selectedAporte, setSelectedAporte] = useState<ProviderAporte | null>(null);
  const { isOpen: detailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure(); // Uso de useDisclosure para el modal de detalles

  // Cargar datos iniciales
  useEffect(() => {
    loadAportes();
    loadStats();
  }, []);

  // Cargar aportes con filtros
  const loadAportes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get<ProviderAporte[]>(`/proveedores/aportes?${queryParams.toString()}`); // Uso de api.get
      setAportes(response.data);
      setError(null);
    } catch (err: any) { // Tipado de error
      setError(err.message || 'Error desconocido al cargar aportes');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los aportes de proveedores.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await api.get<ProviderStats>('/proveedores/estadisticas'); // Uso de api.get
      setStats(response.data);
    } catch (err: any) { // Tipado de error
      console.error('Error cargando estadísticas:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas de proveedores.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Aplicar filtros
  const handleFilterChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadAportes();
  };

  const clearFilters = () => {
    setFiltros({
      proveedor: '',
      manhwa: '',
      tipo: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    setTimeout(loadAportes, 100);
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color del chip según el tipo
  const getTypeColor = (tipo: string) => {
    const colors: { [key: string]: string } = {
      'capítulo': '#1976d2',
      'extra': '#9c27b0',
      'ilustración': '#2e7d32',
      'pack': '#ed6c02',
      'desconocido': '#d32f2f'
    };
    return colors[tipo] || '#666';
  };

  // Ver detalles del aporte
  const viewDetails = (aporte: ProviderAporte) => {
    setSelectedAporte(aporte);
    onDetailsOpen(); // Abre el modal de detalles
  };

  // Descargar archivo
  const downloadFile = async (aporte: ProviderAporte) => {
    try {
      // Usar Axios para la descarga, configurando responseType a 'blob'
      const response = await api.get(`/proveedores/download/${aporte.id}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = aporte.archivo.nombre;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Descarga iniciada',
        description: `Descargando ${aporte.archivo.nombre}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) { // Tipado de error
      console.error('Error descargando archivo:', err);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el archivo.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading && aportes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
        <Text ml={4}>Cargando...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          📁 Contenido de Proveedores
        </Text>
        <HStack>
          <Button
            onClick={() => setShowStats(!showStats)}
            variant="outline"
          >
            📊 {showStats ? 'Ocultar' : 'Ver'} Estadísticas
          </Button>
          <Button
            onClick={() => { loadAportes(); loadStats(); }}
            colorScheme="blue"
          >
            🔄 Actualizar
          </Button>
        </HStack>
      </HStack>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {showStats && stats && (
        <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
          <Text fontSize="xl" fontWeight="bold" mb={4}>📊 Estadísticas de Proveedores</Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}> {/* Usar SimpleGrid de Chakra */}
            {stats.resumen.map((proveedor, index) => (
              <Box key={index} p={4} borderWidth="1px" borderRadius="md" bg="white">
                <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={2}>{proveedor.proveedor}</Text>
                <Text fontSize="sm" color="gray.600">
                  📄 {proveedor.total_aportes} aportes
                </Text>
                <Text fontSize="sm" color="gray.600">
                  💾 {formatFileSize(proveedor.espacio_usado)}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  📚 {proveedor.manhwas_diferentes} manhwas diferentes
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Filtros */}
      <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
        <Text fontSize="xl" fontWeight="bold" mb={4}>🔍 Filtros</Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={4} alignItems="end">
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Título Manhwa:</FormLabel>
            <Input
              type="text"
              value={filtros.manhwa}
              onChange={(e) => handleFilterChange('manhwa', e.target.value)}
              placeholder="Título del manhwa"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Proveedor:</FormLabel>
            <Select
              value={filtros.proveedor}
              onChange={(e) => handleFilterChange('proveedor', e.target.value)}
            >
              <option value="">Todos</option>
              {stats?.resumen.map((p) => (
                <option key={p.proveedor} value={p.proveedor}>
                  {p.proveedor}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Tipo:</FormLabel>
            <Select
              value={filtros.tipo}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="capítulo">Capítulo</option>
              <option value="extra">Extra</option>
              <option value="ilustración">Ilustración</option>
              <option value="pack">Pack</option>
              <option value="desconocido">Desconocido</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Desde:</FormLabel>
            <Input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Hasta:</FormLabel>
            <Input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
            />
          </FormControl>
          <HStack spacing={2}>
            <Button colorScheme="blue" onClick={applyFilters} flex={1}>
              Filtrar
            </Button>
            <Button variant="outline" onClick={clearFilters} flex={1}>
              Limpiar
            </Button>
          </HStack>
        </SimpleGrid>
      </Box>

      {/* Tabla de aportes */}
      <Box borderWidth="1px" borderRadius="lg" bg="white">
        <Box p={4} borderBottom="1px" borderColor="gray.200">
          <Text fontSize="xl" fontWeight="bold">📋 Aportes Automáticos ({aportes.length})</Text>
        </Box>

        {aportes.length === 0 ? (
          <Box p={8} textAlign="center" color="gray.500">
            ℹ️ No se encontraron aportes con los filtros aplicados.
          </Box>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Título del Manhwa</Th>
                <Th>Tipo</Th>
                <Th>Proveedor</Th>
                <Th>Archivo</Th>
                <Th>Tamaño</Th>
                <Th>Fecha</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {aportes.map((aporte) => (
                <Tr key={aporte.id}>
                  <Td fontWeight="bold">
                    {aporte.titulo}
                  </Td>
                  <Td>
                    <Badge
                      px={2} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" color="white"
                      bg={getTypeColor(aporte.tipo)}
                    >
                      {aporte.tipo}
                    </Badge>
                  </Td>
                  <Td color="blue.600" fontWeight="bold">
                    {aporte.proveedor}
                  </Td>
                  <Td>
                    📄 {aporte.archivo.nombre}
                  </Td>
                  <Td>
                    {formatFileSize(aporte.archivo.size)}
                  </Td>
                  <Td>
                    {formatDate(aporte.fecha)}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Ver detalles"
                        icon={<Text>👁️</Text>}
                        size="sm"
                        onClick={() => viewDetails(aporte)}
                        title="Ver detalles"
                      />
                      <IconButton
                        aria-label="Descargar archivo"
                        icon={<Text>📥</Text>}
                        size="sm"
                        onClick={() => downloadFile(aporte)}
                        title="Descargar archivo"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* Modal de detalles */}
      <Modal isOpen={detailsOpen} onClose={onDetailsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>📋 Detalles del Aporte</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAporte && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Título del Manhwa:</Text>
                    <Text>{selectedAporte.titulo}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Tipo de Contenido:</Text>
                    <Badge
                      px={2} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" color="white"
                      bg={getTypeColor(selectedAporte.tipo)}
                    >
                      {selectedAporte.tipo}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Proveedor:</Text>
                    <Text>{selectedAporte.proveedor}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Fecha de Procesamiento:</Text>
                    <Text>{formatDate(selectedAporte.fecha)}</Text>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text fontWeight="bold">Descripción:</Text>
                  <Text>{selectedAporte.descripcion}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Información del Archivo:</Text>
                  <Box p={3} bg="gray.100" borderRadius="md" mt={2}>
                    <Text>📄 <Text as="strong">Nombre:</Text> {selectedAporte.archivo.nombre}</Text>
                    <Text>📊 <Text as="strong">Tamaño:</Text> {formatFileSize(selectedAporte.archivo.size)}</Text>
                    <Text>📁 <Text as="strong">Ruta:</Text> {selectedAporte.archivo.path}</Text>
                  </Box>
                </Box>

                {selectedAporte.metadata && Object.keys(selectedAporte.metadata).length > 0 && (
                  <Box>
                    <Text fontWeight="bold">Metadatos Adicionales:</Text>
                    <Box as="pre" p={3} bg="gray.100" borderRadius="md" fontSize="sm" overflow="auto" mt={2}>
                      {JSON.stringify(selectedAporte.metadata, null, 2)}
                    </Box>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={() => downloadFile(selectedAporte!)}> {/* ! para asegurar que no es null */}
              📥 Descargar Archivo
            </Button>
            <Button variant="ghost" ml={3} onClick={onDetailsClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProveedoresPage;

