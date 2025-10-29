import Link from 'next/link';
import { Box, Heading, VStack, Button } from '@chakra-ui/react';

export default function DeudasIndex() {
  return (
    <VStack spacing={6} align="stretch">
      <Heading>Sección Deudas</Heading>
      <Box>
        <Link href="/Deudas/Buscar" legacyBehavior>
          <Button as="a" colorScheme="blue" mr={3}>
            Buscar deudas
          </Button>
        </Link>

        <Link href="/Deudas/ResumenDeTarjeta" legacyBehavior>
          <Button as="a" colorScheme="green">
            Resumen de Tarjeta
          </Button>
        </Link>
      </Box>
    </VStack>
  );
}
