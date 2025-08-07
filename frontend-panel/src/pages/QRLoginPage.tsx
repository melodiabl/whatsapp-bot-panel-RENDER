import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Image,
  useToast,
  Container,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { whatsappService } from '../services/api'; // Importación asegurada

export function QRLoginPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const fetchQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await whatsappService.getQR();
      // Asumiendo que la respuesta puede tener 'qr' o 'qrCodeImage'
      if (response.qr || response.qrCodeImage) {
        setQrCode(response.qr || response.qrCodeImage);
        setStatus('waiting_for_scan');
      } else {
        setQrCode(null);
        setStatus('disconnected');
      }
    } catch (error) {
      console.error('Error al obtener código QR:', error); // Log para depuración
      toast({
        title: 'Error al obtener código QR',
        description: 'No se pudo conectar con el servidor o generar el QR.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setQrCode(null);
      setStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await whatsappService.getStatus();
      const currentStatus = response.status?.status || response.status;
      setStatus(currentStatus);

      if (currentStatus === 'connected') {
        setQrCode(null); // Limpiar QR si ya está conectado
        toast({
          title: 'WhatsApp conectado',
          description: 'Bot conectado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else if (currentStatus === 'waiting_for_scan' && !qrCode && !isLoading) {
        // Si está esperando escaneo y no hay QR visible, intentar obtenerlo
        fetchQRCode();
      }
    } catch (error) {
      console.error('Error checking status:', error);
      // No mostrar toast aquí para evitar spam si el error es recurrente
    }
  };

  const handleLogout = async () => {
    try {
      await whatsappService.logout();
      setStatus('disconnected');
      setQrCode(null);
      toast({
        title: 'WhatsApp desconectado',
        description: 'Bot desconectado exitosamente',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error al desconectar',
        description: 'No se pudo desconectar el bot',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    // Iniciar la obtención del QR y la verificación de estado
    fetchQRCode();

    // Check status cada 3 segundos
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar
  }, []); // Se ejecuta solo una vez al montar

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'waiting_for_scan': return 'warning';
      case 'disconnected': return 'error';
      default: return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'waiting_for_scan': return 'Esperando escaneo';
      case 'disconnected': return 'Desconectado';
      case 'qr_timeout': return 'QR Expirado'; // Si tu backend maneja este estado
      default: return 'Estado desconocido';
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>Conexión WhatsApp Bot</Heading>

        <Alert status={getStatusColor(status)} width="100%">
          <AlertIcon />
          Estado: {getStatusText(status)}
        </Alert>

        {status === 'connected' ? (
          <VStack spacing={4}>
            <Text fontSize="lg" color="green.500">
              ✅ Bot conectado y funcionando
            </Text>
            <Button colorScheme="red" onClick={handleLogout}>
              Desconectar Bot
            </Button>
          </VStack>
        ) : (
          <Box textAlign="center" width="100%">
            {isLoading ? (
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>Generando código QR...</Text>
              </VStack>
            ) : qrCode ? (
              <VStack spacing={4}>
                <Text fontSize="lg">
                  Escanea este código QR con WhatsApp
                </Text>
                <Box p={4} bg="white" borderRadius="md" boxShadow="md">
                  <Image
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code para WhatsApp"
                    maxW="300px"
                    maxH="300px"
                    objectFit="contain"
                  />
                </Box>
                <VStack spacing={2} mt={4} textAlign="left">
                  <Text fontSize="sm" color="gray.600">
                    1. Abre WhatsApp en tu teléfono
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    2. Ve a **Configuración** (o Ajustes) → **Dispositivos vinculados**
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    3. Toca "**Vincular un dispositivo**"
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    4. Escanea este código QR
                  </Text>
                </VStack>
                <Button onClick={fetchQRCode} colorScheme="blue" mt={4}>
                  Generar nuevo código
                </Button>
              </VStack>
            ) : (
              <VStack spacing={4}>
                <Text>No hay código QR disponible o ha expirado.</Text>
                <Button onClick={fetchQRCode} colorScheme="blue">
                  Generar código QR
                </Button>
              </VStack>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
}

