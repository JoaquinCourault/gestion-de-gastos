import { Box, Container, Flex, Link, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="blue.600" color="white" mb={8} py={4} shadow="base">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <NextLink href="/" passHref>
              <Link fontSize="xl" fontWeight="bold">
                Gestor de Deudas y Gastos
              </Link>
            </NextLink>
            <Flex gap={4}>
              <NextLink href="/" passHref>
                <Link>Dashboard</Link>
              </NextLink>
              <NextLink href="/Deudas" passHref>
                <Link>Deudas</Link>
              </NextLink>
              <NextLink href="/Gastos" passHref>
                <Link>Gastos</Link>
              </NextLink>
            </Flex>
          </Flex>
        </Container>
      </Box>
      <Container maxW="container.xl" pb={8}>
        {children}
      </Container>
      <Box as="footer" bg="gray.100" py={4} mt={8}>
        <Container maxW="container.xl">
          <Text textAlign="center" color="gray.600">
            © 2025 Gestor de Deudas y Gastos
          </Text>
        </Container>
      </Box>
    </Box>
  );
}